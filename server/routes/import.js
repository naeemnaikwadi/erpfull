const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Admission = require('../models/Admission');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Import students from CSV/Excel
router.post('/students', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let imported = 0;
    let failed = 0;
    let skipped = 0;

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          for (const [index, row] of results.entries()) {
            try {
              // Validate required fields
              const requiredFields = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Course', 'Branch', 'Semester', 'Academic Year'];
              const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');
              
              if (missingFields.length > 0) {
                errors.push({
                  row: index + 2,
                  message: `Missing required fields: ${missingFields.join(', ')}`
                });
                failed++;
                continue;
              }

              // Check if user already exists
              const existingUser = await User.findOne({ email: row.Email });
              if (existingUser) {
                skipped++;
                continue;
              }

              // Create user
              const user = new User({
                firstName: row['First Name'],
                lastName: row['Last Name'],
                email: row.Email,
                phone: row.Phone,
                role: 'student',
                department: row.Course,
                designation: 'Student',
                employeeId: row['Student ID'],
                isActive: true,
                createdAt: new Date()
              });

              // Set default password (students will need to reset)
              const bcrypt = require('bcryptjs');
              user.password = await bcrypt.hash('student123', 10);

              await user.save();

              // Create admission record
              const admission = new Admission({
                studentId: user._id,
                firstName: row['First Name'],
                lastName: row['Last Name'],
                email: row.Email,
                phone: row.Phone,
                dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']) : new Date(),
                course: row.Course,
                branch: row.Branch,
                semester: parseInt(row.Semester),
                academicYear: row['Academic Year'],
                address: {
                  street: row.Address || '',
                  city: row.City || '',
                  state: row.State || '',
                  pincode: row.Pincode || ''
                },
                guardianInfo: {
                  name: row['Guardian Name'] || '',
                  phone: row['Guardian Phone'] || ''
                },
                admissionStatus: 'Approved',
                applicationDate: new Date(),
                reviewedBy: req.user.id,
                reviewDate: new Date()
              });

              await admission.save();
              imported++;

            } catch (error) {
              errors.push({
                row: index + 2,
                message: error.message
              });
              failed++;
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'Import completed',
            imported,
            failed,
            skipped,
            errors: errors.slice(0, 10) // Return first 10 errors
          });

        } catch (error) {
          res.status(500).json({ message: 'Import failed: ' + error.message });
        }
      })
      .on('error', (error) => {
        res.status(500).json({ message: 'File parsing error: ' + error.message });
      });

  } catch (error) {
    res.status(500).json({ message: 'Import failed: ' + error.message });
  }
});

// Get import template
router.get('/template/students', auth, (req, res) => {
  const templateData = [
    'Student ID,First Name,Last Name,Email,Phone,Date of Birth,Course,Branch,Semester,Academic Year,Address,City,State,Pincode,Guardian Name,Guardian Phone',
    'STU001,John,Doe,john.doe@example.com,9876543210,2000-01-15,B.Tech,Computer Science,3,2023-24,123 Main St,New York,NY,10001,Robert Doe,9876543211',
    'STU002,Jane,Smith,jane.smith@example.com,9876543212,2000-02-20,B.Tech,Information Technology,3,2023-24,456 Oak Ave,Los Angeles,CA,90210,Mary Smith,9876543213'
  ];

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.csv');
  res.send(templateData.join('\n'));
});

module.exports = router;
