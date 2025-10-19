const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email (mock implementation - replace with actual email service)
const sendOTPEmail = async (email, otp) => {
  // For now, we'll just log the OTP to console
  // In production, use nodemailer or similar service
  console.log(`OTP for ${email}: ${otp}`);
  
  // Mock email sending - replace with actual implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`📧 Email sent to ${email} with OTP: ${otp}`);
      resolve(true);
    }, 1000);
  });
};

// Request password reset
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), {
      otp,
      expiresAt,
      userId: user._id
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({
      message: 'OTP sent to your email address',
      email: email
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email.toLowerCase());
    
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (new Date() > storedData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    storedData.resetToken = resetToken;
    storedData.tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    res.json({
      message: 'OTP verified successfully',
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const storedData = otpStore.get(email.toLowerCase());
    
    if (!storedData || !storedData.resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (storedData.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    if (new Date() > storedData.tokenExpiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Find user and update password
    const user = await User.findById(storedData.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clean up stored data
    otpStore.delete(email.toLowerCase());

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
