# Email Templates

This directory contains reusable email templates for the application.

## Structure

- `base.html` - Base email template (can be used as a starting point for new templates)
- `verification-email.html` - Email verification template with OTP code

## Template Variables

Templates use `{{variableName}}` syntax for variable replacement.

### Base Variables (Available in all templates)
- `{{appName}}` - Application name
- `{{year}}` - Current year
- `{{supportEmail}}` - Support email address

### Verification Email Variables
- `{{otpCode}}` - 6-digit OTP code
- `{{expiryMinutes}}` - OTP expiry time in minutes

## Adding New Templates

1. Create a new `.html` file in this directory
2. Use the base template structure or create your own
3. Use `{{variableName}}` for dynamic content
4. Update `template.service.js` if needed for custom rendering
5. Use `renderEmailTemplate()` in `email.service.js` to send

## Example

```javascript
import { sendEmail } from "../services/email.service.js";

await sendEmail({
  to: "user@example.com",
  subject: "Welcome!",
  template: "welcome-email",
  variables: {
    userName: "John Doe",
    loginUrl: "https://app.example.com/login"
  }
});
```

