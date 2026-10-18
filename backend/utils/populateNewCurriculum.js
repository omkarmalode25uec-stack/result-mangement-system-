/**
 * POPULATE NEW CURRICULUM, FACULTY ASSIGNMENTS & MOCK MARKS
 * Based on Sanjivani College Timetable & Course Allocations:
 *
 * Courses & Faculty:
 * 1. Semiconductor Devices and Circuits (Theory) - SACHIN VASANT CHAUDHARI
 * 2. Software Engineering, Modeling and Design (Theory) - NAMDEO DADA KAPALE (Prof. N. D. Kapale)
 * 3. Data Structures Lab (Lab) - SUMEET KAILASH GUPTA
 * 4. Digital Design and HD Language (Theory) - DEEPAK PRALHAD MAHURKAR
 * 5. Semiconductor Devices and Circuits Lab (Lab) - SACHIN VASANT CHAUDHARI
 * 6. Comm Eng Project/ Mini Project (Lab) - MUZFFARALI AKBAR SAYYAD
 * 7. Software Engineering, Modeling and Design Lab (Lab) - NAMDEO DADA KAPALE (Prof. N. D. Kapale)
 * 8. Entrepreneurship ,Innovation and Startup Ecosystem (Theory) - SACHIN VASANT CHAUDHARI
 * 9. Universal Human Values & Ethics (Theory) - MUZFFARALI AKBAR SAYYAD
 * 10. Digital Design and HD Language Lab (Lab) - DEEPAK PRALHAD MAHURKAR
 * 11. Data Structures (Theory) - NITIN ISHWARLAL BHOPALE
 */

import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { FacultyProfile } from '../models/FacultyProfile.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { Subject } from '../models/Subject.js';
import { FacultyAssignment } from '../models/FacultyAssignment.js';
import { CourseMark } from '../models/CourseMark.js';
import { ResultRecord } from '../models/ResultRecord.js';

