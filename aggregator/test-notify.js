const fs = require("fs");
const path = require("path");
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8"));

async function testEmail() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("RESEND_API_KEY not set — skipping email test.");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.notifications.email.fromAddress,
      to: config.notifications.email.toAddress,
      subject: "Test — your job alert system is working",
      html: "<p>This is a test message. If you got this, your email setup is correct.</p>",
    }),
  });
  console.log("Email test status:", res.status, res.ok ? "OK" : await res.text());
}

async function testWhatsApp() {
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!apiKey) {
    console.log("CALLMEBOT_APIKEY not set — skipping WhatsApp test.");
    return;
  }
  const phone = config.notifications.whatsapp.phone;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(
    "Test message — your job alert system is working."
  )}&apikey=${apiKey}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("WhatsApp test status:", res.status, text);
}

(async () => {
  await testEmail();
  await testWhatsApp();
})();