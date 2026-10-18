# Result Management System (RMS)
### Sanjivani College of Engineering, Kopargaon
*(An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)*

---

## 📌 Project Overview

This project is a modern, full-stack Result Management System (RMS) designed for **Sanjivani College of Engineering**. The portal provides an authentic blue-and-white academic user interface and secure backend for students, faculty, and examination controllers (COE) to view results, manage grade submissions, provision verified candidate accounts, and inspect autonomous **Statements of Grades (Marksheets)** conforming to Savitribai Phule Pune University standards.

---

## 🛠️ Technology Stack

- **Frontend:** React.js (v19) with Vite
- **Styling:** Tailwind CSS (Custom blue-and-white academic theme with print styling)
- **Icons:** Lucide React
- **Backend:** Node.js & Express.js (ES Modules)
- **Database:** MongoDB with Mongoose (with automated seeding and graceful offline fallback)
- **Authentication & Security:** bcryptjs password hashing, JSON Web Tokens (JWT), secure HTTP-only cookies (`cookie-parser`), and role-based access control (RBAC)
- **Language:** JavaScript throughout

---

## 📂 Project Architecture

```
RMS/
├── package.json              # Root orchestrator with dev, build, test, and seed scripts
├── .gitignore                # Root gitignore protecting .env and build artifacts
├── README.md                 # Complete system documentation
│
├── backend/                  # Node.js & Express.js REST API
│   ├── .env.example          # Environment variables template
│   ├── .env                  # Local environment file (never committed)
│   ├── .gitignore            # Backend-specific ignore list
│   ├── package.json          # Express, Mongoose, JWT, bcryptjs, cookie-parser
│   ├── server.js             # API entry point, cookie parser & route mounters
│   ├── config/
│   │   └── db.js             # Mongoose connection with graceful connection fallback
│   ├── middleware/
│   │   └── auth.js           # authenticate, authorize, and enforceStudentRecordAccess
│   ├── models/
│   │   ├── User.js               # Authentication accounts with bcrypt hashing
│   │   ├── StudentProfile.js     # Student profile (PRN, rollNo, seatNo, branch)
│   │   ├── FacultyProfile.js     # Faculty profile (employeeId, name, department)
│   │   ├── AcademicSession.js    # Academic years & semesters (compound index)
│   │   ├── Subject.js            # Course subjects, types (TH, PR, TW, etc.) & credits
│   │   ├── FacultyAssignment.js  # Faculty-subject assignments & divisions
│   │   └── ResultRecord.js       # Marksheet result records (CR, EC, GP, SGPA, CGPA)
│   ├── routes/
│   │   ├── auth.js           # /api/auth (login, logout, me, register rejection)
│   │   ├── admin.js          # /api/admin (authorized provisioning & user registry)
│   │   └── api.js            # /api (health, info, students, marksheets, sessions)
│   ├── utils/
│   │   └── seedData.js       # Automated database seeder with authorized test accounts
│   ├── tests/
│   │   └── runTests.js       # 21-point automated test suite for Stage 2
│   └── data/
│       └── sampleData.js     # Fictional sample records
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
        ├── App.jsx           # Main router & state manager wrapped in AuthProvider
        ├── index.css         # Tailwind directives & media print CSS
        ├── context/
        │   └── AuthContext.jsx # Global session management & cookie login/logout
        ├── components/
        │   ├── Navbar.jsx    # Responsive navigation, role indicators & logout
        │   ├── Footer.jsx    # Institutional footer & academic disclaimer
        │   ├── EmptyState.jsx# Reusable empty state component
        │   └── SanjivaniHeader.jsx # SRES & Autonomous institutional seal header
        ├── pages/
        │   ├── LandingPage.jsx     # Hero, quick PRN lookup & announcements
        │   ├── RoleLoginPage.jsx   # Role portal with real auth & 1-click test fill
        │   ├── StudentDashboard.jsx# Student GPA, semester history & empty state
        │   ├── FacultyDashboard.jsx# Faculty course roster & evaluation queue
        │   ├── AdminDashboard.jsx  # COE metrics, student registry & provisioning desk
        │   └── MarksheetPreview.jsx# Authentic Statement of Grades preview
        └── data/
            └── fictionalData.js    # Fictional students, courses & marksheets
```

---

## 🔐 Stage 2: Authentication & Security Architecture

