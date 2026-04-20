const { verifyAdminToken } = require("./_lib/auth.js");
const { isNightBlocked, applyAdFormatting, normalizePhone } = require("./_lib/format.js");
const { sendReportEmail, buildBatchReport } = require("./_lib/email.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: "인증 실패" });
  }

  const { numbers, text, promotional = false } = req.body || {};

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: "수신번호 목록이 없습니다." });
  }
  if (!text) {
    return res.status(400).json({ error: "메시지 내용이 없습니다." });
  }

  const normalized = [];
  const rejected = [];
  for (const raw of numbers) {
    const n = normalizePhone(raw);
    if (n) normalized.push(n);
    else rejected.push({ to: String(raw), reason: "형식 오류" });
  }
  const unique = [...new Set(normalized)];

  if (unique.length === 0) {
    return res.status(400).json({ error: "유효한 번호가 0건입니다." });
  }

  if (promotional && !process.env.SOLAPI_UNSUBSCRIBE_NUMBER) {
    return res.status(503).json({
      error: "080 수신거부 번호(SOLAPI_UNSUBSCRIBE_NUMBER) 미설정 — 광고성 발송 불가",
    });
  }
  if (isNightBlocked(promotional)) {
    return res.status(403).json({
      error: "광고성 문자는 21시~08시(KST) 발송 금지",
    });
  }

  const finalText = promotional
    ? applyAdFormatting(text, process.env.SOLAPI_UNSUBSCRIBE_NUMBER)
    : text;

  const startedAt = new Date().toISOString();

  try {
    const { SolapiMessageService } = require("solapi");
    const client = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET,
    );

    const messages = unique.map((to) => ({
      to,
      from: process.env.SOLAPI_SENDER,
      text: finalText,
    }));

    const result = await client.send(messages);
    const finishedAt = new Date().toISOString();

    const successes = unique.map((to) => ({ to }));

    const report = buildBatchReport({
      project: "solapi (독립앱)",
      body: finalText,
      total: unique.length + rejected.length,
      successes,
      failures: rejected,
      startedAt,
      finishedAt,
    });

    const emailResult = await sendReportEmail({
      subject: `[SMS 발송 리포트] ${unique.length}건 ${promotional ? "광고" : "안내"}`,
      text: report,
    });

    return res.status(200).json({
      success: true,
      total: unique.length,
      rejected: rejected.length,
      result,
      email: emailResult,
    });
  } catch (error) {
    console.error("발송 오류:", error);

    const finishedAt = new Date().toISOString();
    await sendReportEmail({
      subject: `[SMS 발송 실패] ${unique.length}건 요청 중 오류`,
      text: buildBatchReport({
        project: "solapi (독립앱)",
        body: finalText,
        total: unique.length + rejected.length,
        successes: [],
        failures: [
          ...rejected,
          ...unique.map((to) => ({ to, reason: error.message })),
        ],
        startedAt,
        finishedAt,
      }),
    }).catch(() => {});

    return res.status(500).json({ success: false, error: error.message });
  }
};
