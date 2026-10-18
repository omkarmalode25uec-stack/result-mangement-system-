# Result Management System (RMS)
### Sanjivani College of Engineering, Kopargaon
*(An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)*

---

## 📌 Stage 1: Project Setup and UI Foundation

This project is a modern, responsive, full-stack Result Management System (RMS) developed for **Sanjivani College of Engineering**. The portal provides an official blue-and-white academic design for students, faculty, and examination controllers to view results, manage grade submissions, and generate authentic **Statements of Grades (Marksheets)** conforming to autonomous university standards.

---

## 🛠️ Technology Stack

- **Frontend:** React.js (v19) with Vite
- **Styling:** Tailwind CSS (Custom blue-and-white academic theme with print styling)
- **Icons:** Lucide React
- **Backend:** Node.js & Express.js (ES Modules)
- **Database:** MongoDB with Mongoose (Configured with graceful fallback for offline/development mode)
- **Language:** JavaScript throughout

---

## 📂 Project Architecture

```
RMS/
├── package.json              # Root package orchestrator with concurrent scripts
├── .gitignore                # Root gitignore protecting .env and node_modules
├── README.md                 # Complete system documentation
│
├── backend/                  # Express.js REST API & Mongoose models
│   ├── .env.example          # Environment variables template
│   ├── .env                  # Local environment file (never committed)
│   ├── .gitignore            # Backend-specific ignore list
│   ├── package.json          # Express, Mongoose, CORS, Dotenv, Nodemon
│   ├── server.js             # Express app entry point & middleware
│   ├── config/
│   │   └── db.js             # Mongoose connection with graceful fallback
│   ├── models/
│   │   ├── Student.js        # Student model (PRN, seatNo, motherName, branch)
│   │   ├── Course.js         # Course model (code, title, type, credits)
│   │   └── Marksheet.js      # Marksheet model (grades, GP, CR, EC, SGPA)
│   ├── routes/
│   │   └── api.js            # REST API endpoints (health, students, marksheet, stats)
│   └── data/
│       └── sampleData.js     # Clearly labeled fictional sample records
│
└── frontend/                 # React + Vite + Tailwind CSS Application
    ├── .env.example          # Frontend environment variables template
    ├── .env                  # Frontend local configuration
    ├── .gitignore            # Frontend-specific ignore list
    ├── package.json          # Frontend dependencies & Vite scripts
    ├── index.html            # Application entry with Sanjivani branding & fonts
    ├── vite.config.js        # Vite configuration
    ├── tailwind.config.js    # Sanjivani academic palette config
    ├── postcss.config.js     # PostCSS plugins
    └── src/
        ├── main.jsx          # React DOM entry
        ├── App.jsx           # Main router & state manager
        ├── index.css         # Tailwind directives & media print CSS
        ├── components/
        │   ├── Navbar.jsx    # Responsive navigation & role indicators
        │   ├── Footer.jsx    # Institutional footer & academic disclaimer
        │   ├── EmptyState.jsx# Reusable empty state component
        │   └── SanjivaniHeader.jsx # Institutional seal & Statement header
        ├── pages/
        │   ├── LandingPage.jsx     # Hero, quick PRN lookup & announcements
        │   ├── RoleLoginPage.jsx   # Role portal selection (No fake auth)
        │   ├── StudentDashboard.jsx# Student GPA, semester history & empty state
        │   ├── FacultyDashboard.jsx# Faculty course roster & evaluation queue
        │   ├── AdminDashboard.jsx  # COE metrics & master candidate registry
        │   └── MarksheetPreview.jsx# Authentic Statement of Grades preview
        └── data/
            └── fictionalData.js    # Fictional students, courses & marksheets
```

---

## 🚀 Getting Started & Startup Commands

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB** *(Optional for Stage 1)*: Backend server automatically detects local MongoDB daemon (`mongodb://127.0.0.1:27017/sanjivani_rms`) or runs in graceful offline/mock mode for UI evaluation.

### Option 1: Run Full-Stack Simultaneously (Recommended)
From the root `RMS` folder:
```bash
# 1. Install all dependencies across root, backend, and frontend
npm run install:all

# 2. Run both Backend API (port 5000) and Frontend (port 5173) concurrently
npm run dev
```

### Option 2: Run Frontend and Backend Individually

#### Starting the Backend API
```bash
cd backend
npm install
npm run dev
# Server will start on: http://localhost:5000
# API Health Check:   http://localhost:5000/api/health
```

#### Starting the Frontend UI
```bash
cd frontend
npm install
npm run dev
# Frontend will be live on: http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sanjivani_rms
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_COLLEGE_NAME=Sanjivani College of Engineering
```

