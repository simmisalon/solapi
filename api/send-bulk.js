module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const { numbers, text } = req.body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
    return res.status(400).json({ error: "수신번호 목록이 없습니다." });
  }

  if (!text) {
    return res.status(400).json({ error: "메시지 내용이 없습니다." });
  }

  try {
    const solapi = require("solapi");
    const SolapiMessageService = solapi.SolapiMessageService;
    const client = new SolapiMessageService(
      process.env.SOLAPI_API_KEY,
      process.env.SOLAPI_API_SECRET
    );

    const messages = numbers.map((to) => ({
      to,
      from: process.env.SOLAPI_SENDER,
      text,
    }));

    const result = await client.send(messages);

    return res.status(200).json({
      success: true,
      total: numbers.length,
      result,
    });
  } catch (error) {
    console.error("발송 오류:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
