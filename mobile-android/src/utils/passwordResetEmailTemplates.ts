// Password Reset Email Templates
// Professional email templates for 6-digit reset codes

interface PasswordResetEmailData {
  firstName?: string;
  lastName?: string;
  email: string;
  resetCode: string;
  expiryMinutes: number;
  companyName?: string;
  supportEmail?: string;
  supportPhone?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Skyfire Solar brand colors
const BRAND_COLORS = {
  primaryOrange: '#FD7332',
  secondaryOrange: '#B92011',
  primaryBlue: '#2E4161',
  mediumBlue: '#213454',
  darkBlue: '#0C1F3F',
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  mediumGray: '#6C757D',
  darkGray: '#343A40',
  green: '#4CAF50',
  red: '#FF6B6B',
};

/**
 * Generate password reset email with 6-digit code
 */
export function generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
  const {
    firstName,
    email,
    resetCode,
    expiryMinutes = 10,
    supportEmail = 'Designs@SkyfireSD.com',
    supportPhone = '(480) 759-3473',
  } = data;

  const displayName = firstName ? `${firstName}` : 'there';
  const codeDigits = resetCode.split('');

  return {
    subject: 'Your Skyfire Password Reset Code',
    html: createHTMLTemplate(data, { displayName, codeDigits }),
    text: createTextTemplate(data, { displayName }),
  };
}

/**
 * Create HTML email template
 */