> **Security Note:** `.env` files are ignored by `.gitignore` in both root, frontend, and backend to guarantee that secrets are never committed to version control.

---

## 📄 Stage 1 Implemented Pages & Features

1. **Landing Page (`/`):**
   - Institutional banner with Sanjivani Rural Education Society emblem placeholder.
   - Quick PRN Result Lookup with instant validation and feedback.
   - Direct portal selection cards for Students, Faculty, and Admin.
   - Examination Cell announcement board for Winter 2024 session notices.

2. **Role-Selection Login Page:**
   - Clearly separated access portals for Students (PRN & Mother's Name), Faculty (Faculty ID & Department), and COE Admin.
   - Complies strictly with the **No Fake Authentication** guideline: provides honest, transparent UI form previews with sample loaders and direct navigation to explore role dashboards.

3. **Student Dashboard:**
   - Candidate academic profile header (Aarav Rajesh Shinde, PRN `22UCO01042`).
   - Key academic KPIs: SGPA (8.71), CGPA (8.65), Earned Credits (21/21), Active Backlogs (0).
   - Enrolled course evaluation breakdown for Semester V.
   - Interactive semester tabs with a demonstration of a **clear empty state** when selecting upcoming Semester VI.

4. **Faculty Dashboard:**
   - Instructor identity header (Prof. R. M. Kulkarni, Computer Engineering).
   - Assigned course cards with student enrollment counts and submission badges.
   - Student roster table with internal marks, ESE scores, and grade status.
   - Toggle to preview an **empty state** when all submissions are completed.

5. **Admin / COE Dashboard:**
   - Controller of Examinations institutional metrics: 2,450 total candidates, 1,820 declared results, 94.8% pass percentage.
   - Master student registry with PRN search filter and direct Statement preview links.
   - Toggle to preview an **empty state** for resolved grievances.

6. **Statement of Grades (Marksheet Preview):**
   - High-fidelity visual replication of the Sanjivani College of Engineering Statement of Grades.
   - Dedicated space for all mandatory academic fields:
     - **PRN** (Permanent Registration Number)
     - **Student details** (Name, Mother's Name, Seat No., Branch, Degree)
     - **Academic Year & Semester** (2024-2025, Semester V Winter 2024 Exam)
     - **Subject codes & names** (CE501 Database Management Systems, etc.)
     - **Course Type** (`TH` Theory, `PR` Practical, `OR` Oral, `TW` Term Work, `PE` Professional Elective, `OE` Open Elective)
     - **Credits (CR) & Earned Credits (EC)**
     - **Grades & Grade Points (GP)**
     - **Credit Points** (CR × GP)
     - **Total CR, Total EC, Total GP, SGPA, CGPA**
     - **Result Status** (`PASS - FIRST CLASS WITH DISTINCTION`)
     - **Result Date** (`12-01-2025`)
   - Official 10-point UGC/SPPU Autonomous grading scheme legend.
   - Institutional authority signature blocks (Prepared By, Dean Academics, Controller of Examinations).
   - Print / Save as PDF capability formatted with clean `@media print` CSS rules.
   - Interactive candidate switcher (Aarav Shinde - CE, Priya Deshmukh - IT, or Withheld Marksheet Empty State).

---

## 🧪 Clearly Labelled Fictional Sample Data

All student profiles, PRNs, and marks are fictional learning assets:
- **Sample Student 1:** `AARAV RAJESH SHINDE` | PRN: `22UCO01042` | B.Tech Computer Engineering | SGPA: `8.71`
- **Sample Student 2:** `PRIYA SANJAY DESHMUKH` | PRN: `22UIT02015` | B.Tech Information Technology | SGPA: `8.90`
- **Sample Student 3:** `ROHAN DEEPAK PATIL` | PRN: `23UAI03028` | B.Tech AI & Data Science | SGPA: `8.45`

---

## ⚖️ Grading Standards Compliance

The system respects official UGC and Savitribai Phule Pune University autonomous grading conventions:
| Grade | Description | Grade Point (GP) | Marks Range |
| :---: | :--- | :---: | :---: |
| **O** | Outstanding | 10 | 90 – 100 |
| **A+** | Excellent | 9 | 80 – 89 |
| **A** | Very Good | 8 | 70 – 79 |
| **B+** | Good | 7 | 60 – 69 |
| **B** | Above Average | 6 | 50 – 59 |
| **C** | Average | 5 | 45 – 49 |
| **P** | Pass | 4 | 40 – 44 |
| **F** | Fail | 0 | Below 40 |

---

## 🏁 Git & Version Control

To review git status or commit changes:
```bash
git status
git add .
git commit -m "feat(rms): complete stage 1 project setup and UI foundation"
```
