const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudentGroup = require('../models/StudentGroup');
const Admission = require('../models/Admission');
const { auth, adminOnly } = require('../middleware/auth');

// Get assigned students for admin
router.get('/assigned-students', auth, adminOnly, async (req, res) => {
  try {
    // Get groups assigned to this admin
    const assignedGroups = await StudentGroup.find({ assignedAdmin: req.user._id })
      .populate('students', 'name email prn')
      .populate('createdBy', 'name email');

    let students = [];
    
    for (const group of assignedGroups) {
      for (const student of group.students) {
        // Get admission details for each student
        const admission = await Admission.findOne({ 
          $or: [
            { email: student.email },
            { studentId: student.prn }
          ]
        });

        students.push({
          _id: student._id,
          name: student.name,
          email: student.email,
          prn: student.prn,
          phone: admission?.phone || '',
          groupName: group.name,
          groupId: group._id,
          admissionDetails: {
            course: admission?.course || '',
            branch: admission?.branch || '',
            semester: admission?.semester || '',
            academicYear: admission?.academicYear || ''
          }
        });
      }
    }

    res.json({ students });
  } catch (error) {
    console.error('Error fetching assigned students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send email to student
router.post('/send-email', auth, adminOnly, async (req, res) => {
  try {
    const { studentId, subject, message, includeTempPassword } = req.body;

    if (!studentId || !subject || !message) {
      return res.status(400).json({ message: 'Student ID, subject, and message are required' });
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get admission details for phone number
    const admission = await Admission.findOne({ 
      $or: [
        { email: student.email },
        { studentId: student.prn }
      ]
    });

    // Prepare email content
    let emailContent = message;
    
    if (includeTempPassword) {
      emailContent += `\n\nYour temporary login credentials:\n`;
      emailContent += `Email: ${student.email}\n`;
      emailContent += `Temporary Password: temp123\n\n`;
      emailContent += `⚠️ IMPORTANT: Please login with these credentials and immediately go to your Profile section to change your password for security reasons.\n\n`;
      emailContent += `Login URL: http://localhost:3000/login\n`;
    }

    // Send email (mock implementation - replace with actual email service)
    const emailSent = await sendEmail(student.email, subject, emailContent);
    
    if (emailSent) {
      res.json({ 
        message: 'Email sent successfully',
        recipient: student.email,
        subject: subject
      });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send SMS to student
router.post('/send-sms', auth, adminOnly, async (req, res) => {
  try {
    const { studentId, message, includeTempPassword } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({ message: 'Student ID and message are required' });
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get admission details for phone number
    const admission = await Admission.findOne({ 
      $or: [
        { email: student.email },
        { studentId: student.prn }
      ]
    });

    if (!admission || !admission.phone) {
      return res.status(400).json({ message: 'Student phone number not found' });
    }

    // Prepare SMS content
    let smsContent = message;
    
    if (includeTempPassword) {
      smsContent += `\n\nLogin: ${student.email}\nTemp Password: temp123\n`;
      smsContent += `⚠️ Change password after login!\n`;
      smsContent += `URL: http://localhost:3000/login`;
    }

    // Send SMS (mock implementation - replace with actual SMS service)
    const smsSent = await sendSMS(admission.phone, smsContent);
    
    if (smsSent) {
      res.json({ 
        message: 'SMS sent successfully',
        recipient: admission.phone,
        studentName: student.name
      });
    } else {
      res.status(500).json({ message: 'Failed to send SMS' });
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send bulk email to multiple students
router.post('/send-bulk-email', auth, adminOnly, async (req, res) => {
  try {
    const { studentIds, subject, message, includeTempPassword } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const results = [];
    
    for (const studentId of studentIds) {
      try {
        const student = await User.findById(studentId);
        if (!student) {
          results.push({ studentId, success: false, error: 'Student not found' });
          continue;
        }

        let emailContent = message;
        
        if (includeTempPassword) {
          emailContent += `\n\nYour temporary login credentials:\n`;
          emailContent += `Email: ${student.email}\n`;
          emailContent += `Temporary Password: temp123\n\n`;
          emailContent += `⚠️ IMPORTANT: Please login with these credentials and immediately go to your Profile section to change your password for security reasons.\n\n`;
          emailContent += `Login URL: http://localhost:3000/login\n`;
        }

        const emailSent = await sendEmail(student.email, subject, emailContent);
        
        results.push({
          studentId,
          studentName: student.name,
          studentEmail: student.email,
          success: emailSent,
          error: emailSent ? null : 'Failed to send email'
        });
      } catch (error) {
        results.push({ studentId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      message: `Bulk email completed: ${successCount} sent, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send bulk SMS to multiple students
router.post('/send-bulk-sms', auth, adminOnly, async (req, res) => {
  try {
    const { studentIds, message, includeTempPassword } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const results = [];
    
    for (const studentId of studentIds) {
      try {
        const student = await User.findById(studentId);
        if (!student) {
          results.push({ studentId, success: false, error: 'Student not found' });
          continue;
        }

        const admission = await Admission.findOne({ 
          $or: [
            { email: student.email },
            { studentId: student.prn }
          ]
        });

        if (!admission || !admission.phone) {
          results.push({ studentId, success: false, error: 'Phone number not found' });
          continue;
        }

        let smsContent = message;
        
        if (includeTempPassword) {
          smsContent += `\n\nLogin: ${student.email}\nTemp Password: temp123\n`;
          smsContent += `⚠️ Change password after login!\n`;
          smsContent += `URL: http://localhost:3000/login`;
        }

        const smsSent = await sendSMS(admission.phone, smsContent);
        
        results.push({
          studentId,
          studentName: student.name,
          studentPhone: admission.phone,
          success: smsSent,
          error: smsSent ? null : 'Failed to send SMS'
        });
      } catch (error) {
        results.push({ studentId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      message: `Bulk SMS completed: ${successCount} sent, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mock email service (replace with actual email service like nodemailer)
const sendEmail = async (to, subject, content) => {
  try {
    // Mock email sending - replace with actual implementation
    console.log(`📧 EMAIL SENT:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    console.log(`---`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Mock SMS service (replace with actual SMS service)
const sendSMS = async (phone, content) => {
  try {
    // Mock SMS sending - replace with actual implementation
    console.log(`📱 SMS SENT:`);
    console.log(`To: ${phone}`);
    console.log(`Content: ${content}`);
    console.log(`---`);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

module.exports = router;
