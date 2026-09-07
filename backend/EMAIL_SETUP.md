# Email Configuration Guide

## Overview

The email system uses Nodemailer with a template-based approach for sending emails. Templates are stored in `src/templates/` and are rendered dynamically.

## Configuration

Add these variables to your `.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lawyerapp.com
EMAIL_FROM_NAME=Adal AI

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6
```

## Gmail Setup

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

## Development Mode

If email is not configured, the system will:
- Log emails to console (for testing)
- Still store OTPs in database
- Allow users to request resend

## Testing Email

1. **Check console logs** - In development, emails are logged to console
2. **Verify transporter** - Check server logs for "✅ Email transporter configured successfully"
3. **Test registration** - Register a new user and check for OTP email

## Template System

### Available Templates

- `verification-email.html` - Email verification with OTP code
- `base.html` - Base template (for creating new templates)

### Creating New Templates

1. Create a new `.html` file in `src/templates/`
2. Use `{{variableName}}` for dynamic content
3. Use `renderEmailTemplate()` in `email.service.js`

### Template Variables

**Base variables (available in all templates):**
- `{{appName}}` - Application name
- `{{year}}` - Current year
- `{{supportEmail}}` - Support email

**Verification email variables:**
- `{{otpCode}}` - 6-digit OTP code
- `{{expiryMinutes}}` - OTP expiry time

## Troubleshooting

### Email not sending

1. **Check configuration:**
   ```bash
   # Verify env variables are set
   echo $EMAIL_USER
   echo $EMAIL_PASSWORD
   ```

2. **Check server logs:**
   - Look for "✅ Email transporter configured successfully"
   - Check for error messages

3. **Test connection:**
   - The transporter verifies connection on startup
   - Check for connection errors in logs

4. **Gmail specific:**
   - Make sure you're using App Password, not regular password
   - Check if "Less secure app access" is enabled (if not using App Password)

### OTP stored but email not received

- Check spam folder
- Verify email address is correct
- Check server logs for email send status
- In development, check console for logged email content

## Production Checklist

- [ ] Configure all email environment variables
- [ ] Test email sending with real SMTP server
- [ ] Verify transporter connection on startup
- [ ] Test OTP email delivery
- [ ] Monitor email delivery rates
- [ ] Set up email service monitoring

