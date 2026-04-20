function isNightBlocked(promotional, now) {
  if (!promotional) return false;
  const reference = now instanceof Date ? now : new Date();
  const kstHour = (reference.getUTCHours() + 9) % 24;
  return kstHour >= 21 || kstHour < 8;
}

function applyAdFormatting(text, unsubscribeNumber) {
  if (!text) return text;
  const normalizedUnsub = unsubscribeNumber ? unsubscribeNumber.replace(/[-\s]/g, "") : "";

  const withPrefix = text.trimStart().startsWith("(광고)") ? text : `(광고) ${text}`;

  if (!normalizedUnsub) return withPrefix;

  const alreadyHasUnsub = withPrefix.replace(/[-\s]/g, "").includes(normalizedUnsub);
  if (alreadyHasUnsub) return withPrefix;

  return `${withPrefix}\n무료수신거부 ${unsubscribeNumber}`;
}

function normalizePhone(raw) {
  if (raw == null) return null;
  const s = String(raw).replace(/[-\s]/g, "").trim();
  return /^0[0-9]{9,10}$/.test(s) ? s : null;
}

function extractPhones(rows) {
  const results = [];
  for (const row of rows) {
    for (const cell of row) {
      const normalized = normalizePhone(cell);
      if (normalized) results.push(normalized);
    }
  }
  return [...new Set(results)];
}

module.exports = {
  isNightBlocked,
  applyAdFormatting,
  normalizePhone,
  extractPhones,
};
