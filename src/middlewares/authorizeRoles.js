const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const { role } = req.user || {};
    console.log("authorizeRoles check — required:", allowedRoles, "| got:", role, "| full req.user:", req.user);

    if (!role) {
      return res.status(401).json({ error: 'Unauthorized: No role found' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = authorizeRoles;