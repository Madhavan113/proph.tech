# Supabase Email Customization Guide

This guide explains how to customize email templates and configure your own email service for the Prophet betting platform.

## Overview

By default, Supabase sends authentication emails (magic links, password resets, etc.) using their built-in email service. However, you can customize these emails or use your own email provider.

## Method 1: Customize Supabase Email Templates (Recommended for Most Users)

### 1. Access Supabase Dashboard
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### 2. Available Email Templates
You can customize the following email templates:
- **Confirm signup** - Sent when a new user signs up
- **Invite user** - Sent when inviting a user
- **Magic Link** - Sent for passwordless login
- **Change Email Address** - Sent when user changes email
- **Reset Password** - Sent for password reset requests

### 3. Template Variables
You can use these variables in your templates:
- `{{ .SiteURL }}` - Your website URL
- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - Authentication token
- `{{ .TokenHash }}` - Hashed token
- `{{ .Email }}` - User's email address

### 4. Example Custom Templates

#### Reset Password Email
```html
<h2>Reset Your Prophet Password</h2>
<p>Hi there,</p>
<p>You requested to reset your password for your Prophet account. Click the link below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>The Prophet Team</p>
```

#### Magic Link Email
```html
<h2>Your Prophet Login Link</h2>
<p>Hi there,</p>
<p>Click the link below to log in to your Prophet account:</p>
<p><a href="{{ .ConfirmationURL }}">Log in to Prophet</a></p>
<p>This link will expire in 1 hour and can only be used once.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>The Prophet Team</p>
```

### 5. Email Settings
In the Supabase Dashboard under **Authentication** → **Email Settings**, you can configure:
- **Email sender name**: e.g., "Prophet"
- **Email sender address**: e.g., "noreply@prophet.com"
- **Email subject lines** for each template

## Method 2: Use Custom SMTP Provider

For more control over email delivery, you can configure your own SMTP provider.

### 1. Supported SMTP Providers
- SendGrid
- Mailgun
- Amazon SES
- Postmark
- Any SMTP-compatible service

### 2. Configure SMTP in Supabase
1. Go to **Settings** → **Email** in your Supabase Dashboard
2. Enable **Custom SMTP**
3. Enter your SMTP credentials:
   - **Host**: Your SMTP server (e.g., smtp.sendgrid.net)
   - **Port**: Usually 587 for TLS or 465 for SSL
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: The "from" email address
   - **Sender name**: The "from" name (e.g., "Prophet")

### 3. Example: SendGrid Configuration
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
Sender email: noreply@yourprophetdomain.com
Sender name: Prophet
```

## Method 3: Implement Custom Email Flow (Advanced)

For complete control, you can bypass Supabase's email system entirely.

### 1. Disable Supabase Emails
In your Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Disable email confirmations for the flows you want to customize

### 2. Implement Custom Email Logic

Create an API endpoint to handle custom email sending:

```typescript
// src/app/api/send-email/route.ts
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email' // Your email service

export async function POST(request: Request) {
  const { type, email, token } = await request.json()
  
  // Verify the request is legitimate
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.email !== email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Send custom email based on type
  switch (type) {
    case 'reset-password':
      await sendEmail({
        to: email,
        subject: 'Reset Your Prophet Password',
        html: generateResetPasswordEmail(token)
      })
      break
    case 'magic-link':
      await sendEmail({
        to: email,
        subject: 'Your Prophet Login Link',
        html: generateMagicLinkEmail(token)
      })
      break
  }
  
  return Response.json({ success: true })
}
```

### 3. Update Authentication Flow

Modify your authentication components to use the custom email endpoint:

```typescript
// In your forgot-password component
const handleResetPassword = async (email: string) => {
  // Generate reset token using Supabase Admin API
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  })
  
  if (!error && data) {
    // Send custom email
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reset-password',
        email: email,
        token: data.properties.hashed_token
      })
    })
  }
}
```

## Email Template Best Practices

1. **Branding**: Include your Prophet logo and consistent colors
2. **Clear CTAs**: Make action buttons prominent
3. **Security**: Include warnings about not sharing links
4. **Expiration**: Clearly state when links expire
5. **Support**: Include a support email or link
6. **Mobile-friendly**: Ensure emails look good on all devices

## Testing Email Templates

1. **Test Mode**: Use Supabase's test mode to avoid sending real emails during development
2. **Email Preview**: Most SMTP providers offer email preview tools
3. **Multiple Clients**: Test in Gmail, Outlook, Apple Mail, etc.
4. **Spam Testing**: Use tools like Mail-Tester to check spam score

## Troubleshooting

### Common Issues:
1. **Emails going to spam**: 
   - Configure SPF, DKIM, and DMARC records
   - Use a reputable SMTP provider
   - Avoid spam trigger words

2. **Emails not sending**:
   - Check SMTP credentials
   - Verify sender email is verified with your provider
   - Check Supabase logs for errors

3. **Links not working**:
   - Ensure redirect URLs are correctly configured
   - Check that your domain is added to Supabase's allowed redirects

## Environment Variables

Add these to your `.env.local` for custom email configuration:

```env
# Custom SMTP (if using Method 3)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key
SMTP_FROM_EMAIL=noreply@prophet.com
SMTP_FROM_NAME=Prophet

# Email service API keys (if using custom service)
SENDGRID_API_KEY=your-sendgrid-api-key
# or
MAILGUN_API_KEY=your-mailgun-api-key
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on custom email endpoints
2. **Token Validation**: Always validate tokens before sending emails
3. **HTTPS Only**: Ensure all email links use HTTPS
4. **Audit Logging**: Log all email send attempts for security monitoring

## Next Steps

1. Choose your email customization method based on your needs
2. Set up email templates in Supabase Dashboard
3. Configure SMTP if needed
4. Test thoroughly before going to production
5. Monitor email delivery rates and user feedback

For more information, refer to the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/auth-email).