### 1. User Roles & Capabilities
| Role | Login Identifier | Default Capabilities |
| :--- | :--- | :--- |
| **Student** | PRN + Password | View personal academic profile, current semester performance, semester history, and download/print verified Statement of Grades. **Strictly restricted from viewing other students' records.** |
| **Faculty** | Email / Employee ID + Password | Access Faculty Evaluation Desk, inspect assigned courses, view student roster marks, and monitor evaluation completion status. |
| **Admin** | Email / Admin ID + Password | Access Controller of Examinations (COE) Control Room, view institutional metrics, inspect master candidate registry, and **provision authorized student, faculty, and admin accounts**. |

### 2. Pre-Seeded Authorized Test Credentials
The database automatically seeds these authorized test accounts on startup:

| Role | Username / Identifier | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student (CE)** | `22UCO01042` | `Student@123` | Aarav Rajesh Shinde (B.Tech Computer Engineering) |
| **Student (IT)** | `22UIT02015` | `Student@123` | Priya Sanjay Deshmukh (B.Tech Information Technology) |
| **Faculty** | `faculty.cs@sanjivani.edu.in` | `Faculty@123` | Prof. R. M. Kulkarni (Computer Engineering) |
| **Admin (COE)** | `admin@sanjivani.edu.in` | `Admin@123` | Dr. K. S. Patil (Controller of Examinations) |

> **Convenience Feature:** On the **Role-Selection Login** page (`/login`), click the **"Auto-Fill Credentials"** button on any tab to populate credentials instantly.

### 3. Security Highlights
- **Password Hashing:** All passwords are encrypted with `bcrypt` (10 salt rounds). Plaintext passwords are never saved.
- **Password Exposure Prevention:** Mongoose `toJSON` transforms and API projections (`.select('-passwordHash')`) guarantee that password hashes are never leaked over API responses.
- **HTTP-Only Cookies:** Sessions use JWT stored in an HTTP-only cookie (`rms_token`) with `sameSite: 'lax'` to prevent cross-site scripting (XSS) extraction.
- **Public Self-Registration Prevention:** `POST /api/auth/register` returns `403 Forbidden`. Student accounts can only be provisioned through authorized administrative procedures.
- **Cross-Record Access Control:** Middleware `enforceStudentRecordAccess` ensures that students attempting to query another candidate's PRN are rejected with `403 Forbidden`.
- **Admin Privilege Protection:** Faculty and Students attempting to access administrative provisioning routes are rejected with `403 Forbidden`.

---

## 🗄️ MongoDB Mongoose Models

1. **`User` (`backend/models/User.js`):**
   - Fields: `username`, `email`, `prn`, `employeeId`, `passwordHash`, `role` (`['Student', 'Faculty', 'Admin']`), `name`, `isActive`, `lastLogin`, `timestamps`.
   - Methods: `comparePassword(candidatePassword)`, `hashPassword(plainPassword)`.
2. **`StudentProfile` (`backend/models/StudentProfile.js`):**
   - Fields: `user` (ref: `User`), `prn` (unique index), `rollNo`, `seatNo`, `name`, `motherName`, `branch`, `department`, `academicYear`, `currentSemester`, `division`, `email`, `phone`, `status`.
3. **`FacultyProfile` (`backend/models/FacultyProfile.js`):**
   - Fields: `user` (ref: `User`), `employeeId` (unique index), `name`, `department`, `designation`, `email`, `phone`, `specialization`, `isActive`.
4. **`AcademicSession` (`backend/models/AcademicSession.js`):**
   - Fields: `academicYear`, `semester`, `semesterLabel`, `term` (`Odd` / `Even`), `examinationSession`, `isCurrent`, `status`.
   - Compound Unique Index: `{ academicYear: 1, semester: 1 }`.
5. **`Subject` (`backend/models/Subject.js`):**
   - Fields: `subjectCode` (unique), `subjectName`, `subjectType` (`TH`, `PR`, `OR`, `TW`, `PE`, `OE`), `credits`, `semester`, `department`, `maxInternalMarks`, `maxEseMarks`, `totalMaxMarks`.
6. **`FacultyAssignment` (`backend/models/FacultyAssignment.js`):**
   - Fields: `faculty` (ref: `FacultyProfile`), `subject` (ref: `Subject`), `academicYear`, `semester`, `division`, `assignedBy` (ref: `User`), `status`.
   - Compound Unique Index: `{ faculty: 1, subject: 1, academicYear: 1, division: 1 }`.
