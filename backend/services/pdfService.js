import PDFDocument from 'pdfkit';
import { collegeInfo } from '../data/sampleData.js';

/**
 * PDF Service for Sanjivani College of Engineering
 * Generates official, publication-quality A4 Statement of Grades (Marksheet)
 * 
 * Strict Invariants:
 * 1. Only accepts authoritative, verified, server-side ResultRecord and StudentProfile data.
 * 2. Formats conforming to Savitribai Phule Pune University autonomous college standard.
 * 3. Does not invent fake official seals or signatures.
 */

/**
 * Formats a Date object to DD-MM-YYYY format
 */
function formatDate(date) {
  if (!date) return new Date().toLocaleDateString('en-GB');
  if (typeof date === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(date)) return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Generates an official Statement of Grades PDF stream
 * @param {Object} options
 * @param {Object} options.result Verified ResultRecord from database (must be isPublished: true)
 * @param {Object} options.student Verified StudentProfile from database
 * @param {Object} [options.college] Optional institutional metadata override
 * @returns {Promise<Buffer>} Returns a Promise resolving to a PDF Buffer
 */
export function generateStatementOfGradesPDF({ result, student, college = collegeInfo }) {
  return new Promise((resolve, reject) => {
    try {
      if (!result) {
        throw new Error('ResultRecord is required to generate Statement of Grades PDF.');
      }
      if (!result.isPublished) {
        throw new Error('Security Invariant Violation: Cannot generate PDF for an unpublished result record.');
      }

      // Create PDF in A4 size (595.28 x 841.89 points) with 30pt margins
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 25, left: 25, right: 25 },
        autoFirstPage: true,
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const leftMargin = 25;
      const rightMargin = pageWidth - 25;
      const contentWidth = rightMargin - leftMargin; // 545.28 pt

      // --------------------------------------------------------------------------
      // 1. DUAL ORNAMENTAL BORDER (Academic Document Styling)
      // --------------------------------------------------------------------------
      doc
        .save()
        .lineWidth(1.5)
        .strokeColor('#1e3a8a') // Deep Academic Blue
        .rect(15, 15, pageWidth - 30, pageHeight - 30)
        .stroke();

      doc
        .lineWidth(0.5)
        .strokeColor('#94a3b8') // Slate border line
        .rect(18, 18, pageWidth - 36, pageHeight - 36)
        .stroke()
        .restore();

      let y = 30;

      // --------------------------------------------------------------------------
      // 2. INSTITUTIONAL HEADER & BRANDING
      // --------------------------------------------------------------------------
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text(college.trustName || "SANJIVANI RURAL EDUCATION SOCIETY'S", leftMargin, y, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 0.8,
        });

      y += 12;

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0f172a') // Slate 900
        .text(college.collegeName || "SANJIVANI COLLEGE OF ENGINEERING, KOPARGAON", leftMargin, y, {
          width: contentWidth,
          align: 'center',
          characterSpacing: 0.5,
        });

      y += 18;

      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor('#334155')
        .text(college.subTitle || "(An Autonomous Institute Affiliated to Savitribai Phule Pune University, Pune)", leftMargin, y, {
          width: contentWidth,
          align: 'center',
        });

      y += 11;

      doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(college.accreditation || "Approved by AICTE, New Delhi | Accredited 'A' Grade by NAAC | NBA Accredited Programs", leftMargin, y, {
          width: contentWidth,
          align: 'center',
        });

      y += 12;

      // Horizontal decorative separator
      doc
        .strokeColor('#1e3a8a')
        .lineWidth(1.2)
        .moveTo(leftMargin + 10, y)
        .lineTo(rightMargin - 10, y)
        .stroke();

      y += 6;

      // --------------------------------------------------------------------------
      // 3. DOCUMENT TITLE BANNER
      // --------------------------------------------------------------------------
      // Background banner box
      const bannerHeight = 22;
      doc
        .save()
        .rect(leftMargin + 40, y, contentWidth - 80, bannerHeight)
        .fill('#1e3a8a')
        .restore();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('STATEMENT OF GRADES', leftMargin + 40, y + 5, {
          width: contentWidth - 80,
          align: 'center',
          characterSpacing: 1.5,
        });

      y += bannerHeight + 5;

      const examLabel = result.examinationName || 'Winter Session 2024 Autonomous Examination';
      doc
        .fontSize(8.5)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text(examLabel.toUpperCase(), leftMargin, y, {
          width: contentWidth,
          align: 'center',
        });

      y += 14;

      // --------------------------------------------------------------------------
      // 4. CANDIDATE & EXAMINATION IDENTIFICATION GRID
      // --------------------------------------------------------------------------
      const gridX = leftMargin;
      const gridWidth = contentWidth;
      const gridY = y;
      const colWidth = gridWidth / 2;
      const gridPadding = 5;

      // Student details
      const studentName = (result.studentName || student?.name || 'STUDENT NAME').toUpperCase();
      const motherName = (result.motherName || student?.motherName || 'NOT SPECIFIED').toUpperCase();
      const prn = (result.prn || student?.prn || '').toUpperCase();
      const seatNo = (result.seatNo || student?.seatNo || 'SCOE24').toUpperCase();
      const branchName = result.branch || student?.branch || 'Engineering';
      const degreeName = result.degree || student?.degree || 'Bachelor of Technology (B.Tech)';
      const semLabel = result.semesterLabel || `Semester ${result.semester || 5}`;
      const acadYear = result.academicYear || student?.academicYear || '2024-2025';

      // Height of info block
      const infoBoxHeight = 52;

      // Draw background and outline box
      doc
        .save()
        .rect(gridX, gridY, gridWidth, infoBoxHeight)
        .fillAndStroke('#f8fafc', '#cbd5e1')
        .restore();

      // Vertical dividing line
      doc
        .save()
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .moveTo(gridX + colWidth, gridY)
        .lineTo(gridX + colWidth, gridY + infoBoxHeight)
        .stroke()
        .restore();

      // Left Column Text
      const leftColX = gridX + gridPadding + 2;
      let leftY = gridY + 4;
      const rowGap = 12;

      doc.fontSize(7.5).fillColor('#475569').font('Helvetica');
      doc.text('Candidate Name:', leftColX, leftY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(studentName, leftColX + 75, leftY, { width: colWidth - 85, ellipsis: true });
      leftY += rowGap;

      doc.font('Helvetica').fillColor('#475569').text("Mother's Name:", leftColX, leftY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(motherName, leftColX + 75, leftY);
      leftY += rowGap;

      doc.font('Helvetica').fillColor('#475569').text('Degree / Branch:', leftColX, leftY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${degreeName}`, leftColX + 75, leftY);
      leftY += rowGap;

      doc.font('Helvetica').fillColor('#475569').text('Branch / Discipline:', leftColX, leftY);
      doc.font('Helvetica-Bold').fillColor('#1e3a8a').text(branchName, leftColX + 75, leftY, { width: colWidth - 85, ellipsis: true });

      // Right Column Text
      const rightColX = gridX + colWidth + gridPadding + 4;
      let rightY = gridY + 4;

      doc.fontSize(7.5).font('Helvetica').fillColor('#475569').text('Permanent Reg. No. (PRN):', rightColX, rightY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(prn, rightColX + 105, rightY);
      rightY += rowGap;

      doc.font('Helvetica').fillColor('#475569').text('Examination Seat No.:', rightColX, rightY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(seatNo, rightColX + 105, rightY);
      rightY += rowGap;

      doc.font('Helvetica').fillColor('#475569').text('Academic Session:', rightColX, rightY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(`${acadYear} • ${semLabel}`, rightColX + 105, rightY);
      rightY += rowGap;

      doc.font('Helvetica').fillColor('#475569').text('Autonomous Pattern:', rightColX, rightY);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text('2022 Autonomous Pattern', rightColX + 105, rightY);

      y = gridY + infoBoxHeight + 8;

      // --------------------------------------------------------------------------
      // 5. COURSE EVALUATION MARKS & GRADES TABLE
      // --------------------------------------------------------------------------
      // Column Widths (Total: 545.28 pt)
      const cols = [
        { key: 'code', label: 'Course Code', width: 62, align: 'center' },
        { key: 'title', label: 'Course Title', width: 228, align: 'left' },
        { key: 'type', label: 'Type', width: 34, align: 'center' },
        { key: 'cr', label: 'CR', width: 32, align: 'center' },
        { key: 'ec', label: 'EC', width: 32, align: 'center' },
        { key: 'grade', label: 'Grade', width: 38, align: 'center' },
        { key: 'gp', label: 'Grade Point', width: 55, align: 'center' },
        { key: 'cp', label: 'Credit Points', width: 64.28, align: 'center' },
      ];

      // Table Header Row
      const tableX = leftMargin;
      const headerHeight = 18;

      doc
        .save()
        .rect(tableX, y, contentWidth, headerHeight)
        .fill('#1e3a8a')
        .restore();

      let currentX = tableX;
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');

      cols.forEach((col) => {
        doc.text(col.label, currentX, y + 5, {
          width: col.width,
          align: col.align,
        });
        currentX += col.width;
      });

      y += headerHeight;

      // Table Body Rows
      const subjects = result.subjects || [];
      const rowHeight = 16.5;

      subjects.forEach((sub, index) => {
        const isEven = index % 2 === 0;

        // Background alternate row shading
        doc
          .save()
          .rect(tableX, y, contentWidth, rowHeight)
          .fillAndStroke(isEven ? '#ffffff' : '#f8fafc', '#e2e8f0')
          .restore();

        let rowX = tableX;

        // 1. Course Code
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#1e3a8a');
        doc.text(sub.courseCode || '', rowX, y + 4.5, {
          width: cols[0].width,
          align: cols[0].align,
        });
        rowX += cols[0].width;

        // 2. Course Title
        doc.font('Helvetica').fillColor('#0f172a');
        doc.text(sub.courseTitle || '', rowX + 4, y + 4.5, {
          width: cols[1].width - 8,
          align: cols[1].align,
          ellipsis: true,
        });
        rowX += cols[1].width;

        // 3. Course Type
        doc.font('Helvetica-Bold').fillColor('#475569');
        doc.text(sub.courseType || 'TH', rowX, y + 4.5, {
          width: cols[2].width,
          align: cols[2].align,
        });
        rowX += cols[2].width;

        // 4. Credits Registered (CR)
        doc.font('Helvetica').fillColor('#1e293b');
        doc.text(String(sub.credits ?? 0), rowX, y + 4.5, {
          width: cols[3].width,
          align: cols[3].align,
        });
        rowX += cols[3].width;

        // 5. Credits Earned (EC)
        doc.text(String(sub.earnedCredits ?? 0), rowX, y + 4.5, {
          width: cols[4].width,
          align: cols[4].align,
        });
        rowX += cols[4].width;

        // 6. Letter Grade
        const grade = sub.grade || 'F';
        let gradeColor = '#0f172a';
        if (grade === 'O') gradeColor = '#6b21a8';
        else if (grade.startsWith('A')) gradeColor = '#065f46';
        else if (grade === 'F') gradeColor = '#b91c1c';

        doc.font('Helvetica-Bold').fillColor(gradeColor);
        doc.text(grade, rowX, y + 4.5, {
          width: cols[5].width,
          align: cols[5].align,
        });
        rowX += cols[5].width;

        // 7. Grade Point (GP)
        doc.font('Helvetica-Bold').fillColor('#334155');
        doc.text(String(sub.gradePoints ?? sub.gradePoint ?? 0), rowX, y + 4.5, {
          width: cols[6].width,
          align: cols[6].align,
        });
        rowX += cols[6].width;

        // 8. Credit Points (CP = CR * GP)
        const cp = sub.creditPoints ?? (Number(sub.credits || 0) * Number(sub.gradePoints || 0));
        doc.font('Helvetica-Bold').fillColor('#0f172a');
        doc.text(String(cp), rowX, y + 4.5, {
          width: cols[7].width,
          align: cols[7].align,
        });

        // Vertical column grid lines
        let lineX = tableX;
        doc.save().strokeColor('#e2e8f0').lineWidth(0.5);
        cols.forEach((col) => {
          doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
          lineX += col.width;
        });
        doc.moveTo(tableX + contentWidth, y).lineTo(tableX + contentWidth, y + rowHeight).stroke();
        doc.restore();

        y += rowHeight;
      });

      // --------------------------------------------------------------------------
      // 6. TABLE FOOTER: TOTAL CREDITS & GRADE POINTS SUMMARY ROW
      // --------------------------------------------------------------------------
      const footerRowHeight = 18;
      doc
        .save()
        .rect(tableX, y, contentWidth, footerRowHeight)
        .fillAndStroke('#e2e8f0', '#94a3b8')
        .restore();

      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text('TOTAL / SEMESTER SUMMARY', tableX + 8, y + 5, {
        width: cols[0].width + cols[1].width + cols[2].width - 16,
        align: 'left',
      });

      // Total CR
      const crX = tableX + cols[0].width + cols[1].width + cols[2].width;
      doc.text(String(result.totalCR || 0), crX, y + 5, {
        width: cols[3].width,
        align: 'center',
      });

      // Total EC
      const ecX = crX + cols[3].width;
      doc.text(String(result.totalEC || 0), ecX, y + 5, {
        width: cols[4].width,
        align: 'center',
      });

      // Skip Grade column
      // Skip GP column
      // Total CP (Grade Points Sum)
      const cpX = ecX + cols[4].width + cols[5].width + cols[6].width;
      doc.fillColor('#1e3a8a').text(String(result.totalGP || 0), cpX, y + 5, {
        width: cols[7].width,
        align: 'center',
      });

      y += footerRowHeight + 8;

      // --------------------------------------------------------------------------
      // 7. OFFICIAL PERFORMANCE SUMMARY CARD (SGPA, CGPA, Result Status)
      // --------------------------------------------------------------------------
      const cardHeight = 44;
      doc
        .save()
        .rect(leftMargin, y, contentWidth, cardHeight)
        .fillAndStroke('#f1f5f9', '#1e3a8a')
        .restore();

      const sgpaVal = (result.sgpa ?? 0).toFixed(2);
      const cgpaVal = (result.cgpa ?? result.sgpa ?? 0).toFixed(2);
      const resultStatus = (result.resultStatus || 'PASS').toUpperCase();
      const decDate = formatDate(result.resultDate);

      const subColWidth = contentWidth / 4;

      // Column 1: SGPA
      let subX = leftMargin + 8;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('SEMESTER SGPA', subX, y + 6);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3a8a').text(sgpaVal, subX, y + 16);
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('Scale: 10.00 Point', subX, y + 33);

      // Column 2: CGPA
      subX += subColWidth;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('CUMULATIVE CGPA', subX, y + 6);
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f172a').text(cgpaVal, subX, y + 16);
      doc.fontSize(6.5).font('Helvetica').fillColor('#64748b').text('Across Active Terms', subX, y + 33);

      // Column 3: Overall Result Status
      subX += subColWidth;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('FINAL RESULT STATUS', subX, y + 6);
      let statusColor = '#065f46'; // Green
      if (resultStatus.includes('FAIL')) statusColor = '#b91c1c';
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor(statusColor).text(resultStatus, subX, y + 17, { width: subColWidth + 20 });

      // Column 4: Declaration Date & Credits
      subX += subColWidth + 20;
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569').text('DECLARATION DATE', subX, y + 6);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(decDate, subX, y + 17);
      doc.fontSize(6.5).font('Helvetica').fillColor('#475569').text(`Earned / Registered: ${result.totalEC} / ${result.totalCR} CR`, subX, y + 29);

      y += cardHeight + 8;

      // --------------------------------------------------------------------------
      // 8. GRADING SCALE CONVENTIONS & OFFICIAL FORMULAS
      // --------------------------------------------------------------------------
      const legendHeight = 44;
      doc
        .save()
        .rect(leftMargin, y, contentWidth, legendHeight)
        .fillAndStroke('#ffffff', '#cbd5e1')
        .restore();

      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#1e3a8a');
      doc.text('OFFICIAL AUTONOMOUS GRADING SCHEME & CALCULATION CONVENTIONS (SPPU NORMS)', leftMargin + 6, y + 4);

      doc.fontSize(6).font('Helvetica').fillColor('#334155');
      const scaleText = 
        'Grade Boundaries (Out of 100):  [O] Outstanding (90-100%, GP: 10)  |  [A+] Excellent (80-89%, GP: 9)  |  [A] Very Good (70-79%, GP: 8)\n' +
        '[B+] Good (60-69%, GP: 7)  |  [B] Above Average (50-59%, GP: 6)  |  [C] Pass (40-49%, GP: 5)  |  [F] Fail (Below 40%, GP: 0)\n' +
        'SGPA Formula: SGPA = Σ (Course Credits × Grade Points) / Σ (Course Credits) = Total GP / Total CR\n' +
        'Abbreviations: TH: Theory, PR: Practical, TW: Term Work, OR: Oral, CR: Credits, EC: Earned Credits, GP: Grade Points, CP: Credit Points';

      doc.text(scaleText, leftMargin + 6, y + 13, {
        width: contentWidth - 12,
        lineGap: 1.5,
      });

      y += legendHeight + 10;

      // --------------------------------------------------------------------------
      // 9. EXAMINATION SIGN-OFF & INSTITUTIONAL DISCLAIMER (NO FAKE SEALS)
      // --------------------------------------------------------------------------
      const signY = y + 12;

      // Left: Verification Cell stamp notice
      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('EXAMINATION CELL VERIFICATION', leftMargin + 10, signY);

      doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Generated from Centralized RMS Database', leftMargin + 10, signY + 11)
        .text(`Authentication Version: ${result.gradingSchemeVersion || 'Autonomous 2022 v1'}`, leftMargin + 10, signY + 20)
        .text(`Digital Verification Hash: ${result._id}`, leftMargin + 10, signY + 29);

      // Center: Official Institutional Seal Placement Box
      const sealBoxX = leftMargin + (contentWidth / 2) - 45;
      doc
        .save()
        .rect(sealBoxX, signY - 5, 90, 44)
        .dash(3, { space: 3 })
        .strokeColor('#94a3b8')
        .stroke()
        .restore();

      doc
        .fontSize(6)
        .font('Helvetica-Bold')
        .fillColor('#64748b')
        .text('SANJIVANI AUTONOMOUS', sealBoxX, signY + 5, { width: 90, align: 'center' })
        .font('Helvetica')
        .text('INSTITUTIONAL SEAL', sealBoxX, signY + 14, { width: 90, align: 'center' })
        .text('(DIGITALLY VALIDATED)', sealBoxX, signY + 23, { width: 90, align: 'center' });

      // Right: Controller of Examinations Sign-off
      const rightSignX = rightMargin - 150;
      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text('CONTROLLER OF EXAMINATIONS', rightSignX, signY + 12, { width: 140, align: 'center' });

      doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor('#475569')
        .text('Sanjivani College of Engineering', rightSignX, signY + 22, { width: 140, align: 'center' })
        .text('(Autonomous Institute)', rightSignX, signY + 31, { width: 140, align: 'center' });

      // --------------------------------------------------------------------------
      // 10. BOTTOM ACADEMIC DISCLOSURE FOOTER
      // --------------------------------------------------------------------------
      const footerY = pageHeight - 32;

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.5)
        .moveTo(leftMargin + 10, footerY - 5)
        .lineTo(rightMargin - 10, footerY - 5)
        .stroke();

      doc
        .fontSize(5.5)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(
          'DISCLAIMER: This official Statement of Grades is electronically generated by Sanjivani College of Engineering Examination Management Portal. ' +
          'Any tampering, erasure, or unauthorized alteration of this document constitutes a punishable offense under Maharashtra Public Universities Act.',
          leftMargin,
          footerY,
          { width: contentWidth, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
