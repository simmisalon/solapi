const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isNightBlocked,
  applyAdFormatting,
  normalizePhone,
  extractPhones,
} = require("../api/_lib/format.js");

function kstDate(hour) {
  const utcHour = (hour - 9 + 24) % 24;
  return new Date(Date.UTC(2026, 3, 20, utcHour, 0, 0));
}

test("isNightBlocked: 안내성은 언제나 통과", () => {
  assert.equal(isNightBlocked(false, kstDate(22)), false);
  assert.equal(isNightBlocked(false, kstDate(3)), false);
});

test("isNightBlocked: 광고성은 21시~07시59분 차단", () => {
  assert.equal(isNightBlocked(true, kstDate(21)), true);
  assert.equal(isNightBlocked(true, kstDate(23)), true);
  assert.equal(isNightBlocked(true, kstDate(0)), true);
  assert.equal(isNightBlocked(true, kstDate(7)), true);
});

test("isNightBlocked: 광고성은 08시~20시59분 허용", () => {
  assert.equal(isNightBlocked(true, kstDate(8)), false);
  assert.equal(isNightBlocked(true, kstDate(12)), false);
  assert.equal(isNightBlocked(true, kstDate(20)), false);
});

test("applyAdFormatting: 프리픽스·수신거부 자동 삽입", () => {
  const result = applyAdFormatting("할인 쿠폰 드려요", "080-123-4567");
  assert.ok(result.startsWith("(광고) "));
  assert.ok(result.includes("080-123-4567"));
});

test("applyAdFormatting: 이미 (광고) 있으면 중복 안 붙임", () => {
  const result = applyAdFormatting("(광고) 이미 있음", "080-123-4567");
  const matches = result.match(/\(광고\)/g) || [];
  assert.equal(matches.length, 1);
});

test("applyAdFormatting: 본문에 수신거부 번호 이미 있으면 안 붙임", () => {
  const result = applyAdFormatting("본문 080-123-4567 포함", "080-123-4567");
  const matches = result.match(/080-123-4567/g) || [];
  assert.equal(matches.length, 1);
});

test("applyAdFormatting: 수신거부 번호 없으면 프리픽스만", () => {
  const result = applyAdFormatting("본문", "");
  assert.equal(result, "(광고) 본문");
});

test("normalizePhone: 하이픈·공백 제거", () => {
  assert.equal(normalizePhone("010-1234-5678"), "01012345678");
  assert.equal(normalizePhone(" 010 1234 5678 "), "01012345678");
});

test("normalizePhone: 비정상 값 null", () => {
  assert.equal(normalizePhone("abc"), null);
  assert.equal(normalizePhone("1234"), null);
  assert.equal(normalizePhone(null), null);
  assert.equal(normalizePhone(undefined), null);
  assert.equal(normalizePhone(""), null);
});

test("normalizePhone: 01x 9~11자리 허용", () => {
  assert.equal(normalizePhone("01012345678"), "01012345678");
  assert.equal(normalizePhone("0212345678"), "0212345678");
});

test("extractPhones: 중복 제거 + 정규화", () => {
  const rows = [
    ["김철수", "010-1234-5678"],
    ["영희", "010 1234 5678"],
    ["zzz", "invalid"],
    ["박", "01098765432"],
  ];
  const result = extractPhones(rows);
  assert.deepEqual(result.sort(), ["01012345678", "01098765432"].sort());
});
