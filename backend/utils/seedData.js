import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { AcademicSession } from '../models/AcademicSession.js';
import { Subject } from '../models/Subject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { ResultRecord } from '../models/ResultRecord.js';
import { Department } from '../models/Department.js';
import { sampleMarksheets } from '../data/sampleData.js';

/**
 * Seeds the database with authorized administrative, faculty, and student accounts,
 * academic sessions, courses, assignments, and verified Statement of Grades.
 */
export const seedDatabase = async () => {
  try {
    // Seed departments if missing
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

    // Check if admin already exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('[Seed] Database already seeded with admin account.');
      return;
    }

    console.log('[Seed] Seeding database with Stage 2 authorized accounts and academic records...');

    // 1. Create Admin Account
    const adminPasswordHash = await User.hashPassword('Admin@123');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@sanjivani.edu.in',
      name: 'Dr. K. S. Patil (COE)',
      passwordHash: adminPasswordHash,
      role: 'Admin',
    });

    // 2. Create Faculty Account & Profile
    const facultyPasswordHash = await User.hashPassword('Faculty@123');
    const facultyUser = await User.create({
      username: 'fac-cs-108',
      employeeId: 'FAC-CS-108',
      email: 'faculty.cs@sanjivani.edu.in',
      name: 'Prof. R. M. Kulkarni',
      passwordHash: facultyPasswordHash,
      role: 'Faculty',
    });

    const facultyProfile = await FacultyProfile.create({
      user: facultyUser._id,
      employeeId: 'FAC-CS-108',
      name: 'Prof. R. M. Kulkarni',
      department: 'Computer Engineering',
      designation: 'Associate Professor',
      email: 'faculty.cs@sanjivani.edu.in',
      phone: '+91 98220 12345',
      specialization: 'Database Systems & Machine Learning',
    });

    // 3. Create Student 1 (Aarav Shinde)
    const student1PasswordHash = await User.hashPassword('Student@123');
    const student1User = await User.create({
      username: '22uco01042',
      prn: '22UCO01042',
      email: 'aarav.shinde@sample.sanjivani.edu.in',
      name: 'AARAV RAJESH SHINDE',
      passwordHash: student1PasswordHash,
      role: 'Student',
    });

    const student1Profile = await StudentProfile.create({
      user: student1User._id,
      prn: '22UCO01042',
      rollNo: '308',
      seatNo: 'SCOE24-C308',
      name: 'AARAV RAJESH SHINDE',
      motherName: 'SUNITA',
      branch: 'Computer Engineering',
      degree: 'Bachelor of Technology (B.Tech)',
      department: 'Department of Computer Engineering',
      academicYear: '2024-2025',
      currentSemester: 5,
      email: 'aarav.shinde@sample.sanjivani.edu.in',
    });

    // 4. Create Student 2 (Priya Deshmukh)
    const student2PasswordHash = await User.hashPassword('Student@123');
    const student2User = await User.create({
      username: '22uit02015',
      prn: '22UIT02015',
      email: 'priya.deshmukh@sample.sanjivani.edu.in',
      name: 'PRIYA SANJAY DESHMUKH',
      passwordHash: student2PasswordHash,
      role: 'Student',
    });

    const student2Profile = await StudentProfile.create({
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
    });

    // 5. Create Academic Session
    const academicSession = await AcademicSession.create({
      academicYear: '2024-2025',
      semester: 5,
      semesterLabel: 'Semester V',
      term: 'Odd',
      examinationSession: 'Winter 2024 Autonomous Examination',
      isCurrent: true,
      status: 'Results Declared',
    });

    // 6. Create Subjects
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
        subjectCode: 'CE504',
        subjectName: 'Professional Elective-I (Machine Learning)',
        subjectType: 'TH',
        credits: 3,
        semester: 5,
        department: 'Computer Engineering',
      },
      {
        subjectCode: 'CE505',
        subjectName: 'Open Elective-I (Cyber Security Fundamentals)',
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
      {
        subjectCode: 'CE507',
        subjectName: 'Machine Learning Laboratory',
        subjectType: 'PR',
        credits: 1,
        semester: 5,
        department: 'Computer Engineering',
      },
      {
        subjectCode: 'CE508',
        subjectName: 'Mini Project (Phase-I)',
        subjectType: 'TW',
        credits: 2,
        semester: 5,
        department: 'Computer Engineering',
      },
      {
        subjectCode: 'CE509',
        subjectName: 'Professional Communication & Ethics',
        subjectType: 'OR',
        credits: 1,
        semester: 5,
        department: 'Computer Engineering',
      },
    ];

    const createdSubjects = await Subject.insertMany(subjectsData);

    // 7. Faculty Assignment
    const ce501 = createdSubjects.find((s) => s.subjectCode === 'CE501');
    const ce506 = createdSubjects.find((s) => s.subjectCode === 'CE506');

    if (ce501) {
      await FacultyAssignment.create({
        faculty: facultyProfile._id,
        subject: ce501._id,
        academicYear: '2024-2025',
        semester: 5,
        division: 'A',
        assignedBy: adminUser._id,
      });
    }

    if (ce506) {
      await FacultyAssignment.create({
        faculty: facultyProfile._id,
        subject: ce506._id,
        academicYear: '2024-2025',
        semester: 5,
        division: 'A',
        assignedBy: adminUser._id,
      });
    }

    // 8. Result Records
    const marksheet1 = sampleMarksheets['22UCO01042'];
    if (marksheet1) {
      await ResultRecord.create({
        student: student1Profile._id,
        prn: '22UCO01042',
        seatNo: 'SCOE24-C308',
        studentName: marksheet1.studentName,
        motherName: marksheet1.motherName,
        branch: marksheet1.branch,
        degree: marksheet1.degree,
        academicYear: marksheet1.academicYear,
        semester: 5,
        semesterLabel: 'Semester V',
        examinationName: marksheet1.examination,
        resultDate: marksheet1.resultDate,
        subjects: marksheet1.subjects,
        totalCR: marksheet1.totalCR,
        totalEC: marksheet1.totalEC,
        totalGP: marksheet1.totalGP,
        sgpa: marksheet1.sgpa,
        cgpa: marksheet1.cgpa,
        resultStatus: marksheet1.resultStatus,
        isPublished: true,
        verifiedBy: adminUser._id,
      });
    }

    const marksheet2 = sampleMarksheets['22UIT02015'];
    if (marksheet2) {
      await ResultRecord.create({
        student: student2Profile._id,
        prn: '22UIT02015',
        seatNo: 'SCOE24-I114',
        studentName: marksheet2.studentName,
        motherName: marksheet2.motherName,
        branch: marksheet2.branch,
        degree: marksheet2.degree,
        academicYear: marksheet2.academicYear,
        semester: 5,
        semesterLabel: 'Semester V',
        examinationName: marksheet2.examination,
        resultDate: marksheet2.resultDate,
        subjects: marksheet2.subjects,
        totalCR: marksheet2.totalCR,
        totalEC: marksheet2.totalEC,
        totalGP: marksheet2.totalGP,
        sgpa: marksheet2.sgpa,
        cgpa: marksheet2.cgpa,
        resultStatus: marksheet2.resultStatus,
        isPublished: true,
        verifiedBy: adminUser._id,
      });
    }

    console.log('[Seed] Database seeded successfully with all models and initial users!');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
  }
};
