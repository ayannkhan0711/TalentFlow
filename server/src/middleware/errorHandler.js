/**
 * Central error handler. Handles Mongoose errors, Multer errors, and custom errors.
 */
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = undefined;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
    details = messages;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `Duplicate value for "${field}". This ${field} is already taken.`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size is 5 MB.';
    }
  }

  // Multer file filter error
  if (err.message === 'Only PDF, DOC, and DOCX files are allowed') {
    statusCode = 400;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({ message, ...(details && { details }) });
};

module.exports = errorHandler;
