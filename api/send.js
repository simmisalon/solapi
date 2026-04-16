module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const { to, text } = req.body;

  if (!to || !text) {
    return res.status(400).json({ error: "수신번호(to)와 메시지(text)는 필수입니다." });
  }

  try {
    const solapi = require("solapi");
    const SolapiMessageService = solapi.SolapiMessageService;
    const client = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET
    );

    const result = await client.sendOne({
      to,
      from: process.env.SOLAPI_SENDER,
      text,
    });

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("발송 오류:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
