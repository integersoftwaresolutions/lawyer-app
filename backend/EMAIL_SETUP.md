# Email Configuration (Resend)

Emails are sent with the official [Resend](https://resend.com) SDK over HTTPS. SMTP is not used — Render blocks outbound SMTP (`ETIMEDOUT` / `CONN`).

## Setup

1. Create an account at [resend.com](https://resend.com)
2. Create an API key
3. Add it to `backend/.env` (local) and the Render **lawyer-api** env:

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=beth.t@example.com
EMAIL_FROM_NAME=Adal AI
```

`beth.t@example.com` is Resend’s test sender and works immediately. For production, verify your domain in Resend and set:

```env
EMAIL_FROM=noreply@yourdomain.com
```

Do not use a Gmail address as `EMAIL_FROM` — Resend will reject it.

4. Restart the API (or redeploy on Render). Logs should show:

```text
📧 Email transport: resend (HTTPS) from Adal AI <beth.t@example.com>
✅ Email sent via resend to user@example.com (Message ID: ...)
```

If `RESEND_API_KEY` is empty, emails are logged to the console and OTPs are still stored in MongoDB.

## Templates

Templates live in `src/templates/emails/` and are rendered by `email.service.js`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Emails logged, not sent | Set `RESEND_API_KEY` and restart |
| 403 / not allowed | Use `beth.t@example.com`, or verify your domain |
| OTP in DB but no inbox mail | Check spam; confirm Resend dashboard → Logs |
