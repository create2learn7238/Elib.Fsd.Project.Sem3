const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Resend } = require("resend");
const axios = require("axios");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =========================================================
// DIRECT CONFIGURATION (NO .env FILE)
// =========================================================
const APP_CONFIG = {
  // Render needs process.env.PORT. This is NOT a ".env file".
  PORT: process.env.PORT || 10000,
  HOST: "0.0.0.0",

  DATABASE_URL:
    "postgresql://neondb_owner:npg_v7AsBi1gJyMS@ep-jolly-cloud-ap23jjt4-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",

  PUBLIC_BASE_URL: "https://elib-fsd-project-sem3.onrender.com",

  // Put your real Resend key here (starts with re_)
  // Get it from: https://resend.com/api-keys
  RESEND_API_KEY: "re_72HYBj4o_GM7EkNfWFpJC3Bas5Kykx3ig",

  // Testing sender. For production, verify your domain in Resend and use noreply@yourdomain.com
  EMAIL_FROM: "onboarding@resend.dev",

  LOG_OTP_TO_CONSOLE: true,
  OTP_EXP_MINUTES: 10,
};

const app = express();
const PORT = APP_CONFIG.PORT;
const HOST = APP_CONFIG.HOST;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());

// Keeping your existing behavior (serves files from project root)
app.use(express.static(__dirname));

// --- STATIC UPLOADS ---
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");
app.use("/uploads", express.static("uploads"));

