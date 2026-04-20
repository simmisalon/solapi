async function sendReportEmail({ subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey || !to) {
    return { sent: false, reason: "RESEND_API_KEY 또는 REPORT_EMAIL_TO 미설정" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { sent: false, reason: `Resend ${res.status}: ${body}` };
  }

  return { sent: true };
}

function buildBatchReport({ project, body, total, successes, failures, startedAt, finishedAt }) {
  const lines = [
    `프로젝트: ${project || "solapi (독립앱)"}`,
    `시작: ${startedAt}`,
    `완료: ${finishedAt}`,
    `총 ${total}건 / 성공 ${successes.length} / 실패 ${failures.length}`,
    "",
    "--- 본문 ---",
    body,
    "",
  ];

  if (failures.length > 0) {
    lines.push("--- 실패 번호 ---");
    for (const f of failures) {
      lines.push(`${f.to}${f.reason ? ` — ${f.reason}` : ""}`);
    }
  }

  return lines.join("\n");
}

module.exports = {
  sendReportEmail,
  buildBatchReport,
};
