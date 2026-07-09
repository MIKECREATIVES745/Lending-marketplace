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

    // Build confirmation link for better mobile experience
    // Production: Ensure FRONTEND_URL is set in Render to your frontend domain (e.g. Vercel)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const confirmationLink = `${frontendUrl}/verify?email=${encodeURIComponent(user.email)}&code=${verificationCode}`;

    let emailSent = true;
    try {
      await sendEmail({
        email: user.email,
        subject: 'Verify your Smart Money account',
        message: `Your verification code is: ${verificationCode}. It expires in 1 hour. You can also verify here: ${confirmationLink}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; background-color: #ffffff; color: #374151;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #f5f3ff; border-radius: 16px; line-height: 64px; font-size: 32px; margin-bottom: 12px;">💰</div>
              <h1 style="color: #8B5CF6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Smart Money</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Empowering Students for Financial Freedom</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Verify Your Account</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Hi ${firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Welcome to Smart Money! We're thrilled to have you join our community. To get started, please use the 6-digit verification code below:</p>
            <div style="background-color: #f5f3ff; border-radius: 16px; padding: 30px; text-align: center; margin: 32px 0; border: 2px dashed #8B5CF6;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #8B5CF6;">${verificationCode}</span>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmationLink}" style="display: inline-block; padding: 16px 32px; background-color: #8B5CF6; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);">Verify My Account</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; text-align: center;">This code will expire in 1 hour.<br />If you didn't sign up for an account, please ignore this email.</p>
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">© ${new Date().getFullYear()} Smart Money · Mikecreatives Inc</p>
              <p style="font-size: 12px; color: #9ca3af;">University of Zambia (UNZA), Lusaka</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      emailSent = false;
    }

    res.json({
      message: emailSent ? 'Registration initiated. Please verify your email.' : 'Registration initiated. We could not send the email automatically, but your verification code is ready to use.',
      email: user.email,
      needsVerification: true,
      verificationCode,
      emailSent
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
        isAdmin: user.isAdmin || false,
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
    if (!user.isEmailVerified) {
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
        isAdmin: user.isAdmin || false,
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

    // Build reset link
    // Production: Ensure FRONTEND_URL is set in Render to your frontend domain (e.g. Vercel)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&code=${resetCode}`;

    // Send reset email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Reset your Smart Money password',
        message: `Your password reset code is: ${resetCode}. It expires in 15 minutes. You can reset here: ${resetLink}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; background-color: #ffffff; color: #374151;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef2f2; border-radius: 16px; line-height: 64px; font-size: 32px; margin-bottom: 12px;">🔑</div>
              <h1 style="color: #8B5CF6; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Smart Money</h1>
              <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Empowering Students for Financial Freedom</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Reset Request</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">Hi ${user.firstName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #4b5563;">We received a request to reset your password. Use the code below to securely access your account:</p>
            <div style="background-color: #fef2f2; border-radius: 16px; padding: 30px; text-align: center; margin: 32px 0; border: 2px dashed #ef4444;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ef4444;">${resetCode}</span>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);">Reset My Password</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; text-align: center;">This code will expire in 15 minutes.<br />If you didn't request this, you can safely ignore this email.</p>
            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
              <p style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">© ${new Date().getFullYear()} Smart Money · Mikecreatives Inc</p>
              <p style="font-size: 12px; color: #9ca3af;">University of Zambia (UNZA), Lusaka</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
    }

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
