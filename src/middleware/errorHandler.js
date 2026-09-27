export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
