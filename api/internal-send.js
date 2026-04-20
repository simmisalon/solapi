const { verifyInternalToken } = require("./_lib/auth.js");
const { isNightBlocked, applyAdFormatting, normalizePhone } = require("./_lib/format.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  if (!verifyInternalToken(req)) {
    return res.status(401).json({ error: "인증 실패" });
  }

  const { project, to, text, promotional = false } = req.body || {};

  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    return res.status(400).json({ error: "유효한 수신번호가 아닙니다." });
  }
  if (!text) {
    return res.status(400).json({ error: "메시지 내용이 필요합니다." });
  }

  if (promotional && !process.env.SOLAPI_UNSUBSCRIBE_NUMBER) {
    return res.status(503).json({
      error: "광고성 발송 불가 — 080 수신거부 번호 미설정",
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

  try {
    const { SolapiMessageService } = require("solapi");
    const client = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET,
    );

    const result = await client.sendOne({
      to: normalizedTo,
      from: process.env.SOLAPI_SENDER,
      text: finalText,
    });

    console.log(`[internal-send] ${project || "unknown"} → ${normalizedTo} (${promotional ? "ad" : "info"})`);

    return res.status(200).json({ success: true, project, result });
  } catch (error) {
    console.error("[internal-send] 발송 오류:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
