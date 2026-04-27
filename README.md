# GymPro - Gym Management System

A local-first gym management web app for small gym owners.

Tech Stack: React + Vite (Frontend) | Node.js + Express (Backend) | MongoDB (Database)

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create or update `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/gym_management
JWT_SECRET=your_secret
JWT_EXPIRE=7d
```

Start backend:

```bash
npm run dev
```

API runs on `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`.

### 3. First Login
- Open the app and register the first admin account (one-time setup).
- Then login with those credentials.

## Notes
- Default membership plans (Monthly, Quarterly, Yearly) are auto-seeded on first backend start.
- Frontend is web-only (mobile/Capacitor folders removed).
