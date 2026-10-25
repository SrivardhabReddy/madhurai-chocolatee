export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to perform this administrative action.'
      });
    }

    next();
  };
}

export function requirePermission(moduleName, action = 'read') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // SUPER_ADMIN has master privileges
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const perms = req.user.permissions?.[moduleName];
    if (!perms) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: No permissions assigned for module ${moduleName}.`
      });
    }

    let hasRight = false;
    if (action === 'read') hasRight = perms.read || perms.manage;
    else if (action === 'write') hasRight = perms.write || perms.manage;
    else if (action === 'delete') hasRight = perms.delete || perms.manage;
    else if (action === 'manage') hasRight = perms.manage;

    if (!hasRight) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Insufficient privileges for action '${action}' on ${moduleName}.`
      });
    }

    next();
  };
}
