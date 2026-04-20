const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyAdminToken, verifyInternalToken } = require("../api/_lib/auth.js");

test("verifyAdminToken: 토큰 일치 시 true", () => {
  process.env.ADMIN_TOKEN = "secret-admin";
  const req = { headers: { "x-admin-token": "secret-admin" } };
  assert.equal(verifyAdminToken(req), true);
});

test("verifyAdminToken: 토큰 불일치 false", () => {
  process.env.ADMIN_TOKEN = "secret-admin";
  const req = { headers: { "x-admin-token": "wrong" } };
  assert.equal(verifyAdminToken(req), false);
});

test("verifyAdminToken: 토큰 누락 false", () => {
  process.env.ADMIN_TOKEN = "secret-admin";
  const req = { headers: {} };
  assert.equal(verifyAdminToken(req), false);
});

test("verifyAdminToken: env 미설정이면 모두 false (안전)", () => {
  delete process.env.ADMIN_TOKEN;
  const req = { headers: { "x-admin-token": "" } };
  assert.equal(verifyAdminToken(req), false);
});

test("verifyInternalToken: 토큰 일치 시 true", () => {
  process.env.INTERNAL_TOKEN = "secret-internal";
  const req = { headers: { "x-internal-token": "secret-internal" } };
  assert.equal(verifyInternalToken(req), true);
});

test("verifyInternalToken: 불일치 false", () => {
  process.env.INTERNAL_TOKEN = "secret-internal";
  const req = { headers: { "x-internal-token": "wrong" } };
  assert.equal(verifyInternalToken(req), false);
});
