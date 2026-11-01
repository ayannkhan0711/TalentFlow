const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send email notification when an application stage changes.
 * Fails silently (logs the error) so stage updates are not rolled back.
 */
const sendStageChangeEmail = async (candidate, job, newStage) => {
  try {
    if (!config.SMTP_USER || !config.SMTP_PASS) return; // skip if SMTP not configured

    const subject = `Your application for "${job.title}" has been updated`;
    const text = `Hi ${candidate.name},\n\nYour application for "${job.title}" has moved to the "${newStage}" stage.\n\nThank you for using TalentFlow!\n`;
    const html = `
      <h2>Application Update</h2>
      <p>Hi <strong>${candidate.name}</strong>,</p>
      <p>Your application for <strong>"${job.title}"</strong> has moved to the <strong>${newStage}</strong> stage.</p>
      <p>Thank you for using TalentFlow!</p>
    `;

    await getTransporter().sendMail({
      from: config.EMAIL_FROM,
      to: candidate.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    // Email failure should not roll back stage change
    console.error('Failed to send stage change email:', err.message);
  }
};

/**
 * Send confirmation email when a candidate applies for a job.
 */
const sendApplicationConfirmation = async (candidate, job) => {
  try {
    if (!config.SMTP_USER || !config.SMTP_PASS) return;

    const subject = `Application received for "${job.title}"`;
    const text = `Hi ${candidate.name},\n\nWe've received your application for "${job.title}". We'll keep you updated on your progress.\n\nThank you for using TalentFlow!\n`;
    const html = `
      <h2>Application Received</h2>
      <p>Hi <strong>${candidate.name}</strong>,</p>
      <p>We've received your application for <strong>"${job.title}"</strong>. We'll keep you updated on your progress.</p>
      <p>Thank you for using TalentFlow!</p>
    `;

    await getTransporter().sendMail({
      from: config.EMAIL_FROM,
      to: candidate.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error('Failed to send application confirmation email:', err.message);
  }
};

module.exports = { sendStageChangeEmail, sendApplicationConfirmation };
