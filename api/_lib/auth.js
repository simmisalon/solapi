function verifyAdminToken(req) {
  const token = req.headers["x-admin-token"];
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected) && token === expected;
}

function verifyInternalToken(req) {
  const token = req.headers["x-internal-token"];
  const expected = process.env.INTERNAL_TOKEN;
  return Boolean(expected) && token === expected;
}

module.exports = {
  verifyAdminToken,
  verifyInternalToken,
};
