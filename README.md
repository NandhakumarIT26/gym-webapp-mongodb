# 🏋️ GymPro — Gym Management System

A local-first gym management MVP built for small gym owners.

**Tech Stack:** React + Vite (Frontend) · Node.js + Express (Backend) · MySQL (Database)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Database Setup

```sql
-- In MySQL Workbench or your MySQL client:
SOURCE backend/src/config/schema.sql;
```

Or run it via CLI:
```bash
mysql -u root -p < backend/src/config/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Edit .env with your MySQL credentials
# DB_PASSWORD=your_mysql_password

npm install
npm run dev
# API runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### 4. Login
- **Username:** `admin`
- **Password:** `admin123`

---

## 📁 Project Structure

```
gym_app/
├── backend/
│   ├── src/
│   │   ├── config/       # DB pool + schema.sql
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # JWT auth
│   │   └── routes/       # Express routers
│   ├── .env              # ⚠️ Edit with your DB credentials
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Sidebar
│   │   ├── context/      # Auth context
│   │   └── pages/        # All pages
│   └── package.json
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET/POST | `/api/members` | List / Create |
| GET/PUT/DELETE | `/api/members/:id` | Get / Update / Delete |
| GET/POST | `/api/plans` | Plans CRUD |
| GET | `/api/attendance` | List attendance |
| POST | `/api/attendance/checkin` | Manual check-in (name/phone) |
| POST | `/api/attendance/checkin-by-id` | Check-in by member ID |
| POST | `/api/attendance/qr-checkin` | Check-in by QR token |
| GET | `/api/attendance/qr/:id` | Get member QR code |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/reminders/expiring` | Expiring members |
| POST | `/api/reminders/send` | Log reminder + get share URL |
| GET/POST | `/api/payments` | List / Generate payment |
| PUT | `/api/payments/:id/status` | Mark paid/pending |

---

## 🔒 Auth

JWT-based authentication. All API routes (except `/api/auth/login`) require:
```
Authorization: Bearer <token>
```

---

## 📦 Electron / Tauri Packaging

This project is structured for desktop packaging:

1. Backend uses `localhost` + `PORT` env — easy to start as child process from Electron.
2. Frontend uses `VITE_API_URL` env variable — set to `http://localhost:5000/api`.
3. Add `electron/main.js` that spawns the backend server and opens a BrowserWindow.

---

## 🌟 Features

- ✅ Member management (CRUD + search)
- ✅ Membership plans with auto-expiry calculation
- ✅ Attendance — manual (name/phone) + QR code
- ✅ QR code generation per member (downloadable)
- ✅ Dashboard with charts and live stats
- ✅ Renewal reminders (3-day / 7-day / expired categories)
- ✅ WhatsApp & SMS deep links for reminders
- ✅ Payment link generation with UPI support
- ✅ JWT authentication for gym owner login
