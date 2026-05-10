# 🚀 ATS Pro — Applicant Tracking System

A full-stack, production-ready Applicant Tracking System built with **React.js + Node.js + Express + MySQL**.

---

## 📦 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React.js 18, React Router v6        |
| Backend     | Node.js, Express.js                 |
| Database    | MySQL + Sequelize ORM               |
| Auth        | JWT (JSON Web Tokens)               |
| Charts      | Chart.js + react-chartjs-2          |
| Drag & Drop | @hello-pangea/dnd                   |
| Styling     | Custom CSS (no framework)           |

---

## ⚙️ Prerequisites

Before running the app, make sure you have installed:

- **Node.js** v18+ → https://nodejs.org
- **MySQL** v8+ → https://dev.mysql.com/downloads/
- **npm** (comes with Node.js)

---

## 🗄️ Step 1: Create MySQL Database

Open MySQL Workbench or terminal and run:

```sql
CREATE DATABASE ats_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 🔧 Step 2: Configure Environment

Copy the example env file and edit it:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ats_db
DB_USER=root
DB_PASSWORD=your_mysql_password_here
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 📥 Step 3: Install Dependencies

From the root `ats-app/` folder:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 🌱 Step 4: Seed the Database (Optional but Recommended)

This creates sample users, clients, jobs, candidates, and interviews so you can explore the app immediately:

```bash
cd backend
node seed.js
```

After seeding, you can log in with:
- **Super Admin**: `admin@ats.com` / `admin123`
- **Recruiter**: `priya@ats.com` / `recruiter123`

---

## ▶️ Step 5: Run the Application

### Option A: Two separate terminals (recommended)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# App opens on http://localhost:3000
```

### Option B: Production build

```bash
# Build frontend
cd frontend
npm run build

# Serve using backend (add static serving to server.js)
cd ../backend
npm start
```

---

## 🌐 Features

### ✅ Authentication & Roles
- JWT-based secure login
- 3 roles: Super Admin, Recruiter, Client
- Role-based navigation and access control

### ✅ Dashboard
- Live stats: candidates, open jobs, active clients, upcoming interviews
- Monthly hiring bar chart
- Candidate status doughnut chart
- Recent candidates + upcoming interviews

### ✅ Candidate Management
- Add / Edit / Delete candidates
- Resume upload (PDF/DOC, max 5MB)
- Skills, experience, CTC, notice period tracking
- Status: New → Screening → Interview → Offered → Hired / Rejected
- Search by name/email, filter by status, pagination

### ✅ Recruitment Pipeline (Kanban)
- Visual drag-and-drop Kanban board
- 6 stages with live status update
- Real-time optimistic UI updates

### ✅ Client Management
- Company profiles with contact details
- Card-based grid layout
- Filter by status

### ✅ Job Management
- Create job postings with skills, salary range, type
- Track openings and deadlines
- Link to clients, see candidate count

### ✅ Interview Scheduling
- Schedule with date/time, mode, round
- Assign interviewer
- Track status and outcome
- Add notes and feedback

### ✅ User Management (Super Admin only)
- Add/Edit/Delete team members
- Assign roles
- Activate/Deactivate accounts

---

## 📁 Project Structure

```
ats-app/
├── backend/
│   ├── models/          # Sequelize models
│   ├── routes/          # Express route handlers
│   ├── middleware/       # Auth middleware
│   ├── uploads/         # Resume uploads
│   ├── server.js        # Main server entry
│   ├── seed.js          # Database seeder
│   └── .env.example     # Environment template
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/  # Sidebar, Layout
        ├── context/     # AuthContext
        ├── hooks/       # API helpers
        ├── pages/       # All page components
        ├── App.js
        └── index.css    # Global design system
```

---

## 🔒 API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| POST   | /api/auth/login                 | Login                    |
| GET    | /api/auth/me                    | Current user             |
| GET    | /api/candidates                 | List candidates          |
| POST   | /api/candidates                 | Add candidate            |
| PUT    | /api/candidates/:id             | Update candidate         |
| PATCH  | /api/candidates/:id/status      | Update status (kanban)   |
| DELETE | /api/candidates/:id             | Delete candidate         |
| GET    | /api/clients                    | List clients             |
| POST   | /api/clients                    | Add client               |
| GET    | /api/jobs                       | List jobs                |
| POST   | /api/jobs                       | Create job               |
| GET    | /api/interviews                 | List interviews          |
| POST   | /api/interviews                 | Schedule interview       |
| GET    | /api/dashboard/stats            | Dashboard statistics     |
| GET    | /api/users                      | List users (admin only)  |

---

## 🛠️ Troubleshooting

**MySQL connection error:**
- Make sure MySQL service is running
- Check DB_HOST, DB_USER, DB_PASSWORD in .env
- Ensure `ats_db` database exists

**Port already in use:**
- Backend: change PORT in .env
- Frontend: set PORT=3001 in frontend/.env

**npm install errors:**
- Delete node_modules and package-lock.json, then run npm install again

---

## 🚀 Future Improvements (Phase 2)
- AI Resume Parsing
- Email notifications
- Job board integration
- Chrome Extension
- Advanced analytics & export
- Multi-company SaaS version

---

Built with ❤️ by **Naman Jain**