7. **`ResultRecord` (`backend/models/ResultRecord.js`):**
   - Fields: `student` (ref: `StudentProfile`), `prn` (unique index per term), `seatNo`, `studentName`, `motherName`, `branch`, `academicYear`, `semester`, `subjects` (Array of scored courses), `totalCR`, `totalEC`, `totalGP`, `sgpa`, `cgpa`, `resultStatus`, `resultDate`, `isPublished`.

---

## 📡 Documented API Routes

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and sets HTTP-only JWT cookie. |
| `POST` | `/api/auth/logout` | Authenticated | Clears the `rms_token` HTTP-only cookie. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user and linked profile. |
| `POST` | `/api/auth/register` | Public | Always returns `403 Forbidden` (self-registration prevented). |

### Administration & Provisioning (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/provision/student` | Admin Only | Provisions a student account & profile with duplicate PRN checks. |
| `POST` | `/api/admin/provision/faculty` | Admin Only | Provisions a faculty account & profile with duplicate ID checks. |
| `POST` | `/api/admin/provision/admin` | Admin Only | Provisions an authorized administrative user. |
| `GET` | `/api/admin/users` | Admin Only | Lists system users with sensitive fields omitted. |

### Academic & Marksheet Data (`/api`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check and stage identification. |
| `GET` | `/api/info` | Public | College accreditation, trust, and contact details. |
| `GET` | `/api/stats` | Public | Summary metrics for candidates, results, and departments. |
| `GET` | `/api/students` | Protected | Lists student records (restricted to self if Student). |
| `GET` | `/api/students/:prn` | Protected | Details for PRN (cross-student access blocked for Students). |
| `GET` | `/api/marksheet/:prn` | Protected | Statement of Grades for PRN (cross-student access blocked). |
| `GET` | `/api/marksheet-me` | Student Only | Directly fetches logged-in student's marksheet. |
| `GET` | `/api/public-preview/:prn` | Public | Read-only sample Statement preview for landing showcase. |
| `GET` | `/api/subjects` | Protected | Course catalog filtered by semester/department. |
| `GET` | `/api/sessions` | Protected | Academic sessions and terms history. |

---

## 🧪 Running Automated Tests

A dedicated 21-assertion automated test suite is included in `backend/tests/runTests.js`.

To run tests:
```bash
# Ensure backend server is running in another terminal
npm test
## 📋 Stage 3: Admin Dashboard & Academic Management

### 1. Features Implemented
- **Student Record Management:** Create, view, search, filter, paginate, edit, and deactivate student profiles.
- **Unique PRN Integrity:** Database unique indexes and controller validations guarantee duplicate PRNs are rejected with `409 Conflict`.
- **Historical Records Preserved:** When a student is deactivated (`status: 'Inactive'`), all historical academic marks, Statement of Grades, and audit logs are safely preserved.
- **Faculty Account Management:** Create and manage faculty profiles with unique Employee IDs, department assignments, and active/inactive toggle switches.
- **Academic Structure:** Manage departments (code, name, HOD), programmes, branches, and academic sessions with active session indicators.
- **Course Catalog (Subjects):** Create subjects with course code, name, type (`TH`, `PR`, `OR`, `TW`, `PE`, `OE`), credits (validated 1-10), semester (validated 1-8), internal maximum marks (validated 0-100), and final exam (ESE) maximum marks (validated 0-100).
- **Faculty-Subject Allocations:** Assign faculty members to courses for specific academic terms and divisions with semester match validation and duplicate allocation prevention.
- **Batch CSV Import:** Bulk import student records with header validation, duplicate checks (both within the CSV and against MongoDB), and an interactive row-by-row Error Report.
- **Search, Filter & Pagination:** Responsive, searchable, filterable data tables with page navigation across students, faculty, and subjects.

---

## 📡 Documented Stage 3 API Routes

### Admin Student Management (`/api/admin/students`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/students` | Paginated, searchable student directory (`?page`, `limit`, `search`, `branch`, `semester`, `status`). |
| `GET` | `/api/admin/students/:id` | Full profile details including linked user and past result records. |
| `POST` | `/api/admin/students` | Creates unique PRN, hashes password, creates user + profile. |
| `PUT` | `/api/admin/students/:id` | Updates student demographic and academic fields. |
| `PATCH` | `/api/admin/students/:id/status` | Deactivates or activates student record while preserving historical results. |
| `POST` | `/api/admin/students/import-csv` | Batch CSV student import with row-by-row validation & error reporting. |

