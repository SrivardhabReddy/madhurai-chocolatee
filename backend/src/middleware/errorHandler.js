export function errorHandler(err, req, res, next) {
  // Log full error securely in internal logs
  console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`, err);

  const status = err.status || err.statusCode || 500;
  
  // Custom operational errors thrown explicitly with message
  if (err.isOperational) {
    return res.status(status).json({
      success: false,
      message: err.message
    });
  }

  // Generic production response
  return res.status(status).json({
    success: false,
    message: status === 404 ? 'Resource not found.' : 'Something went wrong. Please try again.'
  });
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