// --- DATABASE CONNECTION ---
const db = new Pool({
  connectionString: APP_CONFIG.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

db.connect()
  .then((client) => {
    console.log("Connected to Neon PostgreSQL");
    client.release();
  })
  .catch((err) => console.error("DB Connection Error:", err.message));

const query = async (sql, params = []) => {
  const result = await db.query(sql, params);
  return result.rows;
};

// --- SCHEMA SETUP ---
const ensureSchema = async () => {
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS age INTEGER,
      ADD COLUMN IF NOT EXISTS favorite_author VARCHAR(100),
      ADD COLUMN IF NOT EXISTS favorite_genre VARCHAR(80),
      ADD COLUMN IF NOT EXISTS reading_goal VARCHAR(80),
      ADD COLUMN IF NOT EXISTS reading_level VARCHAR(80),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
  `);

  await query(`UPDATE users SET created_at = NOW() WHERE created_at IS NULL`);

  await query(`
    ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) DEFAULT 'Card'
  `);
};

// =========================================================
// EMAIL SERVICE (Resend) - NO SMTP
// =========================================================
let resend = null;

try {
  if (
    APP_CONFIG.RESEND_API_KEY &&
    APP_CONFIG.RESEND_API_KEY.startsWith("re_") &&
    APP_CONFIG.RESEND_API_KEY !== "re_PASTE_YOUR_REAL_KEY_HERE"
  ) {
    resend = new Resend(APP_CONFIG.RESEND_API_KEY);
    console.log("Resend Email API initialized");
    console.log(`Email From: ${APP_CONFIG.EMAIL_FROM}`);
  } else {
    console.warn("RESEND_API_KEY not set. Email will run in DEMO (console) mode.");
  }
} catch (e) {
  console.error("Resend init error:", e.message);
}

const sendEmail = async (to, subject, htmlContent) => {
  if (!to) throw new Error("Recipient email missing");

  // Real mode
  if (resend) {
    const { data, error } = await resend.emails.send({
      from: APP_CONFIG.EMAIL_FROM,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      throw new Error(error.message || "Resend email failed");
    }

    console.log(`Email sent to ${to} (id: ${data?.id})`);
    return { success: true, messageId: data?.id };
  }

  // Demo mode (no key)
  console.log("\n===== DEMO EMAIL MODE =====");
  console.log("To:", to);
  console.log("Subject:", subject);
  const otpMatch = htmlContent.match(/\b\d{6}\b/);
  if (otpMatch) console.log("OTP:", otpMatch[0]);
  console.log("===========================\n");

  return { success: true, warning: "Demo mode (no RESEND_API_KEY configured)" };
};

// =========================================================
// OTP STORE (in-memory). Resets on server restart.
// =========================================================
// otpStore[email] = { code: "123456", expiresAt: 1234567890 }
let otpStore = {};
let activeTransactions = {};

// SIMPLIFIED OTP VALIDATION - Accepts any 6-digit number
const isOtpValid = (email, otp) => {
  if (!email || !otp) return false;
  
  // Check if OTP is exactly 6 digits
  const otpString = String(otp).trim();
  if (!/^\d{6}$/.test(otpString)) return false;
  
  // Accept any valid 6-digit number (no verification needed)
  return true;
};

const buildSafeUser = async (user) => {
  const history = await query(
    `SELECT item_name AS title, transaction_date AS date, payment_method
     FROM payments
     WHERE user_email=$1
     ORDER BY transaction_date DESC`,
    [user.email]
  );

  const safeUser = { ...user, history };
  delete safeUser.password;
  return safeUser;
};

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, "slide-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const getNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// =============================================
// ROUTES
// =============================================

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(__dirname, "profile.html")));

app.get("/api/books", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM books ORDER BY id");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/email-status", (req, res) => {
  res.json({
    success: true,
    configured: !!resend,
    service: "Resend",
    from: APP_CONFIG.EMAIL_FROM,
    status: resend ? "active" : "demo_mode",
    message: resend ? "Email service ready" : "Resend API key not configured",
  });
});

// ========== OTP - SIMPLIFIED (No Email Sending) ==========
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Email is required" });

  try {
    const rows = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (rows.length > 0) return res.json({ success: false, message: "Email already exists" });

    // Generate a random 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + APP_CONFIG.OTP_EXP_MINUTES * 60 * 1000;

    // Store OTP (though we won't verify it anymore)
    otpStore[email] = { code: otp, expiresAt };

    if (APP_CONFIG.LOG_OTP_TO_CONSOLE) {
      console.log(`[DEMO] Any 6-digit OTP will work. Generated: ${otp} for ${email}`);
    }

    // Return success without sending email
    res.json({ 
      success: true, 
      message: "OTP ready! Any 6-digit number will work for verification.",
      demoOtp: otp // Optional: send back for testing
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Failed to process OTP", error: err.message });
  }
});

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  // Check if OTP is a valid 6-digit number
  if (!/^\d{6}$/.test(String(otp).trim())) {
    return res.json({ success: false, message: "Please enter a valid 6-digit OTP" });
  }

  // Accept any 6-digit number
  res.json({ success: true, message: "OTP verified successfully" });
});

// ========== AUTH ==========
app.post("/api/register", async (req, res) => {
  const {
    username,
    email,
    password,
    otp,
    age,
    favorite_author,
    favorite_genre,
    reading_goal,
    reading_level,
  } = req.body;

  // Validate OTP is 6 digits (any 6-digit number works)
  if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
    return res.json({ success: false, message: "Please enter a valid 6-digit OTP" });
  }

  const parsedAge = Number.parseInt(age, 10);
  if (!parsedAge || parsedAge < 5 || parsedAge > 120) {
    return res.json({ success: false, message: "Please enter a valid age" });
  }

  try {
    const exists = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.length > 0) return res.json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const rows = await query(
      `INSERT INTO users
        (username, email, password, membership_plan, age, favorite_author, favorite_genre, reading_goal, reading_level, created_at)
       VALUES
        ($1, $2, $3, 'free', $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        username,
        email,
        hashedPassword,
        parsedAge,
        favorite_author || null,
        favorite_genre || null,
        reading_goal || null,
        reading_level || null,
      ]
    );

    // Clean up OTP store if exists
    delete otpStore[email];

    const user = await buildSafeUser(rows[0]);
    res.json({ success: true, message: "Registered!", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const rows = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "No account found. Please register first.",
      });
    }

    let user = rows[0];
    const match = await bcrypt.compare(password || "", user.password || "");
    if (!match) return res.json({ success: false, message: "Invalid Email or Password" });

    if (user.end_date && new Date(user.end_date) < new Date()) {
      await query(
        "UPDATE users SET membership_plan='free', start_date=NULL, end_date=NULL WHERE id=$1",
        [user.id]
      );
      user.membership_plan = "free";
      user.end_date = null;
    }

    await query("UPDATE users SET last_login=NOW() WHERE id=$1", [user.id]);
    user.last_login = new Date().toISOString();

    res.json({ success: true, user: await buildSafeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/change-password", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    const rows = await query("SELECT * FROM users WHERE email=$1", [email]);
    if (rows.length === 0) return res.json({ success: false, message: "Account not found" });

    const match = await bcrypt.compare(oldPassword || "", rows[0].password || "");
    if (!match) return res.json({ success: false, message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password=$1 WHERE email=$2", [hashed, email]);

    res.json({ success: true, message: "Password changed!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== USER DETAILS ==========
app.get("/api/user-details", async (req, res) => {
  const { email } = req.query;

  try {
    const rows = await query("SELECT * FROM users WHERE email=$1", [email]);
    if (rows.length === 0) return res.status(404).json({ success: false });

    res.json({ success: true, user: await buildSafeUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/user-details", async (req, res) => {
  const { email, username, age, favorite_author, favorite_genre, reading_goal, reading_level } =
    req.body;

  const parsedAge = Number.parseInt(age, 10);

  if (!email) return res.json({ success: false, message: "Email is required" });
  if (!username || username.trim().length < 2)
    return res.json({ success: false, message: "Name must be at least 2 characters" });
  if (!parsedAge || parsedAge < 5 || parsedAge > 120)
    return res.json({ success: false, message: "Please enter a valid age" });

  try {
    const rows = await query(
      `UPDATE users
       SET username=$1, age=$2, favorite_author=$3, favorite_genre=$4, reading_goal=$5, reading_level=$6
       WHERE email=$7
       RETURNING *`,
      [
        username.trim(),
        parsedAge,
        favorite_author || null,
        favorite_genre || null,
        reading_goal || null,
        reading_level || null,
        email,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user: await buildSafeUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========== MEMBERSHIP / PAYMENTS ==========
app.post("/api/update-membership-status", async (req, res) => {
  const { email, plan, end_date, price, item_name, purchasedBooks, payment_method } = req.body;

  const startDate = getNow();
  const endDate = end_date
    ? new Date(end_date).toISOString().slice(0, 19).replace("T", " ")
    : null;
  const method = payment_method || "Card";

  try {
    await query("UPDATE users SET membership_plan=$1, start_date=$2, end_date=$3 WHERE email=$4", [
      plan,
      startDate,
      endDate,
      email,
    ]);

    const booksToSave = Array.isArray(purchasedBooks) ? purchasedBooks : [];
    for (const title of booksToSave) {
      await query(
        "INSERT INTO payments (user_email, item_name, amount, transaction_date, payment_method) VALUES ($1,$2,$3,$4,$5)",
        [email, title, 0, startDate, method]
      );
    }

    await query(
      "INSERT INTO payments (user_email, item_name, amount, transaction_date, payment_method) VALUES ($1,$2,$3,$4,$5)",
      [email, item_name || plan, price || 0, startDate, method]
    );

    const rows = await query("SELECT * FROM users WHERE email=$1", [email]);
    res.json({ success: true, user: await buildSafeUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download proxy
app.get("/api/download", async (req, res) => {
  const { url, filename } = req.query;

  try {
    const response = await axios({ url, method: "GET", responseType: "stream" });
    res.setHeader("Content-Disposition", `attachment; filename="${filename || "book.pdf"}"`);
    response.data.pipe(res);
  } catch (e) {
    res.redirect(url);
  }
});

// =============================================
// ADMIN ROUTES
// =============================================
app.get("/api/admin/users", async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, username, email, membership_plan, role, start_date, end_date,
             age, favorite_author, favorite_genre, reading_goal, reading_level,
             created_at, last_login
      FROM users
      ORDER BY id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const userStats = await query(`
      SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS admin_users,
        COUNT(*) FILTER (WHERE membership_plan <> 'free' AND (end_date IS NULL OR end_date > NOW()))::int AS active_members,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_users
      FROM users
    `);

    const bookStats = await query(`
      SELECT
        COUNT(*)::int AS total_books,
        COUNT(*) FILTER (WHERE is_free = 1)::int AS free_books
      FROM books
    `);

    const paymentStats = await query(`
      SELECT
        COUNT(*)::int AS total_payments,
        COALESCE(SUM(amount), 0)::numeric AS total_revenue
      FROM payments
    `);

    const recentPayments = await query(`
      SELECT id, user_email, item_name, amount, transaction_date, payment_method
      FROM payments
      ORDER BY transaction_date DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      users: userStats[0],
      books: bookStats[0],
      payments: paymentStats[0],
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/admin/add-book", async (req, res) => {
  const { title, author, category, cover_url, book_url, price, is_free, description } = req.body;
  const isFree = is_free === true || is_free === 1 || is_free === "1";

  try {
    await query(
      `INSERT INTO books (title, author, category, cover_url, book_url, price, is_free, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        title,
        author,
        category || null,
        cover_url,
        book_url,
        price || 0,
        isFree ? 1 : 0,
        description || null,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/admin/delete-book/:id", async (req, res) => {
  try {
    await query("DELETE FROM books WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.put("/api/admin/edit-book/:id", async (req, res) => {
  const { title, author, category, cover_url, book_url, price, is_free, description } = req.body;
  const isFree = is_free === true || is_free === 1 || is_free === "1";

  try {
    await query(
      `UPDATE books
       SET title=$1, author=$2, category=$3, cover_url=$4, book_url=$5, price=$6, is_free=$7, description=$8
       WHERE id=$9`,
      [
        title,
        author,
        category || null,
        cover_url,
        book_url,
        price || 0,
        isFree ? 1 : 0,
        description || null,
        req.params.id,
      ]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.delete("/api/admin/delete-user/:id", async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/payments", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM payments ORDER BY transaction_date DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// Carousel
app.get("/api/carousel", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM carousel_slides ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.get("/api/admin/carousel", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM carousel_slides ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

app.post("/api/admin/carousel", upload.single("image"), async (req, res) => {
  const { title, subtitle } = req.body;
  const imageUrl = req.file ? "/uploads/" + req.file.filename : "";

  try {
    await query("INSERT INTO carousel_slides (title, subtitle, image_url) VALUES ($1,$2,$3)", [
      title,
      subtitle,
      imageUrl,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/admin/carousel/:id", async (req, res) => {
  try {
    await query("DELETE FROM carousel_slides WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// =============================================
// QR DEMO PAYMENT ROUTES
// =============================================
app.post("/api/qr/generate", (req, res) => {
  const txId = "TXN_" + Math.floor(100000 + Math.random() * 900000);
  activeTransactions[txId] = "PENDING";
  const amount = req.body.amount || 0;

  const paymentUrl = `${APP_CONFIG.PUBLIC_BASE_URL}/mobile-payment/${txId}?amount=${encodeURIComponent(
    amount
  )}`;

  res.json({ success: true, txId, paymentUrl });
});

app.get("/mobile-payment/:txId", (req, res) => {
  const { txId } = req.params;
  const amount = req.query.amount || 0;

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Confirm Payment</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;background:#07051a;color:white;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px}
    .card{background:linear-gradient(145deg,#140f35,#0d0a28);padding:30px;border-radius:22px;text-align:center;width:100%;max-width:420px;box-shadow:0 24px 70px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.12)}
    .pill{display:inline-block;padding:6px 12px;border:1px solid rgba(139,92,246,.35);border-radius:999px;color:#c4b5fd;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    h2{color:#fff;margin:16px 0 8px;font-size:30px}
    .amount{font-size:42px;color:#34d399;font-weight:900;margin:22px 0}
    p{color:rgba(255,255,255,.62)}
    .btn{display:block;width:100%;padding:15px;margin:10px 0;border:none;border-radius:14px;font-size:17px;cursor:pointer;font-weight:800}
    .btn-confirm{background:linear-gradient(135deg,#8b5cf6,#d946ef);color:white}
    .btn-cancel{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.35);color:#fca5a5}
  </style>
</head>
<body>
  <div class="card">
    <span class="pill">Demo checkout</span>
    <h2>BookHeaven Pay</h2>
    <p>Transaction ID: ${txId}</p>
    <div class="amount">Rs.${amount}</div>
    <button class="btn btn-confirm" onclick="updateStatus('SUCCESS')">Pay Securely</button>
    <button class="btn btn-cancel" onclick="updateStatus('FAILED')">Cancel Transaction</button>
  </div>

  <script>
    function updateStatus(s){
      fetch('${APP_CONFIG.PUBLIC_BASE_URL}/api/qr/update/${txId}/' + s, { method:'POST' })
        .then(() => {
          document.body.innerHTML =
            '<div style="text-align:center;padding:40px">' +
            '<h1>' + (s === 'SUCCESS' ? 'Paid!' : 'Cancelled') + '</h1>' +
            '<p>Check your desktop screen.</p>' +
            '</div>';
        });
    }
  </script>
</body>
</html>`);
});

app.post("/api/qr/update/:txId/:status", (req, res) => {
  const { txId, status } = req.params;
  if (activeTransactions[txId]) activeTransactions[txId] = status;
  res.json({ success: true });
});

app.get("/api/qr/status/:txId", (req, res) => {
  res.json({ success: true, status: activeTransactions[req.params.txId] || "PENDING" });
});

// =============================================
// START SERVER
// =============================================
const startServer = async () => {
  try {
    await ensureSchema();
    console.log("Schema ready");
  } catch (err) {
    console.error("Schema sync warning:", err.message);
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server running at ${APP_CONFIG.PUBLIC_BASE_URL}`);
    console.log(`Email: ${resend ? "Resend Active" : "Demo Mode (Console Only)"}`);
    console.log(`OTP Verification: DISABLED - Any 6-digit number will work`);
  });
};

startServer();