### Admin Faculty Management (`/api/admin/faculty`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/faculty` | Paginated, searchable faculty directory (`?page`, `limit`, `search`, `department`). |
| `POST` | `/api/admin/faculty` | Creates faculty account with unique Employee ID and email. |
| `PUT` | `/api/admin/faculty/:id` | Updates faculty designation, department, and contact info. |
| `PATCH` | `/api/admin/faculty/:id/status` | Toggles faculty active/inactive status. |

### Academic Structure & Subjects (`/api/admin`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/admin/departments` | Lists and creates academic departments (code, name, HOD). |
| `GET` / `POST` | `/api/admin/sessions` | Lists and creates academic sessions/terms (`academicYear`, `semester`). |
| `GET` | `/api/admin/subjects` | Paginated course catalog (`?page`, `limit`, `search`, `semester`, `type`). |
| `POST` | `/api/admin/subjects` | Creates course with strict credit (1-10) and mark limit (0-100) validation. |
| `PUT` / `DELETE` | `/api/admin/subjects/:id` | Modifies or deletes courses (prevents deletion if allocations exist). |
| `GET` / `POST` | `/api/admin/assignments` | Lists and creates faculty-to-subject course allocations. |
| `DELETE` | `/api/admin/assignments/:id` | Revokes faculty course allocations. |
| `GET` | `/api/admin/metrics` | Returns total counts for students, faculty, subjects, sessions, and users. |

---

## 📝 Stage 4: Faculty Marks Entry Workflow

### 1. Workflow Features Implemented
- **Authorized Course Roster:** Faculty logs in and sees **only** subjects officially allocated to them via `FacultyAssignment`. Unassigned subjects are strictly blocked.
- **Dynamic Student Roster:** Selecting academic year, semester, subject, and division queries `StudentProfile` and loads all eligible candidates.
- **Granular Marks Entry Table:**
  - Student PRN and Name
  - Internal marks obtained and maximum (e.g. `28 / 30`)
  - Final Examination (ESE) marks obtained and maximum (e.g. `62 / 70`)
  - Total marks obtained and maximum (e.g. `90 / 100`)
  - Live academic grade and percentage preview
  - Real-time row validation status (`Saved as Draft`, `Submitted for Review`, `Unsaved Changes`, `Pending Entry`, `Error`)
  - Student Statement of Grades preview shortcut
- **Official Backend Calculations:**
  - Frontend calculations serve as immediate visual guidance for the evaluator.
  - Official total marks (`totalMarks = internalMarks + eseMarks`) are computed on the backend server upon draft save or submission.
- **Strict Range & Integrity Validation:**
  - Internal marks validated against subject configured maximum ($0 \le \text{internal} \le \text{maxInternalMarks}$).
  - Final examination marks validated against subject configured maximum ($0 \le \text{ese} \le \text{maxEseMarks}$).
  - Negative marks, values exceeding limits, and non-numeric inputs are rejected with detailed row-level error reports (`{ prn, field, message }`).
  - Duplicate PRN entries within the same submission batch are detected and rejected.
- **Unassigned Subject Access Prevention:**
  - Every faculty endpoint verifies active allocation records in `FacultyAssignment`.
  - Attempts to view students or enter marks for unassigned subjects return `403 Forbidden`.
- **Duplicate Prevention Invariant:**
  - MongoDB compound unique index `{ student: 1, subject: 1, academicYear: 1, semester: 1, attempt: 1 }` prevents duplicate mark records for the same student, course, and exam attempt.
- **Draft & Submitted States (No Automatic Publishing):**
  - **Draft State:** Faculty can save partial or complete marks, return later, and modify entries without locking.
  - **Submitted for Review State:** Requires complete marks for all candidates; marks are locked and forwarded to the Controller of Examinations (COE) for auditing.
  - **Reopen Draft for Corrections:** Faculty can reopen submitted drafts to fix discrepancies before COE final lock.
  - **Result Safety Rule:** Saving or submitting marks **never publishes results automatically**; candidate Statement of Grades remain unverified until formal Stage 5 COE moderation.

---

