export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User is not authenticated.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`
      });
    }

    next();
  };
}

export default authorizeRoles;