export async function populateNewCurriculum() {
  console.log('[Curriculum Update] Updating curriculum, faculty profiles, and mock student marks...');

  // 1. Get or create Admin (COE)
  let admin = await User.findOne({ role: 'Admin' });
  if (!admin) {
    const adminHash = await User.hashPassword('Admin@123');
    admin = await User.create({
      username: 'admin',
      email: 'admin@sanjivani.edu.in',
      name: 'Dr. S. K. Jadhav (Controller of Examinations)',
      passwordHash: adminHash,
      role: 'Admin',
    });
  }

  // 2. Provision / Update Faculty: Prof. N. D. Kapale (NAMDEO DADA KAPALE)
  const facultyPasswordHash = await User.hashPassword('Faculty@123');

  // Account A: fac-cs-108 (Required by automated tests & faculty login)
  let facCs108User = await User.findOne({ username: 'fac-cs-108' });
  if (!facCs108User) {
    facCs108User = await User.findOne({ email: 'faculty.cs@sanjivani.edu.in' });
  }

  if (facCs108User) {
    facCs108User.username = 'fac-cs-108';
    facCs108User.email = 'faculty.cs@sanjivani.edu.in';
    facCs108User.employeeId = 'FAC-CS-108';
    facCs108User.name = 'Prof. N. D. Kapale';
    facCs108User.passwordHash = facultyPasswordHash;
    facCs108User.role = 'Faculty';
    facCs108User.isActive = true;
    await facCs108User.save();
  } else {
    facCs108User = await User.create({
      username: 'fac-cs-108',
      email: 'faculty.cs@sanjivani.edu.in',
      employeeId: 'FAC-CS-108',
      name: 'Prof. N. D. Kapale',
      passwordHash: facultyPasswordHash,
      role: 'Faculty',
      isActive: true,
    });
  }

  // Account B: ndkapale (Direct login requested for Prof. N. D. Kapale)
  let ndkapaleUser = await User.findOne({ username: 'ndkapale' });
  if (!ndkapaleUser) {
    ndkapaleUser = await User.findOne({ email: 'ndkapale@sanjivani.edu.in' });
  }

  if (ndkapaleUser) {
    ndkapaleUser.username = 'ndkapale';
    ndkapaleUser.email = 'ndkapale@sanjivani.edu.in';
    ndkapaleUser.employeeId = 'FAC-CS-108';
    ndkapaleUser.name = 'Prof. N. D. Kapale';
    ndkapaleUser.passwordHash = facultyPasswordHash;
    ndkapaleUser.role = 'Faculty';
    ndkapaleUser.isActive = true;
    await ndkapaleUser.save();
  } else {
    ndkapaleUser = await User.create({
      username: 'ndkapale',
      email: 'ndkapale@sanjivani.edu.in',
      employeeId: 'FAC-CS-108',
      name: 'Prof. N. D. Kapale',
      passwordHash: facultyPasswordHash,
      role: 'Faculty',
      isActive: true,
    });
  }

  // Primary FacultyProfile for Prof. N. D. Kapale (NAMDEO DADA KAPALE)
  let kapaleProfile = await FacultyProfile.findOne({ employeeId: 'FAC-CS-108' });
  if (kapaleProfile) {
    kapaleProfile.user = facCs108User._id;
    kapaleProfile.name = 'Prof. N. D. Kapale';
    kapaleProfile.department = 'Computer Engineering';
    kapaleProfile.designation = 'Assistant Professor';
    kapaleProfile.specialization = 'Software Engineering, Modeling and Design';
    kapaleProfile.email = 'ndkapale@sanjivani.edu.in';
    await kapaleProfile.save();
  } else {
    kapaleProfile = await FacultyProfile.create({
      user: facCs108User._id,
      employeeId: 'FAC-CS-108',
      name: 'Prof. N. D. Kapale',
      department: 'Computer Engineering',
      designation: 'Assistant Professor',
      email: 'ndkapale@sanjivani.edu.in',
      phone: '+91 98220 54321',
      specialization: 'Software Engineering, Modeling and Design',
    });
  }

  // Provision other faculty members from timetable
  const otherFacultyData = [
    {
      username: 'schaudhari',
      email: 'schaudhari@sanjivani.edu.in',
      employeeId: 'FAC-EC-101',
      name: 'SACHIN VASANT CHAUDHARI',
      department: 'Electronics & Computer Engineering',
      designation: 'Associate Professor',
    },
    {
      username: 'skgupta',
      email: 'skgupta@sanjivani.edu.in',
      employeeId: 'FAC-CS-102',
      name: 'SUMEET KAILASH GUPTA',
      department: 'Computer Engineering',
      designation: 'Assistant Professor',
    },
    {
      username: 'dpmahurkar',
      email: 'dpmahurkar@sanjivani.edu.in',
      employeeId: 'FAC-EC-103',
      name: 'DEEPAK PRALHAD MAHURKAR',
      department: 'Electronics & Computer Engineering',
      designation: 'Assistant Professor',
    },
    {
      username: 'masayyad',
      email: 'masayyad@sanjivani.edu.in',
      employeeId: 'FAC-HM-104',
      name: 'MUZFFARALI AKBAR SAYYAD',
      department: 'Humanities & Social Sciences',
      designation: 'Assistant Professor',
    },
    {
      username: 'nibhopale',
      email: 'nibhopale@sanjivani.edu.in',
      employeeId: 'FAC-CS-105',
      name: 'NITIN ISHWARLAL BHOPALE',
      department: 'Computer Engineering',
      designation: 'Associate Professor',
    },
  ];

  const facultyProfilesMap = new Map();
  facultyProfilesMap.set('NAMDEO DADA KAPALE', kapaleProfile);
  facultyProfilesMap.set('Prof. N. D. Kapale', kapaleProfile);

  for (const f of otherFacultyData) {
    let u = await User.findOne({ username: f.username });
    if (!u) {
      u = await User.create({
        username: f.username,
        email: f.email,
        employeeId: f.employeeId,
        name: f.name,
        passwordHash: facultyPasswordHash,
        role: 'Faculty',
        isActive: true,
      });
    }

    let p = await FacultyProfile.findOne({ employeeId: f.employeeId });
    if (!p) {
      p = await FacultyProfile.create({
        user: u._id,
        employeeId: f.employeeId,
        name: f.name,
        department: f.department,
        designation: f.designation,
        email: f.email,
      });
    }
    facultyProfilesMap.set(f.name, p);
  }

  // 3. Define the 11 courses from user's timetable
  const coursesToSeed = [
    {
      subjectCode: 'EC301',
      subjectName: 'Semiconductor Devices and Circuits',
      subjectType: 'TH',
      credits: 3,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
      totalMaxMarks: 100,
      facultyName: 'SACHIN VASANT CHAUDHARI',
    },
    {
      subjectCode: 'CS302',
      subjectName: 'Software Engineering, Modeling and Design',
      subjectType: 'TH',
      credits: 3,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
      totalMaxMarks: 100,
      facultyName: 'NAMDEO DADA KAPALE', // Prof. N. D. Kapale
    },
    {
      subjectCode: 'CS303L',
      subjectName: 'Data Structures Lab',
      subjectType: 'PR',
      credits: 1,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 25,
      maxEseMarks: 25,
      totalMaxMarks: 50,
      facultyName: 'SUMEET KAILASH GUPTA',
    },
    {
      subjectCode: 'EC304',
      subjectName: 'Digital Design and HD Language',
      subjectType: 'TH',
      credits: 3,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
      totalMaxMarks: 100,
      facultyName: 'DEEPAK PRALHAD MAHURKAR',
    },
    {
      subjectCode: 'EC305L',
      subjectName: 'Semiconductor Devices and Circuits Lab',
      subjectType: 'PR',
      credits: 1,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 25,
      maxEseMarks: 25,
      totalMaxMarks: 50,
      facultyName: 'SACHIN VASANT CHAUDHARI',
    },
    {
      subjectCode: 'PR306',
      subjectName: 'Comm Eng Project/ Mini Project',
      subjectType: 'TW',
      credits: 2,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 50,
      maxEseMarks: 50,
      totalMaxMarks: 100,
      facultyName: 'MUZFFARALI AKBAR SAYYAD',
    },
    {
      subjectCode: 'CS307L',
      subjectName: 'Software Engineering, Modeling and Design Lab',
      subjectType: 'PR',
      credits: 1,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 25,
      maxEseMarks: 25,
      totalMaxMarks: 50,
      facultyName: 'NAMDEO DADA KAPALE', // Prof. N. D. Kapale
    },
    {
      subjectCode: 'HM308',
      subjectName: 'Entrepreneurship ,Innovation and Startup Ecosystem',
      subjectType: 'TH',
      credits: 2,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
      totalMaxMarks: 100,
      facultyName: 'SACHIN VASANT CHAUDHARI',
    },
    {
      subjectCode: 'HM309',
      subjectName: 'Universal Human Values & Ethics',
      subjectType: 'TH',
      credits: 2,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
      totalMaxMarks: 100,
      facultyName: 'MUZFFARALI AKBAR SAYYAD',
    },
    {
      subjectCode: 'EC310L',
      subjectName: 'Digital Design and HD Language Lab',
      subjectType: 'PR',
      credits: 1,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 25,
      maxEseMarks: 25,
      totalMaxMarks: 50,
      facultyName: 'DEEPAK PRALHAD MAHURKAR',
    },
    {
      subjectCode: 'CS311',
      subjectName: 'Data Structures',
      subjectType: 'TH',
      credits: 3,
      semester: 5,
      department: 'Computer Engineering',
      maxInternalMarks: 30,
      maxEseMarks: 70,
      totalMaxMarks: 100,
      facultyName: 'NITIN ISHWARLAL BHOPALE',
    },
  ];

  const subjectMap = new Map();

  for (const c of coursesToSeed) {
    let sub = await Subject.findOne({ subjectCode: c.subjectCode });
    if (!sub) {
      sub = await Subject.create({
        subjectCode: c.subjectCode,
        subjectName: c.subjectName,
        subjectType: c.subjectType,
        credits: c.credits,
        semester: c.semester,
        department: c.department,
        maxInternalMarks: c.maxInternalMarks,
        maxEseMarks: c.maxEseMarks,
        totalMaxMarks: c.totalMaxMarks,
      });
    } else {
      sub.subjectName = c.subjectName;
      sub.subjectType = c.subjectType;
      sub.credits = c.credits;
      sub.maxInternalMarks = c.maxInternalMarks;
      sub.maxEseMarks = c.maxEseMarks;
      sub.totalMaxMarks = c.totalMaxMarks;
      await sub.save();
    }
    subjectMap.set(c.subjectCode, sub);
  }

  // 4. Assign all 11 subjects to faculty per timetable
  for (const c of coursesToSeed) {
    const sub = subjectMap.get(c.subjectCode);
    const prof = facultyProfilesMap.get(c.facultyName);
    if (sub && prof) {
      await FacultyAssignment.findOneAndUpdate(
        { faculty: prof._id, subject: sub._id, academicYear: '2024-2025', semester: 5 },
        {
          $set: {
            division: 'A',
            status: 'Active',
            assignedBy: admin._id,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  // Also maintain CE501 and CE506 assignments for Prof. N. D. Kapale for test suite compatibility
  const ce501 = await Subject.findOne({ subjectCode: 'CE501' });
  if (ce501) {
    await FacultyAssignment.findOneAndUpdate(
      { faculty: kapaleProfile._id, subject: ce501._id, academicYear: '2024-2025', semester: 5 },
      { $set: { division: 'A', status: 'Active', assignedBy: admin._id } },
      { upsert: true, new: true }
    );
  }

  const ce506 = await Subject.findOne({ subjectCode: 'CE506' });
  if (ce506) {
    await FacultyAssignment.findOneAndUpdate(
      { faculty: kapaleProfile._id, subject: ce506._id, academicYear: '2024-2025', semester: 5 },
      { $set: { division: 'A', status: 'Active', assignedBy: admin._id } },
      { upsert: true, new: true }
    );
  }

  // 5. Ensure Students exist in DB
  let student1 = await StudentProfile.findOne({ prn: '22UCO01042' });
  let student2 = await StudentProfile.findOne({ prn: '22UIT02015' });

  // 6. Populate Mock Marks in CourseMark for all students
  // CS302 & CS307L are editable by Prof. N. D. Kapale in their dashboard
  const cs302 = subjectMap.get('CS302');
  const cs307l = subjectMap.get('CS307L');

  const mockMarkEntries = [
    // Student 1 (Aarav Shinde) in CS302 (Prof. N. D. Kapale)
    {
      studentPrn: '22UCO01042',
      studentProfile: student1,
      subject: cs302,
      facultyProfile: kapaleProfile,
      internalMarks: 28, // Max 30
      eseMarks: 64,      // Max 70
      status: 'Draft',   // Editable by faculty!
    },
    // Student 1 (Aarav Shinde) in CS307L (Prof. N. D. Kapale)
    {
      studentPrn: '22UCO01042',
      studentProfile: student1,
      subject: cs307l,
      facultyProfile: kapaleProfile,
      internalMarks: 24, // Max 25
      eseMarks: 24,      // Max 25
      status: 'Draft',   // Editable by faculty!
    },
    // Student 2 (Priya Deshmukh) in CS302 (Prof. N. D. Kapale)
    {
      studentPrn: '22UIT02015',
      studentProfile: student2,
      subject: cs302,
      facultyProfile: kapaleProfile,
      internalMarks: 26,
      eseMarks: 60,
      status: 'Draft',
    },
    // Student 2 (Priya Deshmukh) in CS307L (Prof. N. D. Kapale)
    {
      studentPrn: '22UIT02015',
      studentProfile: student2,
      subject: cs307l,
      facultyProfile: kapaleProfile,
      internalMarks: 23,
      eseMarks: 23,
      status: 'Draft',
    },
  ];

  for (const m of mockMarkEntries) {
    if (!m.studentProfile || !m.subject) continue;
    await CourseMark.findOneAndUpdate(
      {
        student: m.studentProfile._id,
        subject: m.subject._id,
        academicYear: '2024-2025',
        semester: 5,
        attempt: 1,
      },
      {
        $set: {
          prn: m.studentPrn,
          studentName: m.studentProfile.name,
          rollNo: m.studentProfile.rollNo,
          seatNo: m.studentProfile.seatNo,
          courseCode: m.subject.subjectCode,
          faculty: m.facultyProfile._id,
          academicYear: '2024-2025',
          semester: 5,
          division: 'A',
          internalMarks: m.internalMarks,
          eseMarks: m.eseMarks,
          totalMarks: m.internalMarks + m.eseMarks,
          maxInternal: m.subject.maxInternalMarks,
          maxEse: m.subject.maxEseMarks,
          totalMax: m.subject.totalMaxMarks,
          status: m.status,
          evaluatedBy: m.facultyProfile.name,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 7. Build Published ResultRecord for Student 1 (Aarav Shinde) with all 11 courses
  const student1Scores = [
    {
      courseCode: 'EC301',
      courseTitle: 'Semiconductor Devices and Circuits',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 24,
      eseMarks: 58,
      totalMarks: 82,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 27,
    },
    {
      courseCode: 'CS302',
      courseTitle: 'Software Engineering, Modeling and Design',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 28,
      eseMarks: 64,
      totalMarks: 92,
      grade: 'O',
      gradePoints: 10,
      creditPoints: 30,
    },
    {
      courseCode: 'CS303L',
      courseTitle: 'Data Structures Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 23,
      eseMarks: 23,
      totalMarks: 46,
      grade: 'O',
      gradePoints: 10,
      creditPoints: 10,
    },
    {
      courseCode: 'EC304',
      courseTitle: 'Digital Design and HD Language',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 22,
      eseMarks: 52,
      totalMarks: 74,
      grade: 'A',
      gradePoints: 8,
      creditPoints: 24,
    },
    {
      courseCode: 'EC305L',
      courseTitle: 'Semiconductor Devices and Circuits Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 21,
      eseMarks: 22,
      totalMarks: 43,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 9,
    },
    {
      courseCode: 'PR306',
      courseTitle: 'Comm Eng Project/ Mini Project',
      courseType: 'TW',
      credits: 2,
      earnedCredits: 2,
      internalMarks: 45,
      eseMarks: 44,
      totalMarks: 89,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 18,
    },
    {
      courseCode: 'CS307L',
      courseTitle: 'Software Engineering, Modeling and Design Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 24,
      eseMarks: 24,
      totalMarks: 48,
      grade: 'O',
      gradePoints: 10,
      creditPoints: 10,
    },
    {
      courseCode: 'HM308',
      courseTitle: 'Entrepreneurship ,Innovation and Startup Ecosystem',
      courseType: 'TH',
      credits: 2,
      earnedCredits: 2,
      internalMarks: 25,
      eseMarks: 57,
      totalMarks: 82,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 18,
    },
    {
      courseCode: 'HM309',
      courseTitle: 'Universal Human Values & Ethics',
      courseType: 'TH',
      credits: 2,
      earnedCredits: 2,
      internalMarks: 26,
      eseMarks: 58,
      totalMarks: 84,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 18,
    },
    {
      courseCode: 'EC310L',
      courseTitle: 'Digital Design and HD Language Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 22,
      eseMarks: 21,
      totalMarks: 43,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 9,
    },
    {
      courseCode: 'CS311',
      courseTitle: 'Data Structures',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 25,
      eseMarks: 56,
      totalMarks: 81,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 27,
    },
  ];

  if (student1) {
    await ResultRecord.findOneAndUpdate(
      { prn: '22UCO01042', semester: 5, academicYear: '2024-2025' },
      {
        $set: {
          student: student1._id,
          prn: '22UCO01042',
          seatNo: student1.seatNo || 'SCOE24-C308',
          studentName: student1.name || 'AARAV RAJESH SHINDE',
          motherName: student1.motherName || 'SUNITA',
          branch: student1.branch || 'Computer Engineering',
          degree: student1.degree || 'Bachelor of Technology (B.Tech)',
          academicYear: '2024-2025',
          semester: 5,
          semesterLabel: 'Semester V',
          examinationName: 'Winter Session 2024 Autonomous Examination',
          resultDate: '12-01-2025',
          subjects: student1Scores,
          totalCR: 22,
          totalEC: 22,
          totalGP: 200,
          sgpa: 9.09,
          cgpa: 8.95,
          resultStatus: 'PASS - FIRST CLASS WITH DISTINCTION',
          attempt: 1,
          isPublished: true,
          reviewStatus: 'Published',
          publishedAt: new Date(),
          verifiedBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 8. Build Published ResultRecord for Student 2 (Priya Deshmukh) with all 11 courses
  const student2Scores = [
    {
      courseCode: 'EC301',
      courseTitle: 'Semiconductor Devices and Circuits',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 23,
      eseMarks: 53,
      totalMarks: 76,
      grade: 'A',
      gradePoints: 8,
      creditPoints: 24,
    },
    {
      courseCode: 'CS302',
      courseTitle: 'Software Engineering, Modeling and Design',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 26,
      eseMarks: 60,
      totalMarks: 86,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 27,
    },
    {
      courseCode: 'CS303L',
      courseTitle: 'Data Structures Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 22,
      eseMarks: 21,
      totalMarks: 43,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 9,
    },
    {
      courseCode: 'EC304',
      courseTitle: 'Digital Design and HD Language',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 25,
      eseMarks: 57,
      totalMarks: 82,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 27,
    },
    {
      courseCode: 'EC305L',
      courseTitle: 'Semiconductor Devices and Circuits Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 22,
      eseMarks: 22,
      totalMarks: 44,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 9,
    },
    {
      courseCode: 'PR306',
      courseTitle: 'Comm Eng Project/ Mini Project',
      courseType: 'TW',
      credits: 2,
      earnedCredits: 2,
      internalMarks: 43,
      eseMarks: 44,
      totalMarks: 87,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 18,
    },
    {
      courseCode: 'CS307L',
      courseTitle: 'Software Engineering, Modeling and Design Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 23,
      eseMarks: 23,
      totalMarks: 46,
      grade: 'O',
      gradePoints: 10,
      creditPoints: 10,
    },
    {
      courseCode: 'HM308',
      courseTitle: 'Entrepreneurship ,Innovation and Startup Ecosystem',
      courseType: 'TH',
      credits: 2,
      earnedCredits: 2,
      internalMarks: 24,
      eseMarks: 54,
      totalMarks: 78,
      grade: 'A',
      gradePoints: 8,
      creditPoints: 16,
    },
    {
      courseCode: 'HM309',
      courseTitle: 'Universal Human Values & Ethics',
      courseType: 'TH',
      credits: 2,
      earnedCredits: 2,
      internalMarks: 25,
      eseMarks: 56,
      totalMarks: 81,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 18,
    },
    {
      courseCode: 'EC310L',
      courseTitle: 'Digital Design and HD Language Lab',
      courseType: 'PR',
      credits: 1,
      earnedCredits: 1,
      internalMarks: 21,
      eseMarks: 21,
      totalMarks: 42,
      grade: 'A+',
      gradePoints: 9,
      creditPoints: 9,
    },
    {
      courseCode: 'CS311',
      courseTitle: 'Data Structures',
      courseType: 'TH',
      credits: 3,
      earnedCredits: 3,
      internalMarks: 24,
      eseMarks: 53,
      totalMarks: 77,
      grade: 'A',
      gradePoints: 8,
      creditPoints: 24,
    },
  ];

  if (student2) {
    await ResultRecord.findOneAndUpdate(
      { prn: '22UIT02015', semester: 5, academicYear: '2024-2025' },
      {
        $set: {
          student: student2._id,
          prn: '22UIT02015',
          seatNo: student2.seatNo || 'SCOE24-I114',
          studentName: student2.name || 'PRIYA SANJAY DESHMUKH',
          motherName: student2.motherName || 'ANITA',
          branch: student2.branch || 'Information Technology',
          degree: student2.degree || 'Bachelor of Technology (B.Tech)',
          academicYear: '2024-2025',
          semester: 5,
          semesterLabel: 'Semester V',
          examinationName: 'Winter Session 2024 Autonomous Examination',
          resultDate: '12-01-2025',
          subjects: student2Scores,
          totalCR: 22,
          totalEC: 22,
          totalGP: 191,
          sgpa: 8.68,
          cgpa: 8.72,
          resultStatus: 'PASS - FIRST CLASS WITH DISTINCTION',
          attempt: 1,
          isPublished: true,
          reviewStatus: 'Published',
          publishedAt: new Date(),
          verifiedBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
  }

  console.log('[Curriculum Update] Successfully populated 11 courses, Prof. N. D. Kapale account, faculty assignments, mock marks, and published Statement of Grades!');
}

if (process.argv[1] && process.argv[1].endsWith('populateNewCurriculum.js')) {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanjivani_rms')
    .then(async () => {
      await populateNewCurriculum();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
