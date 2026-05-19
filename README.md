# 📚 BookHeaven E-Library

> A modern, full-stack e-library platform with secure authentication, user profiling, payment simulation, and comprehensive admin management.

Node.js + Express + Neon PostgreSQL e-library with OTP registration, profile details, dummy card/QR payments, and admin management pages.

---

## 🎯 Project Overview

**BookHeaven** is a feature-rich e-library system designed for managing digital books, user engagement, and library operations. Built with a modern tech stack, it provides a seamless experience for readers and robust tools for administrators.

### Core Purpose
- Provide users with an intuitive platform to explore, read, and manage digital books
- Enable administrators to manage inventory, users, payments, and content distribution
- Offer secure authentication with email-based OTP verification
- Support user profiling with reading preferences and goals
- Simulate payment transactions for demo/development purposes

### Who It's For
- **End Users**: Readers looking for a digital library experience with personalized features
- **Administrators**: Library managers needing dashboard insights and control systems
- **Developers**: A complete full-stack learning project demonstrating modern web development practices

### Key Characteristics
- ✅ **Secure**: OTP-based registration with bcrypt password hashing
- ✅ **User-Centric**: Personalized profiles with reading preferences and goals
- ✅ **Admin-Powered**: Complete dashboard with live stats and activity tracking
- ✅ **Payment-Ready**: Dual payment simulation (Card & QR code)
- ✅ **Cloud-Native**: Deployed on Render with Neon PostgreSQL database
- ✅ **Production-Grade**: Environment-based configuration and error handling

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18.0.0
- npm or yarn package manager
- Neon PostgreSQL account (free tier available)
- Gmail account for OTP emails (with app password)

### Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and fill in:
   ```env
   DATABASE_URL=your_neon_connection_string
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   PORT=5000
   ```

3. In Neon SQL Editor, run `neon_setup.sql` once. It creates and upgrades the needed tables.

4. Start the app:
   ```bash
   npm start
   ```

5. Open:
   ```text
   http://localhost:5000
   ```

For development auto-reload:
```bash
npm run dev
```

---

## 🛡️ Admin Login

After running `neon_setup.sql`:

- Email: `admin@bookhaven.com`
- Password: `Admin@123`

Change the password after first login.

---

## ✨ Main Features

- Email OTP registration.
- After OTP, users must enter age and can add favorite author, genre, reading goal, and reader type.
- New users are auto-logged in after registration.
- Login redirects unknown emails to registration.
- Profile shows real join date from `created_at`.
- Users can edit reader details from the profile page.
- Library browsing supports live search, category chips, sorting, and surprise book opening.
- Dummy card payment and dummy QR payment are supported.
- QR payment can be completed by scanning the generated payment page or pressing `I Scanned, Pay Now`.
- Admin dashboard includes live stats and recent activity.
- Admin book, user, and payment tables include search/filter controls.

### User Features
| Feature | Description |
|---------|-------------|
| 📧 **OTP Registration** | Secure email-based account creation with one-time passwords |
| 👤 **User Profiling** | Track age, favorite authors, genres, reading goals, and reader type |
| 🔑 **Auto-Login** | New users are automatically logged in post-registration |
| 💳 **Smart Redirects** | Unknown emails are automatically directed to registration |
| 📊 **Profile Analytics** | Real join dates and reading activity tracking |

### Admin Features
| Feature | Description |
|---------|-------------|
| 📈 **Live Dashboard** | Real-time stats and analytics overview |
| 📚 **Book Management** | Add, edit, and organize library inventory |
| 👥 **User Management** | Monitor, manage, and support users |
| 💰 **Payment Logs** | Track all simulated transactions |
| 🎠 **Carousel Management** | Customize hero slide content |
| 📊 **Activity Tracking** | Recent user activities and engagement metrics |

---

## 🌐 Deploy On Render

1. Push the project to GitHub.

2. In Render, create a new Web Service and connect the repo.

3. Use:
   ```text
   Build Command: npm install
   Start Command: npm start
   Runtime: Node
   ```

4. Add environment variables in Render:
   ```text
   DATABASE_URL
   EMAIL_USER
   EMAIL_PASS
   NODE_ENV=production
   ```

5. Optional but helpful for QR links:
   ```text
   RENDER_EXTERNAL_URL=https://your-render-service.onrender.com
   ```

6. Run `neon_setup.sql` in Neon before opening the deployed site.

---

## 📁 Project Structure

```text
server.js              Express backend and APIs
index.html             Main library UI
profile.html           User profile page
admin.html             Admin dashboard
admin-books.html       Book management
admin-users.html       User management
admin-payments.html    Payment logs
admin-carousel.html    Hero slide management
style.css              Shared UI theme
neon_setup.sql         Neon database setup and upgrades
render.yaml            Render service config
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js ≥ 18.0.0
- **Framework**: Express.js 5.2.1
- **Database**: Neon PostgreSQL
- **Authentication**: Bcrypt 6.0.0 for password hashing

### Frontend
- **Markup**: HTML5
- **Styling**: CSS3 (responsive design)
- **HTTP Client**: Axios 1.13.5

### DevOps & Infrastructure
- **Package Manager**: npm
- **Development**: Nodemon 3.1.0 for auto-reload
- **Deployment**: Render.com
- **Database Hosting**: Neon PostgreSQL
- **Email Service**: Nodemailer 8.0.1 (Gmail SMTP)

### Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| axios | ^1.13.5 | HTTP requests |
| bcrypt | ^6.0.0 | Password hashing |
| body-parser | ^2.2.2 | Request body parsing |
| cors | ^2.8.6 | Cross-origin resource sharing |
| dotenv | ^16.4.5 | Environment variable management |
| express | ^5.2.1 | Web framework |
| multer | ^2.0.2 | File upload handling |
| nodemailer | ^8.0.1 | Email delivery (OTP) |
| pg | ^8.13.3 | PostgreSQL client |

---

## 🔐 Security Features

- ✅ **Password Hashing**: Bcrypt for secure credential storage
- ✅ **Email Verification**: OTP-based registration prevents spam
- ✅ **Environment Variables**: Sensitive credentials never hardcoded
- ✅ **CORS Protection**: Cross-origin requests controlled
- ✅ **Admin Authentication**: Dedicated admin login system

---

## 📝 License

This project is provided as-is for educational and development purposes.
