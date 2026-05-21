const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, userType, phone, programOfStudy, computerNumber } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new user (initially unverified)
    user = new User({
      firstName,
      lastName,
      email,
      password,
      userType: userType || 'both',
      phone,
      programOfStudy,
      computerNumber,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: Date.now() + 3600000 // 1 hour
    });

    await user.save();

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your Smart Money account',
        message: `Your verification code is: ${verificationCode}. It expires in 1 hour.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #5B21B6;">Welcome to Smart Money!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for joining our platform. Please use the following 6-digit code to verify your email address:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #5B21B6; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p>This code will expire in 1 hour.</p>
            <p>If you didn't sign up for Smart Money, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} Smart Money · Mikecreatives Inc</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // We don't return error here because the user is still created in DB
      // In production, you might want to handle this differently
    }

    console.log(`[Verification] Code for ${email}: ${verificationCode}`);

    res.json({
      message: 'Registration initiated. Please verify your email.',
      email: user.email,
      needsVerification: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      emailVerificationCode: code,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isEmailVerified: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified && user.emailVerificationCode) {
      return res.status(403).json({
        error: 'Email not verified',
        needsVerification: true,
        email: user.email
      });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        programOfStudy: user.programOfStudy,
        computerNumber: user.computerNumber,
        creditScore: user.creditScore,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security)
      return res.json({
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });

    // Save reset code and token
    user.passwordResetCode = resetCode;
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 900000; // 15 minutes
    await user.save();

    // Send reset email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your Smart Money password',
        message: `Your password reset code is: ${resetCode}. It expires in 15 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #5B21B6;">Password Reset Request</h2>
            <p>Hi ${user.firstName},</p>
            <p>We received a request to reset your Smart Money password. Use this 6-digit code to reset it:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #5B21B6; margin: 20px 0;">
              ${resetCode}
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} Smart Money · Mikecreatives Inc</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
    }

    console.log(`[Password Reset] Code for ${email}: ${resetCode}`);

    res.json({
      message: 'If an account exists with this email, a reset link has been sent.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Update password
    user.password = newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new login token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Password reset successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