## 📡 Documented Stage 4 Faculty API Routes (`/api/faculty`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/faculty/profile` | Faculty | Retrieves authenticated faculty member profile details. |
| `GET` | `/api/faculty/assignments` | Faculty | Returns active teaching allocations with enrolled counts, draft metrics, and status badges. |
| `GET` | `/api/faculty/courses/:subjectId/students` | Faculty | Verifies allocation and returns eligible student roster with existing draft/submitted marks (`?academicYear`, `semester`, `division`). |
| `POST` | `/api/faculty/marks/save-draft` | Faculty | Validates ranges and saves marks in `Draft` state; officially computes backend totals. |
| `POST` | `/api/faculty/marks/submit` | Faculty | Validates complete roster, computes official totals, and transitions status to `Submitted` for COE review. |
| `POST` | `/api/faculty/marks/reopen` | Faculty | Reopens submitted batch back to `Draft` state to allow evaluator corrections. |

---

## ⚙️ Stage 5: Automatic Result Calculation Engine

### 1. Calculation & Grading Rules
- **Total Marks Formula:**
  $$\text{Total Marks} = \text{Internal Marks} + \text{Final Examination (ESE) Marks}$$
  Calculates percentages where applicable and validates all maximum course limits.
- **Grade Boundaries (Percentage out of 100):**
  - `90% – 100%`: **O** (Outstanding)
  - `80% – 89.99%`: **A+** (Excellent)
  - `70% – 79.99%`: **A** (Very Good)
  - `60% – 69.99%`: **B+** (Good)
  - `50% – 59.99%`: **B** (Above Average)
  - `40% – 49.99%`: **C** (Average / Passing Threshold)
  - `Below 40%`: **F** (Fail)
- **Confirmed vs. Provisional Status:**
  - **Confirmed Grade Points (from Sanjivani College Statement of Grades):**
    - `A+` = **9** grade points
    - `A` = **8** grade points
    - `B+` = **7** grade points
  - **Provisional Grade Points (Subject to formal notification by Controller of Examinations):**
    - `O` = **10**, `B` = **6**, `C` = **5**, `F` = **0**
    - Clearly marked as provisional in the database, API responses, and portal UI.
