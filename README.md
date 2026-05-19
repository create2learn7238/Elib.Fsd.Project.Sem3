# BookHeaven E-Library

Node.js + Express + Neon PostgreSQL e-library with OTP registration, profile details, dummy card/QR payments, and admin management pages.

## Run Locally

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

## Admin Login

After running `neon_setup.sql`:

- Email: `admin@bookhaven.com`
- Password: `Admin@123`

Change the password after first login.

## Main Features

- Email OTP registration.
- After OTP, users must enter age and can add favorite author, genre, reading goal, and reader type.
- New users are auto-logged in after registration.
- Login redirects unknown emails to registration.
- Profile shows real join date from `created_at`.
- Dummy card payment and dummy QR payment are supported.
- QR payment can be completed by scanning the generated payment page or pressing `I Scanned, Pay Now`.
- Admin dashboard includes live stats and recent activity.

## Deploy On Render

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

## Project Files

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
