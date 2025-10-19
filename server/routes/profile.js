const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admission = require('../models/Admission');
const { auth } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Get unified profile data based on user role
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profileData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // For students, get admission data
    if (user.role === 'student') {
      const admission = await Admission.findOne({ email: user.email });
      if (admission) {
        profileData = {
          ...profileData,
          prn: user.prn || admission.studentId,
          dateOfBirth: user.dateOfBirth || admission.dateOfBirth,
          mobileNo: user.mobileNo || admission.mobileNo,
          course: user.course || admission.course,
          branch: user.branch || admission.branch,
          semester: user.semester || admission.semester,
          academicYear: user.academicYear || admission.academicYear,
          address: {
            street: user.address?.street || admission.address?.street || '',
            city: user.address?.city || admission.address?.city || '',
            state: user.address?.state || admission.address?.state || '',
            pincode: user.address?.pincode || admission.address?.pincode || '',
            country: user.address?.country || admission.address?.country || ''
          }
        };
      } else {
        // Fallback to user data if no admission found
        profileData = {
          ...profileData,
          prn: user.prn || '',
          dateOfBirth: user.dateOfBirth || '',
          mobileNo: user.mobileNo || '',
          course: user.course || '',
          branch: user.branch || '',
          semester: user.semester || '',
          academicYear: user.academicYear || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            pincode: user.address?.pincode || '',
            country: user.address?.country || ''
          }
        };
      }
    } else {
      // For higher roles, return registrar-managed fields
      profileData = {
        ...profileData,
        department: user.department || '',
        designation: user.designation || '',
        employeeId: user.employeeId || '',
        joiningDate: user.joiningDate || '',
        mobileNo: user.mobileNo || '',
        dateOfBirth: user.dateOfBirth || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          pincode: user.address?.pincode || '',
          country: user.address?.country || ''
        }
      };
    }

    res.json(profileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile (restricted based on role)
router.put('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, currentPassword, newPassword } = req.body;

    // Update basic info
    if (name) user.name = name;
    if (email) user.email = email;

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const bcrypt = require('bcryptjs');
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