function createHTMLTemplate(
  data: PasswordResetEmailData,
  helpers: { displayName: string; codeDigits: string[] }
): string {
  const { displayName, codeDigits } = helpers;
  const { expiryMinutes, supportEmail, supportPhone } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
    <title>Your Skyfire Password Reset Code</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: ${BRAND_COLORS.darkGray};
            background-color: ${BRAND_COLORS.lightGray};
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${BRAND_COLORS.white};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .email-header {
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryBlue}, ${BRAND_COLORS.mediumBlue}, ${BRAND_COLORS.darkBlue});
            padding: 40px 30px;
            text-align: center;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
            color: ${BRAND_COLORS.white};
            margin-bottom: 8px;
            letter-spacing: 1px;
        }

        .tagline {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            font-weight: 500;
        }

        .email-body {
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 20px;
            font-weight: 600;
        }

        .message {
            font-size: 16px;
            color: ${BRAND_COLORS.darkGray};
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .code-container {
            background: linear-gradient(135deg, ${BRAND_COLORS.lightGray}, #ffffff);
            border: 3px solid ${BRAND_COLORS.primaryOrange};
            border-radius: 16px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            position: relative;
        }

        .code-label {
            font-size: 16px;
            color: ${BRAND_COLORS.primaryBlue};
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .reset-code {
            display: inline-flex;
            gap: 8px;
            margin-bottom: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .code-digit {
            display: inline-block;
            width: 50px;
            height: 60px;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryOrange}, ${BRAND_COLORS.secondaryOrange});
            color: ${BRAND_COLORS.white};
            font-size: 32px;
            font-weight: bold;
            line-height: 60px;
            text-align: center;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(253, 115, 50, 0.3);
            font-family: 'Courier New', Courier, monospace;
        }

        .code-copy-text {
            font-size: 14px;
            color: ${BRAND_COLORS.mediumGray};
            margin-top: 15px;
            font-style: italic;
        }

        .expiry-warning {
            background-color: #FFF3E0;
            border-left: 4px solid ${BRAND_COLORS.primaryOrange};
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }

        .expiry-text {
            color: #E65100;
            font-size: 14px;
            font-weight: 600;
            margin: 0;
        }

        .security-notice {
            background-color: #F3F8FF;
            border: 1px solid #E3F2FD;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }

        .security-title {
            color: ${BRAND_COLORS.primaryBlue};
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .security-list {
            color: ${BRAND_COLORS.darkGray};
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
            padding-left: 20px;
        }

        .security-list li {
            margin-bottom: 5px;
        }

        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryBlue}, ${BRAND_COLORS.mediumBlue});
            color: ${BRAND_COLORS.white};
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 12px rgba(46, 65, 97, 0.3);
            transition: all 0.3s ease;
        }

        .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(46, 65, 97, 0.4);
        }

        .help-section {
            margin-top: 30px;
            text-align: center;
        }

        .help-title {
            font-size: 16px;
            color: ${BRAND_COLORS.primaryBlue};
            font-weight: 600;
            margin-bottom: 15px;
        }

        .help-text {
            font-size: 14px;
            color: ${BRAND_COLORS.mediumGray};
            line-height: 1.6;
        }

        .contact-info {
            margin-top: 15px;
        }

        .contact-link {
            color: ${BRAND_COLORS.primaryOrange};
            text-decoration: none;
            font-weight: 600;
        }

        .email-footer {
            background-color: ${BRAND_COLORS.primaryBlue};
            color: ${BRAND_COLORS.white};
            padding: 30px;
            text-align: center;
        }

        .footer-content {
            margin-bottom: 20px;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .footer-text {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.5;
        }

        .footer-links {
            margin-top: 15px;
        }

        .footer-link {
            color: ${BRAND_COLORS.primaryOrange};
            text-decoration: none;
            margin: 0 10px;
            font-size: 14px;
        }

        .disclaimer {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 20px;
            line-height: 1.4;
        }

        /* Mobile responsiveness */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
                box-shadow: none !important;
            }

            .email-header,
            .email-body,
            .email-footer {
                padding: 20px !important;
            }

            .code-container {
                padding: 20px !important;
                margin: 20px 0 !important;
            }

            .code-digit {
                width: 40px !important;
                height: 50px !important;
                font-size: 24px !important;
                line-height: 50px !important;
                margin: 2px !important;
            }

            .reset-code {
                gap: 4px !important;
            }

            .message {
                font-size: 14px !important;
            }

            .action-button {
                display: block !important;
                width: 100% !important;
                padding: 15px 20px !important;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .email-container {
                background-color: #1a1a1a !important;
            }

            .email-body {
                background-color: #1a1a1a !important;
            }

            .message {
                color: #e0e0e0 !important;
            }

            .help-text {
                color: #b0b0b0 !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="logo">SKYFIRE SOLAR</div>
            <div class="tagline">Powering Your Future with Solar Innovation</div>
        </div>

        <!-- Body -->
        <div class="email-body">
            <div class="greeting">Hi ${displayName}!</div>

            <div class="message">
                We received a request to reset your password for your Skyfire Solar account.
                Use the code below to complete your password reset:
            </div>

            <!-- Reset Code Container -->
            <div class="code-container">
                <div class="code-label">Your Reset Code</div>
                <div class="reset-code">
                    ${codeDigits.map(digit => `<span class="code-digit">${digit}</span>`).join('')}
                </div>
                <div class="code-copy-text">
                    📱 This code can be copied and pasted into the app
                </div>
            </div>

            <!-- Expiry Warning -->
            <div class="expiry-warning">
                <p class="expiry-text">
                    ⏰ This code expires in ${expiryMinutes} minutes for your security
                </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center;">
                <a href="skyfire://reset?code=${data.resetCode}&email=${encodeURIComponent(data.email)}"
                   class="action-button">
                    📱 Open App Now
                </a>
            </div>

            <!-- Security Notice -->
            <div class="security-notice">
                <div class="security-title">
                    🔒 Security Notice
                </div>
                <ul class="security-list">
                    <li>Only use this code if you requested a password reset</li>
                    <li>This code can only be used once and expires in ${expiryMinutes} minutes</li>
                    <li>Never share this code with anyone</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                </ul>
            </div>

            <!-- Help Section -->
            <div class="help-section">
                <div class="help-title">Need Help?</div>
                <div class="help-text">
                    If you're having trouble with the password reset process, our support team is here to help.
                </div>
                <div class="contact-info">
                    Email: <a href="mailto:${supportEmail}" class="contact-link">${supportEmail}</a><br>
                    Phone: <a href="tel:${supportPhone.replace(/[^\d]/g, '')}" class="contact-link">${supportPhone}</a>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="email-footer">
            <div class="footer-content">
                <div class="company-name">SKYFIRE SOLAR</div>
                <div class="footer-text">
                    Professional solar design solutions for your business
                </div>
            </div>

            <div class="footer-links">
                <a href="https://skyfiresd.com" class="footer-link">Website</a>
                <a href="mailto:${supportEmail}" class="footer-link">Support</a>
                <a href="https://skyfiresd.com/privacy" class="footer-link">Privacy</a>
            </div>

            <div class="disclaimer">
                This email was sent to ${data.email} regarding a password reset request for your Skyfire Solar account.
                <br>If you didn't request this, please ignore this email or contact our support team.
                <br><br>© ${new Date().getFullYear()} Skyfire Solar. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Create text email template
 */
function createTextTemplate(
  data: PasswordResetEmailData,
  helpers: { displayName: string }
): string {
  const { displayName } = helpers;
  const { resetCode, expiryMinutes, supportEmail, supportPhone } = data;

  return `
SKYFIRE SOLAR - Password Reset Code

Hi ${displayName}!

We received a request to reset your password for your Skyfire Solar account.

YOUR RESET CODE
===============
${resetCode}
===============

IMPORTANT INFORMATION:
• This code expires in ${expiryMinutes} minutes for your security
• Use this code in the Skyfire Solar app to reset your password
• This code can only be used once
• Never share this code with anyone

SECURITY NOTICE:
• Only use this code if you requested a password reset
• If you didn't request this reset, please ignore this email
• Contact our support team if you have any concerns

NEED HELP?
If you're having trouble with the password reset process, our support team is here to help.

Email: ${supportEmail}
Phone: ${supportPhone}

SKYFIRE SOLAR
Powering Your Future with Solar Innovation
Website: https://skyfiresd.com

---
This email was sent to ${data.email} regarding a password reset request.
If you didn't request this, please ignore this email or contact support.

© ${new Date().getFullYear()} Skyfire Solar. All rights reserved.
`;
}

/**
 * Generate SMS message for reset code (optional)
 */
export function generatePasswordResetSMS(data: {
  resetCode: string;
  expiryMinutes: number;
}): string {
  return `Skyfire Solar password reset code: ${data.resetCode}. Expires in ${data.expiryMinutes} minutes. Don't share this code. Reply STOP to opt out.`;
}

/**
 * Generate email template for expired code notification
 */
export function generateExpiredCodeEmail(data: {
  firstName?: string;
  email: string;
}): EmailTemplate {
  const displayName = data.firstName ? data.firstName : 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Code Expired - Skyfire Solar</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2E4161, #0C1F3F); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">SKYFIRE SOLAR</h1>
        </div>

        <div style="padding: 30px; background: white;">
            <h2 style="color: #2E4161;">Reset Code Expired</h2>
            <p>Hi ${displayName}!</p>
            <p>Your password reset code has expired for security reasons.</p>
            <p>If you still need to reset your password, please request a new code in the Skyfire Solar app.</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="skyfire://reset" style="background: linear-gradient(135deg, #FD7332, #B92011); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Request New Code</a>
            </div>

            <p style="font-size: 14px; color: #666;">
                If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>

        <div style="background: #2E4161; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Skyfire Solar. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

  const text = `
SKYFIRE SOLAR - Reset Code Expired

Hi ${displayName}!

Your password reset code has expired for security reasons.

If you still need to reset your password, please request a new code in the Skyfire Solar app.

If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} Skyfire Solar. All rights reserved.
`;

  return {
    subject: 'Password Reset Code Expired - Skyfire Solar',
    html,
    text,
  };
}

/**
 * Generate successful password reset confirmation email
 */
export function generatePasswordResetSuccessEmail(data: {
  firstName?: string;
  email: string;
  resetTime: Date;
  ipAddress?: string;
  device?: string;
}): EmailTemplate {
  const displayName = data.firstName ? data.firstName : 'there';
  const resetTimeString = data.resetTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful - Skyfire Solar</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2E4161, #0C1F3F); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">SKYFIRE SOLAR</h1>
        </div>

        <div style="padding: 30px; background: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="background: #4CAF50; color: white; width: 60px; height: 60px; border-radius: 30px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 20px;">✓</div>
                <h2 style="color: #4CAF50; margin: 0;">Password Reset Successful!</h2>
            </div>

            <p>Hi ${displayName}!</p>
            <p>Your password has been successfully reset for your Skyfire Solar account.</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2E4161; margin-top: 0;">Reset Details:</h3>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${resetTimeString}</p>
                ${data.ipAddress ? `<p style="margin: 5px 0;"><strong>IP Address:</strong> ${data.ipAddress}</p>` : ''}
                ${data.device ? `<p style="margin: 5px 0;"><strong>Device:</strong> ${data.device}</p>` : ''}
            </div>

            <div style="background: #FFF3E0; border-left: 4px solid #FD7332; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #E65100;"><strong>Security Note:</strong> All previous sessions have been logged out for your security.</p>
            </div>

            <p>If you didn't make this change, please contact our support team immediately.</p>

            <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-size: 14px;">Need help?</p>
                <p style="margin: 5px 0;"><a href="mailto:Designs@SkyfireSD.com" style="color: #FD7332;">Designs@SkyfireSD.com</a></p>
                <p style="margin: 5px 0;"><a href="tel:+14807593473" style="color: #FD7332;">(480) 759-3473</a></p>
            </div>
        </div>

        <div style="background: #2E4161; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Skyfire Solar. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

  const text = `
SKYFIRE SOLAR - Password Reset Successful

Hi ${displayName}!

Your password has been successfully reset for your Skyfire Solar account.

Reset Details:
Time: ${resetTimeString}
${data.ipAddress ? `IP Address: ${data.ipAddress}` : ''}
${data.device ? `Device: ${data.device}` : ''}

SECURITY NOTE: All previous sessions have been logged out for your security.

If you didn't make this change, please contact our support team immediately.

Need help?
Email: Designs@SkyfireSD.com
Phone: (480) 759-3473

© ${new Date().getFullYear()} Skyfire Solar. All rights reserved.
`;

  return {
    subject: 'Password Reset Successful - Skyfire Solar',
    html,
    text,
  };
}

// Export all template functions
export const passwordResetEmailTemplates = {
  generatePasswordResetEmail,
  generatePasswordResetSMS,
  generateExpiredCodeEmail,
  generatePasswordResetSuccessEmail,
};