- **Admin-Configurable Grading Scheme ([`GradingScheme.js`](file:///c:/omkar/RMS/backend/models/GradingScheme.js)):**
  - Contains grade boundaries, grade points, passing requirements (e.g., 40%), subject credit rules, SGPA calculation method, rounding conventions, applicable academic year, and scheme version.
  - **Boundary Validation Engine:** Automatically rejects incomplete scales, gaps, overlapping boundaries, inverted ranges, and schemes without failing grades with `400 Bad Request`.
- **Credits & SGPA Formula:**
  - Course Credits ($C_i$)
  - Earned Credits ($EC_i$: earned if passing, 0 if F)
  - Grade Points ($GP_i$)
  - Credit-Weighted Grade Points ($CP_i = C_i \times GP_i$)
  - **SGPA Formula (Autonomous Credit-Weighted Average):**
    $$\text{SGPA} = \frac{\sum (C_i \times GP_i)}{\sum C_i} = \frac{\text{Total Credit Points (GP)}}{\text{Total Registered Credits (CR)}}$$
  - **Mathematical Verification:** Verified against the official Statement of Grades reference for candidate Aarav Shinde ($183 / 21 = 8.7142857 \to 8.71$).
- **Integrity & Safety Rules:**
  - All authoritative calculations performed on the backend.
  - Stored `gradingSchemeVersion` on each result record (e.g., `Autonomous Scheme 2022 v1`).
  - Recalculation after marks correction (`POST /api/admin/results/recalculate/:prn`).
  - Detection of missing marks: Strictly refuses to generate corrupted partial results when candidates have unsubmitted course evaluations.
  - Avoids duplicate results via compound unique index on `{ prn: 1, academicYear: 1, semester: 1, attempt: 1 }`.
  - **Strict Non-Publishing Invariant:** All calculated results remain `isPublished: false` in draft verification state. **Results are NOT published automatically.**

---

## 📡 Documented Stage 5 API Routes

### Grading Schemes & Calculation Engine (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/grading-schemes` | Admin | Lists all configured grading schemes with confirmed vs provisional status tags. |
| `GET` | `/api/admin/grading-schemes/active` | Admin | Retrieves active default grading scheme. |
| `POST` | `/api/admin/grading-schemes` | Admin | Creates new grading scheme with strict boundary overlap & gap validation. |
| `PUT` | `/api/admin/grading-schemes/:id` | Admin | Updates grading scheme with boundary integrity validation. |
| `PATCH` | `/api/admin/grading-schemes/:id/set-active` | Admin | Sets specific grading scheme as active default. |
| `POST` | `/api/admin/results/calculate-semester` | Admin | Executes centralized calculation engine for cohort; saves unpublished results (`isPublished: false`). |
| `POST` | `/api/admin/results/recalculate/:prn` | Admin | Recalculates individual student SGPA and credit points after marks corrections. |
| `GET` | `/api/admin/results/inspect/:prn` | Admin | Inspects calculated semester result, course scores, and rules audit metadata. |
| `GET` | `/api/admin/results/summary` | Admin | Returns cohort performance metrics (Distinction, First Class, SGPA average, Draft status). |

---

## 🏛️ Stage 6: Result Review, Moderation & Publication Architecture

Stage 6 implements an institutional, audit-compliant moderation and publication workflow conforming to autonomous examination cell standards:

$$\mathbf{Draft} \longrightarrow \mathbf{Submitted\ for\ Review} \longrightarrow \mathbf{Approved} \longrightarrow \mathbf{Published}$$
$$(\text{with Return for Correction loop: } \mathbf{Submitted} \longrightarrow \mathbf{Returned} \longrightarrow \mathbf{Corrected} \longrightarrow \mathbf{Submitted})$$

### 1. Controlled Moderation Lifecycle
- **Faculty Workflow:**
  - Enters continuous and end-semester evaluations and saves drafts.
  - Formally submits finalized course marks for review (`POST /api/faculty/marks/submit`).
  - Tracks review status via visual status badges (`Draft`, `Submitted`, `Returned`, `Approved`, `Published`).
  - If returned by the Examination Cell, the roster is unlocked (`isLocked: false`) and displays an alert banner containing the **mandatory reviewer return reason**.
  - Faculty corrects the marked discrepancies and clicks **"Submit Corrected Marks for Review"**.
  - Once a batch is **Approved** or **Published**, evaluation inputs are locked with an immutable institutional badge (*"Finalized by Examination Cell"*).
- **Reviewer / Controller of Examinations (COE) Workflow:**
  - **Batch Review & Publication Queue:** Inspects course evaluation batches and semester result cohorts in real time (`GET /api/admin/results/batches`).
  - **Missing & Discrepancy Auditing:** Audits student enrollment counts, missing marks, pending submissions, and SGPA distributions.
  - **Return for Correction Modal:** Returns suspicious or flawed evaluation batches to faculty with a **mandatory recorded justification reason** (`POST /api/admin/results/batches/return`).
  - **Batch Approval:** Formally approves verified batches (`POST /api/admin/results/batches/approve`).
  - **Batch Publication:** Formally publishes approved cohorts (`POST /api/admin/results/batches/publish`), stamping official publication timestamps and batch identifiers.
  - **Unpublishing Mechanism:** Authoritative emergency unpublish with recorded justification (`POST /api/admin/results/batches/unpublish`), instantly revoking student access.
  - **Post-Publication Mark Correction Modal:** Authorized correction of published grades requiring admin authentication and recorded justification reason (`POST /api/admin/results/correct-published`). Automatically recalculates dependent course totals, credit points, earned credits, and semester SGPA, and stores before/after snapshots in the audit log.

### 2. Publication Rules & Strict Backend Enforcement
1. **Draft results must never be visible to students:** Queries to `/api/marksheet/:prn` for uncalculated or draft records return `403 Forbidden`.
2. **Submitted results must remain private:** Results under review are strictly blocked from student access with `403 Forbidden`.
3. **Approved results remain private until published:** Formally approved batches remain blocked with `403 Forbidden` until official publication.
4. **Only authorized accounts can approve or publish:** Non-admin roles (Students, Faculty) attempting to approve or publish batches are rejected with `403 Forbidden`.
5. **Students can access only their own published results:** Students can view their Statement of Grades if and only if `isPublished === true`. Cross-PRN requests return `403 Forbidden`.
6. **Corrections to published results require authorization and a recorded reason:** Post-publication corrections require admin authorization and reject empty justifications with `400 Bad Request`.
7. **Immutable Audit Trail:** All critical lifecycle transitions (`SUBMITTED_FOR_REVIEW`, `APPROVED`, `RETURNED_FOR_CORRECTION`, `PUBLISHED`, `UNPUBLISHED`, `CORRECTED_POST_PUBLICATION`) create permanent, immutable audit log records ([`AuditLog.js`](file:///c:/omkar/RMS/backend/models/AuditLog.js)) recording who performed the action, when it happened, the target entity, batch ID, previous/new states, reason, and grading scheme version.

---

## 📡 Documented Stage 6 API Routes

### Result Review, Moderation & Publication (`/api/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/results/batches` | Admin | Lists course mark batches and semester result cohorts with status, student counts, and return reasons. |
| `POST` | `/api/admin/results/batches/approve` | Admin | Approves course mark batches or semester cohorts; logs `APPROVED` in audit trail. |
| `POST` | `/api/admin/results/batches/return` | Admin | Returns batch for correction; requires mandatory justification reason; logs `RETURNED_FOR_CORRECTION`. |
| `POST` | `/api/admin/results/batches/publish` | Admin | Publishes approved result cohorts; strictly rejects unapproved/draft batches; logs `PUBLISHED`. |
| `POST` | `/api/admin/results/batches/unpublish` | Admin | Revokes cohort publication; requires mandatory justification reason; logs `UNPUBLISHED`. |
| `POST` | `/api/admin/results/correct-published` | Admin | Post-publication mark correction; validates mark limits; recalculates SGPA; logs before/after snapshots. |
| `GET` | `/api/admin/results/audit-trail` | Admin | Retrieves immutable audit trail logs with filtering by PRN, batchId, academicYear, and action. |

---

---

## 🎓 Stage 7: Student Portal & Statement of Grades PDF Generation

### 1. Features Implemented
- **Authoritative Student Portal:**
  - After PRN and password authentication, students can view their complete academic profile (PRN, Full Name, Mother's Name, Seat Number, Branch, Degree, Current Term, Enrollment Status).
  - Multi-term academic progression navigator supporting Semester I through Semester VIII.
  - Interactive semester selector to inspect published results by academic year and term.
  - Performance KPI cards: Registered Credits (CR), Earned Credits (EC), Semester Grade Point Average (SGPA), and Cumulative Grade Point Average (CGPA).
  - Course-level evaluation table displaying Course Code, Course Title, Course Type (`TH`, `PR`, etc.), Registered Credits, Earned Credits, Letter Grade, Grade Points, and Credit Points.
- **Strict Moderation & Privacy Protection:**
  - When a semester's results have not been declared, or remain in `Draft`, `Submitted`, or `Approved` state, students are greeted with a clear, polite `Pending Moderation` or `Results Not Declared` banner.
  - Unpublished mark entries, internal scores, or moderation states are **strictly hidden** from students both on the frontend and on the backend API.
- **Publication-Quality A4 Statement of Grades PDF Generator:**
  - Built using `pdfkit` (pure JavaScript, fast, zero external Chromium binary dependencies).
  - Faithfully reproduces the Sanjivani College of Engineering Statement of Grades layout:
    - Dual ornamental academic border (deep academic blue `#1e3a8a` and slate).
    - Sanjivani Rural Education Society trust name, college name, autonomous affiliation to Savitribai Phule Pune University, and NAAC/NBA accreditation details.
    - Official Statement of Grades header and Examination Session label.
    - Candidate & Examination Identification Grid (Student Name, Mother's Name, PRN, Seat Number, Degree, Branch, Academic Session, 2022 Autonomous Pattern).
    - Course performance table with alternating row shading, course types, CR, EC, letter grade, grade points, and calculated credit points.
    - Total Credits & Grade Points summary row ($CR$, $EC$, $GP$).
    - Performance summary card featuring high-contrast SGPA, CGPA, Final Result Status, and Result Declaration Date.
    - Official 10-point autonomous grading scale legend, formulas, and abbreviations.
    - Examination Cell verification block and Controller of Examinations signature block (does **not** invent fake official seals or signatures; features a digital verification notice and institutional seal placement box).
    - Legal disclosure and anti-tampering disclaimer footer.
- **Security & Data Invariants:**
  - **Server-Side Generation:** PDFs are generated strictly on the server using authoritative database records; client-supplied grades or marks are never trusted.
  - **Cross-Student Access Prevention:** Enforced via `enforceStudentRecordAccess` middleware. A logged-in student cannot download another student's marksheet (`403 Forbidden`).
  - **Unpublished Result PDF Protection:** Attempting to download a PDF for an unpublished, draft, or unapproved term immediately returns `403 Forbidden`.
  - **Unauthenticated Protection:** All marksheet PDF endpoints strictly require valid JWT session credentials (`401 Unauthorized`).

---

## 📡 Documented Stage 7 API Routes

### Student Portal & PDF Marksheet Generation (`/api`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/student/terms` | Authenticated Student / Admin | Retrieves 8-term progression, current semester, and declared SGPA history. |
| `GET` | `/api/student/result` | Authenticated Student / Admin | Retrieves published semester result record for selected term; returns `403` if unpublished. |
| `GET` | `/api/marksheet/:prn/pdf` | Self / Admin | Generates server-validated A4 Statement of Grades PDF for `:prn`; returns `403` if unpublished or unauthorized. |
| `GET` | `/api/marksheet-me/pdf` | Authenticated Student | Direct shortcut for logged-in student to download their own Statement of Grades PDF. |

---

## 🧪 Comprehensive Automated Test Suite (Stages 2, 3, 4, 5, 6 & 7)

Run all test suites across authentication, database, administrative operations, faculty marks evaluation, the automatic result calculation engine, result review/publication, and student portal/PDF generation:
```bash
# Run all Stage 2, 3, 4, 5, 6, and 7 tests
npm test
```
The test suite validates **245 combined assertions**:
- [x] **Stage 2 (21 tests):** Server health, authentication, cookies, role security, student privacy, duplicate PRNs, logout.
- [x] **Stage 3 (29 tests):** Student CRUD, deactivation with history preservation, faculty management, credit validation, mark limits, semester match validation, faculty allocations, duplicate assignment prevention, batch CSV import error reports, and table pagination/search.
- [x] **Stage 4 (43 tests):** Faculty authentication, RBAC authorization, faculty profile, assigned subjects isolation, unassigned subject 403 prevention, eligible student loading, negative mark rejection, limit violation rejection, non-numeric rejection, duplicate PRN in batch rejection, draft saving, backend official total calculation, draft editing/correction, duplicate prevention for student/subject/attempt, incomplete submission rejection, batch submit for review, result non-publishing safety invariant, and draft reopening.
- [x] **Stage 5 (73 tests):** Total marks calculation (internal + ese), boundary marks (0 & 100), negative marks rejection, exceeding limits rejection, every grade boundary test (O, A+, A, B+, B, C, F), confirmed vs provisional status verification, scheme boundary validation (overlapping ranges rejected, gap detection, inverted ranges rejected, 0% coverage check), rounding conventions (Half-Up vs Truncate), credit points calculation, earned credits on pass/fail, full SGPA calculation with exact reference marksheet match ($183 / 21 = 8.71$), missing marks detection, API endpoints for schemes and calculation, cohort calculation, recalculation after marks corrections, and the strict unpublished result invariant.
- [x] **Stage 6 (48 tests):** Multi-role authentication, assigned course inspection, Draft save, Draft student privacy invariant (403), Submit for review, Submitted privacy invariant (403), Admin batches queue inspection, Return for correction without reason rejection (400), Return for correction with mandatory reason, Faculty roster unlocking for correction, Corrected marks resubmission, Return reason clearing, Admin course batch approval, Lock enforcement blocking faculty edit/reopen on approved batches (403), Approved privacy invariant (403), Rejection of unapproved batch publication (400/404), Faculty/Student unauthorized publication rejection (403), Authorized batch publication, Published marksheet access (200), Cross-student access rejection (403), Post-publication correction without reason rejection (400), Authorized post-publication correction and SGPA recalculation, Updated marksheet access, Unpublish without reason rejection (400), Authorized unpublish and immediate student access restriction (403), Publication restoration, and Immutable Audit Trail verification (`SUBMITTED_FOR_REVIEW`, `APPROVED`, `RETURNED_FOR_CORRECTION`, `PUBLISHED`, `UNPUBLISHED`, `CORRECTED_POST_PUBLICATION`, with full metadata audit).
- [x] **Stage 7 (31 tests):** Student authentication, profile retrieval, multi-term academic progression, authoritative published semester result query, privacy enforcement on unpublished terms (403), A4 vector PDF generation, PDF headers (`application/pdf`, attachment filename, `%PDF-` magic bytes, buffer > 5KB), student self-download endpoint (`/api/marksheet-me/pdf`), cross-student PDF download block (403), cross-student result query block (403), unpublished PDF generation block (403), unauthenticated access rejection (401), and admin privileged marksheet PDF download.

---

## 🚀 Startup Commands

### Run Full-Stack Concurrently
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

### Run Automated Tests
```bash
npm test
```

### Build Frontend
```bash
npm run build
```

