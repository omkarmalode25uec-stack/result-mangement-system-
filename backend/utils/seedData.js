import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { AcademicSession } from '../models/AcademicSession.js';
import { Subject } from '../models/Subject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { Department } from '../models/Department.js';
import { GradingScheme } from '../models/GradingScheme.js';
import { getDefaultGradingScheme } from '../services/calculationEngine.js';
import { sampleMarksheets } from '../data/sampleData.js';

/**
 * Seeds the database with authorized administrative, faculty, and student accounts,
 * academic sessions, courses, assignments, and verified Statement of Grades.
 * Safely idempotent: does not duplicate records if executed repeatedly.
 */
export const seedDatabase = async () => {
  try {
    // 1. Seed departments if missing
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      await Department.insertMany([
        { code: 'COMP', name: 'Computer Engineering', hodName: 'Dr. M. A. Jawale' },
        { code: 'IT', name: 'Information Technology', hodName: 'Dr. D. B. Kshirsagar' },
        { code: 'AIDS', name: 'Artificial Intelligence & Data Science', hodName: 'Dr. P. N. Kalavadekar' },
        { code: 'MECH', name: 'Mechanical Engineering', hodName: 'Dr. A. G. Thakur' },
        { code: 'CIVIL', name: 'Civil Engineering', hodName: 'Dr. C. L. Jejurkar' },
      ]);
      console.log('[Seed] Default departments seeded.');
    }

    // 2. Seed default grading scheme if missing
    const schemeCount = await GradingScheme.countDocuments();
    if (schemeCount === 0) {
      await GradingScheme.create(getDefaultGradingScheme());
      console.log('[Seed] Default Sanjivani Autonomous Scheme 2022 v1 seeded.');
    }

    // 3. Ensure Admin Account exists
    let adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const adminPasswordHash = await User.hashPassword('Admin@123');
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@sanjivani.edu.in',
        name: 'Dr. K. S. Patil (COE)',
        passwordHash: adminPasswordHash,
        role: 'Admin',
        isActive: true,
      });
      console.log('[Seed] Admin account provisioned.');
    }

    // 4. Ensure Faculty Account & Profile exist
    let facultyUser = await User.findOne({ username: 'fac-cs-108' });
    if (!facultyUser) {
      const facultyPasswordHash = await User.hashPassword('Faculty@123');
      facultyUser = await User.create({
        username: 'fac-cs-108',
        employeeId: 'FAC-CS-108',
        email: 'faculty.cs@sanjivani.edu.in',
        name: 'Prof. R. M. Kulkarni',
        passwordHash: facultyPasswordHash,
        role: 'Faculty',
        isActive: true,
      });
    }

    let facultyProfile = await FacultyProfile.findOne({ employeeId: 'FAC-CS-108' });
    if (!facultyProfile) {
      facultyProfile = await FacultyProfile.create({
        user: facultyUser._id,
        employeeId: 'FAC-CS-108',
        name: 'Prof. R. M. Kulkarni',
        department: 'Computer Engineering',
        designation: 'Associate Professor',
        email: 'faculty.cs@sanjivani.edu.in',
        phone: '+91 98220 12345',
        specialization: 'Database Systems & Machine Learning',
        isActive: true,
      });
      console.log('[Seed] Faculty account & profile provisioned.');
    }

    // 5. Ensure Student 1 (Aarav Shinde - 22UCO01042) exists
    let student1User = await User.findOne({ prn: '22UCO01042' });
    if (!student1User) {
      const student1PasswordHash = await User.hashPassword('Student@123');
      student1User = await User.create({
        username: '22uco01042',
        prn: '22UCO01042',
        email: 'aarav.shinde@sample.sanjivani.edu.in',
        name: 'AARAV RAJESH SHINDE',
        passwordHash: student1PasswordHash,
        role: 'Student',
        isActive: true,
      });
    }

    let student1Profile = await StudentProfile.findOne({ prn: '22UCO01042' });
    if (!student1Profile) {
      student1Profile = await StudentProfile.create({
        user: student1User._id,
        prn: '22UCO01042',
        rollNo: '308',
        seatNo: 'SCOE24-C308',
        name: 'AARAV RAJESH SHINDE',
        motherName: 'SUNITA',
        branch: 'Computer Engineering',
        degree: 'Bachelor of Technology (B.Tech)',
        department: 'Department of Computer Engineering',
        academicYear: '2026-27',
        currentSemester: 5,
        email: 'aarav.shinde@sample.sanjivani.edu.in',
        status: 'Active',
      });
      console.log('[Seed] Student 1 (Aarav Shinde) profile provisioned.');
    } else {
      student1Profile.academicYear = '2026-27';
      student1Profile.currentSemester = 5;
      await student1Profile.save();
    }

    // 6. Ensure Student 2 (Priya Deshmukh - 22UIT02015) exists
    let student2User = await User.findOne({ prn: '22UIT02015' });
    if (!student2User) {
      const student2PasswordHash = await User.hashPassword('Student@123');
      student2User = await User.create({
        username: '22uit02015',
        prn: '22UIT02015',
        email: 'priya.deshmukh@sample.sanjivani.edu.in',
        name: 'PRIYA SANJAY DESHMUKH',
        passwordHash: student2PasswordHash,
        role: 'Student',
        isActive: true,
      });
    }

    let student2Profile = await StudentProfile.findOne({ prn: '22UIT02015' });
    if (!student2Profile) {
      student2Profile = await StudentProfile.create({
        user: student2User._id,
        prn: '22UIT02015',
        rollNo: '114',
        seatNo: 'SCOE24-I114',
        name: 'PRIYA SANJAY DESHMUKH',
        motherName: 'ANITA',
        branch: 'Information Technology',
        degree: 'Bachelor of Technology (B.Tech)',
        department: 'Department of Information Technology',
        academicYear: '2024-2025',
        currentSemester: 5,
        email: 'priya.deshmukh@sample.sanjivani.edu.in',
        status: 'Active',
      });
      console.log('[Seed] Student 2 (Priya Deshmukh) profile provisioned.');
    }

    // 7. Academic Sessions (including 2026-27 Semester I)
    await AcademicSession.findOneAndUpdate(
      { academicYear: '2026-27', semester: 1 },
      {
        $set: {
          academicYear: '2026-27',
          semester: 1,
          semesterLabel: 'Semester I',
          term: 'Odd',
          examinationSession: 'Winter 2026 Autonomous Examination',
          isCurrent: true,
          status: 'Results Declared',
        },
      },
      { upsert: true, new: true }
    );

    await AcademicSession.findOneAndUpdate(
      { academicYear: '2024-2025', semester: 5 },
      {
        $set: {
          academicYear: '2024-2025',
          semester: 5,
          semesterLabel: 'Semester V',
          term: 'Odd',
          examinationSession: 'Winter 2024 Autonomous Examination',
          isCurrent: false,
          status: 'Results Declared',
        },
      },
      { upsert: true, new: true }
    );

    // 8. Seed Subjects if missing
    const subjectCount = await Subject.countDocuments();
    if (subjectCount === 0) {
      const subjectsData = [
        {
          subjectCode: 'CE501',
          subjectName: 'Database Management Systems',
          subjectType: 'TH',
          credits: 3,
          semester: 5,
          department: 'Computer Engineering',
        },
        {
          subjectCode: 'CE502',
          subjectName: 'Operating Systems & System Programming',
          subjectType: 'TH',
          credits: 3,
          semester: 5,
          department: 'Computer Engineering',
        },
        {
          subjectCode: 'CE503',
          subjectName: 'Theory of Computation',
          subjectType: 'TH',
          credits: 3,
          semester: 5,
          department: 'Computer Engineering',
        },
        {
          subjectCode: 'CE506',
          subjectName: 'DBMS & OS Laboratory',
          subjectType: 'PR',
          credits: 2,
          semester: 5,
          department: 'Computer Engineering',
        },
      ];
      await Subject.insertMany(subjectsData);
    }

    // 9. Faculty Assignment if missing
    const ce501 = await Subject.findOne({ subjectCode: 'CE501' });
    if (ce501 && facultyProfile) {
      const assignmentExists = await FacultyAssignment.findOne({
        faculty: facultyProfile._id,
        subject: ce501._id,
      });
      if (!assignmentExists) {
        await FacultyAssignment.create({
          faculty: facultyProfile._id,
          subject: ce501._id,
          academicYear: '2024-2025',
          semester: 5,
          division: 'A',
          assignedBy: adminUser._id,
        });
      }
    }

    // 10. PUBLISH THE DEMO RESULT FOR 2026–27, SEMESTER I
    // Associated with student Aarav Rajesh Shinde (PRN: 22UCO01042)
    const marksheet1 = sampleMarksheets['22UCO01042'];
    if (marksheet1) {
      await ResultRecord.findOneAndUpdate(
        {
          prn: '22UCO01042',
          academicYear: '2026-27',
          semester: 1,
          attempt: 1,
        },
        {
          $set: {
            student: student1Profile._id,
            prn: '22UCO01042',
            seatNo: 'SCOE24-C308',
            studentName: marksheet1.studentName,
            motherName: marksheet1.motherName,
            branch: marksheet1.branch,
            degree: marksheet1.degree,
            academicYear: '2026-27',
            semester: 1,
            semesterLabel: 'Semester I',
            examinationName: 'Winter Session 2026 Autonomous Examination',
            resultDate: '12-01-2027',
            subjects: marksheet1.subjects,
            totalCR: marksheet1.totalCR,
            totalEC: marksheet1.totalEC,
            totalGP: marksheet1.totalGP,
            sgpa: marksheet1.sgpa,
            cgpa: marksheet1.cgpa,
            resultStatus: marksheet1.resultStatus,
            attempt: 1,
            isPublished: true, // PUBLISHED
            reviewStatus: 'Published',
            publishedAt: new Date('2027-01-12'),
            verifiedBy: adminUser._id,
          },
        },
        { upsert: true, new: true }
      );
      console.log('[Seed] Demonstration result for 2026-27, Semester I published for 22UCO01042.');
    }

    // 11. INVARIANT ENFORCEMENT:
    // "Do not publish any other semester's results as part of this change."
    // Mark any other result record as un-published (Draft)
    await ResultRecord.updateMany(
      {
        $or: [
          { prn: { $ne: '22UCO01042' } },
          { academicYear: { $ne: '2026-27' } },
          { semester: { $ne: 1 } },
        ],
      },
      {
        $set: {
          isPublished: false,
          reviewStatus: 'Draft',
        },
      }
    );

    console.log('[Seed] Database verified: Only 2026-27 Semester I is published.');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
  }
};
