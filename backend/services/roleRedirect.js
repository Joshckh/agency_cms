function redirectByRole(role) {
  if (role === "superadmin") return "/dashboard/superadmin";
  if (role === "admin") return "/dashboard/admin";
  return "/dashboard/agent";
}

module.exports = redirectByRole;
