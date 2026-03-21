/**
 * After `authenticateToken`:
 * - Admin tokens attach `req.admin` (JWT payload user_type === "admin")
 * - User tokens attach `req.user` with `user_type` like "individual" | "group"
 *
 * @param {string[]} allowedRoles
 */
export const checkAllowedRole = (allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes("admin") && req.admin) {
      return next();
    }
    if (req.user && allowedRoles.includes(req.user.user_type)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  };
};

// Backward-compatible alias
export const checkRoleAllowed = checkAllowedRole;
