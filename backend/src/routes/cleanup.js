const cron = require('node-cron');
const User = require('../models/User');

/**
 * Background job to clean up expired sensitive fields
 * Runs every hour (0 * * * *)
 */
const initCleanupTask = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('--- Running Hourly Security Cleanup ---');
    try {
      const now = new Date();

      // Clear expired email verification codes
      await User.updateMany(
        { emailVerificationExpires: { $lt: now }, isEmailVerified: false },
        { $unset: { emailVerificationCode: 1, emailVerificationExpires: 1 } }
      );

      // Clear expired password reset tokens
      await User.updateMany(
        { passwordResetExpires: { $lt: now } },
        { $unset: { passwordResetCode: 1, passwordResetToken: 1, passwordResetExpires: 1 } }
      );
    } catch (err) {
      console.error('Cleanup task failed:', err);
    }
  });
};

module.exports = initCleanupTask;