// Email Templates for Skyfire Solar
// Professional email template system for demo booking confirmations

interface UserData {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
}

interface DemoData {
  date: string;
  displayTime: string;
  arizonaDateTime?: string;
}

interface EmailTemplateData {
  user: UserData;
  demo: DemoData;
  confirmationNumber: string;
  userTimezone?: string;
  userTimezoneAbbr?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  calendarEvent: CalendarEvent;
}

interface CalendarEvent {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
}

// Skyfire Solar brand colors (from gradient.tsx)
const BRAND_COLORS = {
  primaryOrange: '#FD7332',
  secondaryOrange: '#B92011',
  primaryBlue: '#2E4161',
  mediumBlue: '#213454',
  darkBlue: '#0C1F3F',
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  mediumGray: '#6C757D',
  darkGray: '#343A40'
};

/**
 * Generates calendar event ICS format string
 */
function generateCalendarEvent(data: EmailTemplateData): CalendarEvent {
  const startDate = new Date(data.demo.date);
  const endDate = new Date(startDate.getTime() + (45 * 60 * 1000)); // 45 minutes later

  return {
    title: 'Skyfire Solar Demo',
    description: `Solar design demonstration for ${data.user.companyName}. Confirmation #${data.confirmationNumber}`,
    startDateTime: startDate.toISOString(),
    endDateTime: endDate.toISOString(),
    location: 'Video Call (Link to be provided)'
  };
}

/**
 * Creates the HTML email template with Skyfire branding
 */
function createHTMLTemplate(data: EmailTemplateData): string {
  const formattedDate = new Date(data.demo.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo Confirmation - Skyfire Solar</title>
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
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${BRAND_COLORS.white};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryBlue}, ${BRAND_COLORS.mediumBlue}, ${BRAND_COLORS.darkBlue});
            padding: 40px 30px;
            text-align: center;
            color: ${BRAND_COLORS.white};
        }

        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .tagline {
            font-size: 14px;
            opacity: 0.9;
        }

        .success-section {
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #E9ECEF;
        }

        .success-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryOrange}, ${BRAND_COLORS.secondaryOrange});
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: ${BRAND_COLORS.white};
            font-size: 24px;
            font-weight: bold;
        }

        .success-title {
            font-size: 28px;
            font-weight: bold;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 8px;
        }

        .success-subtitle {
            font-size: 16px;
            color: ${BRAND_COLORS.mediumGray};
        }

        .confirmation-card {
            margin: 30px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .confirmation-header {
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryOrange}, ${BRAND_COLORS.secondaryOrange});
            padding: 20px;
            text-align: center;
        }

        .confirmation-number {
            color: ${BRAND_COLORS.white};
            font-size: 18px;
            font-weight: bold;
        }

        .confirmation-body {
            padding: 30px;
            background-color: ${BRAND_COLORS.white};
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #F1F3F4;
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .info-label {
            font-weight: 600;
            color: ${BRAND_COLORS.primaryBlue};
        }

        .info-value {
            color: ${BRAND_COLORS.darkGray};
        }

        .demo-section {
            background: linear-gradient(135deg, ${BRAND_COLORS.lightGray}, #FFFFFF);
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .demo-title {
            font-size: 18px;
            font-weight: bold;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 15px;
        }

        .demo-details {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
        }

        .demo-detail {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .demo-icon {
            font-size: 20px;
        }

        .demo-text {
            font-weight: 600;
            color: ${BRAND_COLORS.darkGray};
        }

        .next-steps {
            padding: 30px;
            background: linear-gradient(135deg, ${BRAND_COLORS.lightGray}, #FFFFFF);
        }

        .next-steps-title {
            font-size: 20px;
            font-weight: bold;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 20px;
        }

        .step {
            display: flex;
            align-items: flex-start;
            gap: 15px;
            margin-bottom: 15px;
        }

        .step-number {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryOrange}, ${BRAND_COLORS.secondaryOrange});
            color: ${BRAND_COLORS.white};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }

        .step-text {
            color: ${BRAND_COLORS.darkGray};
            line-height: 1.5;
        }

        .reminders {
            padding: 30px;
            background-color: #FFF7ED;
            border-left: 4px solid ${BRAND_COLORS.primaryOrange};
        }

        .reminders-title {
            font-size: 16px;
            font-weight: bold;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 10px;
        }

        .reminders-text {
            color: ${BRAND_COLORS.darkGray};
            line-height: 1.6;
        }

        .calendar-section {
            padding: 30px;
            text-align: center;
            background-color: ${BRAND_COLORS.lightGray};
        }

        .calendar-button {
            display: inline-block;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryBlue}, ${BRAND_COLORS.mediumBlue});
            color: ${BRAND_COLORS.white};
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin: 0 10px 10px;
        }

        .footer {
            background-color: ${BRAND_COLORS.primaryBlue};
            color: ${BRAND_COLORS.white};
            padding: 30px;
            text-align: center;
        }

        .footer-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .contact-info {
            margin-bottom: 15px;
        }

        .contact-link {
            color: ${BRAND_COLORS.primaryOrange};
            text-decoration: none;
        }

        .footer-disclaimer {
            font-size: 12px;
            opacity: 0.8;
            line-height: 1.4;
            margin-top: 15px;
        }

        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }

            .header, .success-section, .confirmation-body, .next-steps, .reminders, .calendar-section, .footer {
                padding: 20px;
            }

            .confirmation-card {
                margin: 20px;
            }

            .demo-details {
                flex-direction: column;
                gap: 15px;
            }

            .calendar-button {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">SKYFIRE SOLAR</div>
            <div class="tagline">Powering Your Future with Solar Innovation</div>
        </div>

        <!-- Success Section -->
        <div class="success-section">
            <div class="success-icon">✓</div>
            <div class="success-title">Demo Confirmed!</div>
            <div class="success-subtitle">Your solar design demonstration has been scheduled successfully</div>
        </div>

        <!-- Confirmation Details -->
        <div class="confirmation-card">
            <div class="confirmation-header">
                <div class="confirmation-number">Confirmation #${data.confirmationNumber}</div>
            </div>

            <div class="confirmation-body">
                <!-- Personal Information -->
                <div class="info-row">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${data.user.firstName} ${data.user.lastName}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">Company:</span>
                    <span class="info-value">${data.user.companyName}</span>
                </div>

                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${data.user.email}</span>
                </div>

                <!-- Demo Information -->
                <div class="demo-section">
                    <div class="demo-title">📅 Demo Appointment Details</div>
                    <div class="demo-details">
                        <div class="demo-detail">
                            <span class="demo-icon">🗓️</span>
                            <span class="demo-text">${formattedDate}</span>
                        </div>
                        <div class="demo-detail">
                            <span class="demo-icon">⏰</span>
                            <span class="demo-text">${data.demo.displayTime} ${data.userTimezoneAbbr || ''}</span>
                        </div>
                        <div class="demo-detail">
                            <span class="demo-icon">⏱️</span>
                            <span class="demo-text">30-45 minutes</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
            <div class="next-steps-title">What's Next?</div>

            <div class="step">
                <div class="step-number">1</div>
                <div class="step-text">
                    <strong>Save this confirmation</strong><br>
                    Make note of your demo time and reach out to us with any questions
                </div>
            </div>

            <div class="step">
                <div class="step-number">2</div>
                <div class="step-text">
                    <strong>Add to your calendar</strong><br>
                    Mark your calendar for the scheduled demo time using the button below
                </div>
            </div>

            <div class="step">
                <div class="step-number">3</div>
                <div class="step-text">
                    <strong>Prepare your questions</strong><br>
                    Think about any questions regarding solar solutions for your business
                </div>
            </div>
        </div>

        <!-- Important Reminders -->
        <div class="reminders">
            <div class="reminders-title">📱 Important Reminders</div>
            <div class="reminders-text">
                • Your demo will be conducted via video call<br>
                • Please ensure you have a stable internet connection<br>
                • The session will last approximately 30-45 minutes<br>
                • We'll send you the video call link 24 hours before your demo
            </div>
        </div>

        <!-- Calendar Section -->
        <div class="calendar-section">
            <a href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${data.confirmationNumber}@skyfiresd.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${new Date(data.demo.date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${new Date(new Date(data.demo.date).getTime() + 45*60*1000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Skyfire Solar Demo
DESCRIPTION:Solar design demonstration for ${data.user.companyName}. Confirmation #${data.confirmationNumber}
LOCATION:Video Call (Link to be provided)
END:VEVENT
END:VCALENDAR" class="calendar-button" download="skyfire-solar-demo.ics">
                📅 Add to Calendar
            </a>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-title">Need Help?</div>
            <div class="contact-info">
                Need to reschedule or have questions?<br>
                Email: <a href="mailto:Designs@SkyfireSD.com" class="contact-link">Designs@SkyfireSD.com</a><br>
                Phone: <a href="tel:+14807593473" class="contact-link">(480) 759-3473</a>
            </div>

            <div class="footer-disclaimer">
                <strong>Skyfire Solar</strong><br>
                Visit us at <a href="https://skyfiresd.com" class="contact-link">skyfiresd.com</a><br>
                This email was sent regarding your demo booking confirmation #${data.confirmationNumber}
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Creates the text version of the email template
 */
function createTextTemplate(data: EmailTemplateData): string {
  const formattedDate = new Date(data.demo.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
SKYFIRE SOLAR - Demo Confirmation

✓ DEMO CONFIRMED!

Your solar design demonstration has been scheduled successfully.

CONFIRMATION DETAILS
====================
Confirmation Number: ${data.confirmationNumber}

Personal Information:
- Name: ${data.user.firstName} ${data.user.lastName}
- Company: ${data.user.companyName}
- Email: ${data.user.email}

Demo Appointment:
- Date: ${formattedDate}
- Time: ${data.demo.displayTime} ${data.userTimezoneAbbr || ''}
- Duration: 30-45 minutes
- Format: Video Call

WHAT'S NEXT?
============
1. SAVE THIS CONFIRMATION
   Make note of your demo time and reach out to us with any questions

2. ADD TO YOUR CALENDAR
   Mark your calendar for the scheduled demo time

3. PREPARE YOUR QUESTIONS
   Think about any questions regarding solar solutions for your business

IMPORTANT REMINDERS
==================
• Your demo will be conducted via video call
• Please ensure you have a stable internet connection
• The session will last approximately 30-45 minutes
• We'll send you the video call link 24 hours before your demo

NEED HELP?
==========
Need to reschedule or have questions?

Email: Designs@SkyfireSD.com
Phone: (480) 759-3473
Website: skyfiresd.com

---
SKYFIRE SOLAR
Powering Your Future with Solar Innovation

This email was sent regarding your demo booking confirmation #${data.confirmationNumber}
`;
}

/**
 * Main function to generate complete email template
 */
export function generateDemoConfirmationEmail(data: EmailTemplateData): EmailTemplate {
  const calendarEvent = generateCalendarEvent(data);

  return {
    subject: `Demo Confirmed! Your Skyfire Solar appointment is scheduled - Confirmation #${data.confirmationNumber}`,
    html: createHTMLTemplate(data),
    text: createTextTemplate(data),
    calendarEvent
  };
}

/**
 * AWS SES compatible email parameters
 */
export interface SESEmailParams {
  Destination: {
    ToAddresses: string[];
    CcAddresses?: string[];
    BccAddresses?: string[];
  };
  Message: {
    Subject: {
      Data: string;
      Charset: 'UTF-8';
    };
    Body: {
      Html: {
        Data: string;
        Charset: 'UTF-8';
      };
      Text: {
        Data: string;
        Charset: 'UTF-8';
      };
    };
  };
  Source: string;
  ReplyToAddresses?: string[];
}

/**
 * Converts email template to AWS SES parameters
 */
export function createSESParams(
  template: EmailTemplate,
  recipientEmail: string,
  sourceEmail: string = 'Designs@SkyfireSD.com'
): SESEmailParams {
  return {
    Destination: {
      ToAddresses: [recipientEmail],
    },
    Message: {
      Subject: {
        Data: template.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: template.html,
          Charset: 'UTF-8',
        },
        Text: {
          Data: template.text,
          Charset: 'UTF-8',
        },
      },
    },
    Source: sourceEmail,
    ReplyToAddresses: ['Designs@SkyfireSD.com'],
  };
}

/**
 * Helper function to generate calendar ICS file content
 */
export function generateICSFile(calendarEvent: CalendarEvent, confirmationNumber: string): string {
  const formatDate = (date: string) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Skyfire Solar//Demo Booking//EN
BEGIN:VEVENT
UID:${confirmationNumber}@skyfiresd.com
DTSTAMP:${formatDate(new Date().toISOString())}
DTSTART:${formatDate(calendarEvent.startDateTime)}
DTEND:${formatDate(calendarEvent.endDateTime)}
SUMMARY:${calendarEvent.title}
DESCRIPTION:${calendarEvent.description}
LOCATION:${calendarEvent.location}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Skyfire Solar Demo Reminder
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Skyfire Solar Demo Starting Soon
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

// Support Ticket Email Template Types
interface SupportTicketUserData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  userId: string;
}

interface SupportTicketData {
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  currentScreen?: string;
  appVersion?: string;
  deviceInfo?: any;
  submittedAt: string;
}

interface SupportTicketTemplateData {
  user: SupportTicketUserData;
  ticket: SupportTicketData;
  adminEmail: string;
}

/**
 * Creates the HTML email template for support ticket notifications
 */
function createSupportTicketHTMLTemplate(data: SupportTicketTemplateData): string {
  const submittedDate = new Date(data.ticket.submittedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const priorityColor = {
    'low': '#28A745',
    'medium': '#FFC107',
    'high': '#FD7332',
    'urgent': '#DC3545'
  }[data.ticket.priority.toLowerCase()] || '#FFC107';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Support Ticket - Skyfire Solar</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: ${BRAND_COLORS.darkGray};
            background-color: ${BRAND_COLORS.lightGray};
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: ${BRAND_COLORS.white};
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryBlue}, ${BRAND_COLORS.mediumBlue}, ${BRAND_COLORS.darkBlue});
            padding: 40px 30px;
            text-align: center;
            color: ${BRAND_COLORS.white};
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .tagline {
            font-size: 14px;
            opacity: 0.9;
        }
        .alert-section {
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #E9ECEF;
            background: linear-gradient(135deg, #FFF7ED, #FFFFFF);
        }
        .alert-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryOrange}, ${BRAND_COLORS.secondaryOrange});
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: ${BRAND_COLORS.white};
            font-size: 24px;
            font-weight: bold;
        }
        .alert-title {
            font-size: 28px;
            font-weight: bold;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 8px;
        }
        .alert-subtitle {
            font-size: 16px;
            color: ${BRAND_COLORS.mediumGray};
        }
        .ticket-details {
            margin: 30px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .ticket-header {
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryOrange}, ${BRAND_COLORS.secondaryOrange});
            padding: 20px;
            text-align: center;
        }
        .ticket-number {
            color: ${BRAND_COLORS.white};
            font-size: 18px;
            font-weight: bold;
        }
        .ticket-body {
            padding: 30px;
            background-color: ${BRAND_COLORS.white};
        }
        .info-section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: ${BRAND_COLORS.primaryBlue};
            margin-bottom: 15px;
            border-bottom: 2px solid ${BRAND_COLORS.primaryOrange};
            padding-bottom: 5px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #F1F3F4;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: ${BRAND_COLORS.primaryBlue};
            min-width: 120px;
        }
        .info-value {
            color: ${BRAND_COLORS.darkGray};
            flex: 1;
        }
        .priority-badge {
            display: inline-block;
            background-color: ${priorityColor};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .description-box {
            background: ${BRAND_COLORS.lightGray};
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid ${BRAND_COLORS.primaryOrange};
        }
        .technical-info {
            background: #F8F9FA;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .actions-section {
            padding: 30px;
            text-align: center;
            background: linear-gradient(135deg, ${BRAND_COLORS.lightGray}, #FFFFFF);
        }
        .action-button {
            display: inline-block;
            background: linear-gradient(135deg, ${BRAND_COLORS.primaryBlue}, ${BRAND_COLORS.mediumBlue});
            color: ${BRAND_COLORS.white};
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin: 0 10px 10px;
        }
        .footer {
            background-color: ${BRAND_COLORS.primaryBlue};
            color: ${BRAND_COLORS.white};
            padding: 30px;
            text-align: center;
        }
        .footer-disclaimer {
            font-size: 12px;
            opacity: 0.8;
            line-height: 1.4;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }
            .info-row {
                flex-direction: column;
                gap: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SKYFIRE SOLAR</div>
            <div class="tagline">New Support Ticket Notification</div>
        </div>

        <div class="alert-section">
            <div class="alert-icon">!</div>
            <div class="alert-title">NEW SUPPORT TICKET</div>
            <div class="alert-subtitle">A customer has submitted a new support request</div>
        </div>

        <div class="ticket-details">
            <div class="ticket-header">
                <div class="ticket-number">Ticket #${data.ticket.ticketNumber}</div>
            </div>

            <div class="ticket-body">
                <div class="info-section">
                    <div class="section-title">📋 Ticket Details</div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value">${data.ticket.status.charAt(0).toUpperCase() + data.ticket.status.slice(1).replace('_', ' ')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Priority:</span>
                        <span class="info-value"><span class="priority-badge">${data.ticket.priority}</span></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Category:</span>
                        <span class="info-value">${data.ticket.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Submitted:</span>
                        <span class="info-value">${submittedDate}</span>
                    </div>
                </div>

                <div class="info-section">
                    <div class="section-title">👤 User Information</div>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${data.user.firstName} ${data.user.lastName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${data.user.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Company:</span>
                        <span class="info-value">${data.user.companyName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">User ID:</span>
                        <span class="info-value">${data.user.userId}</span>
                    </div>
                </div>

                <div class="info-section">
                    <div class="section-title">🎯 Issue Details</div>
                    <div class="info-row">
                        <span class="info-label">Subject:</span>
                        <span class="info-value"><strong>${data.ticket.subject}</strong></span>
                    </div>
                    <div class="description-box">
                        <strong>Description:</strong><br>
                        ${data.ticket.description.replace(/\n/g, '<br>')}
                    </div>
                </div>

                ${data.ticket.currentScreen || data.ticket.appVersion ? `
                <div class="info-section">
                    <div class="section-title">🔧 Technical Context</div>
                    <div class="technical-info">
                        ${data.ticket.currentScreen ? `<div><strong>Screen:</strong> ${data.ticket.currentScreen}</div>` : ''}
                        ${data.ticket.appVersion ? `<div><strong>App Version:</strong> ${data.ticket.appVersion}</div>` : ''}
                        ${data.ticket.deviceInfo ? `<div><strong>Device:</strong> ${JSON.stringify(data.ticket.deviceInfo, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</div>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>

        <div class="actions-section">
            <a href="mailto:${data.user.email}" class="action-button">📧 Contact User</a>
            <div style="margin-top: 15px; color: ${BRAND_COLORS.mediumGray};">
                Access the admin panel to view and manage this ticket
            </div>
        </div>

        <div class="footer">
            <div class="footer-disclaimer">
                <strong>Skyfire Solar Support System</strong><br>
                This is an automated notification for support ticket #${data.ticket.ticketNumber}<br>
                Please respond to this ticket promptly to maintain customer satisfaction.
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Creates the text version of the support ticket email template
 */
function createSupportTicketTextTemplate(data: SupportTicketTemplateData): string {
  const submittedDate = new Date(data.ticket.submittedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `
SKYFIRE SOLAR - NEW SUPPORT TICKET

! NEW SUPPORT TICKET SUBMITTED

Ticket Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ticket Number: ${data.ticket.ticketNumber}
Status: ${data.ticket.status.charAt(0).toUpperCase() + data.ticket.status.slice(1).replace('_', ' ')}
Priority: ${data.ticket.priority.toUpperCase()}
Category: ${data.ticket.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}

User Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${data.user.firstName} ${data.user.lastName}
Email: ${data.user.email}
Company: ${data.user.companyName}
User ID: ${data.user.userId}

Issue Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subject: ${data.ticket.subject}
Description: ${data.ticket.description}

${data.ticket.currentScreen || data.ticket.appVersion ? `
Technical Context:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.ticket.currentScreen ? `Screen: ${data.ticket.currentScreen}` : ''}
${data.ticket.appVersion ? `App Version: ${data.ticket.appVersion}` : ''}
${data.ticket.deviceInfo ? `Device Info: ${JSON.stringify(data.ticket.deviceInfo, null, 2)}` : ''}
` : ''}

Submitted: ${submittedDate}

Actions:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contact User: ${data.user.email}

This is an automated notification from the Skyfire Solar support system.
Please respond to this ticket promptly to maintain customer satisfaction.

---
SKYFIRE SOLAR SUPPORT SYSTEM
Ticket #${data.ticket.ticketNumber}
`;
}

/**
 * Main function to generate support ticket notification email
 */
export function generateSupportTicketEmail(data: SupportTicketTemplateData): EmailTemplate {
  return {
    subject: `New Support Ticket: ${data.ticket.ticketNumber} - ${data.ticket.subject}`,
    html: createSupportTicketHTMLTemplate(data),
    text: createSupportTicketTextTemplate(data),
    calendarEvent: {
      title: '',
      description: '',
      startDateTime: '',
      endDateTime: '',
      location: ''
    } // Not applicable for support tickets
  };
}

/**
 * Converts support ticket email template to Mailjet parameters (current backend system)
 */
export function createMailjetParams(
  template: EmailTemplate,
  recipientEmail: string,
  sourceEmail: string = 'app@skyfiresd.com',
  sourceName: string = 'Skyfire Solar Support'
): any {
  return {
    To: [{ Email: recipientEmail, Name: 'Support Team' }],
    Subject: template.subject,
    HTMLPart: template.html,
    TextPart: template.text
  };
}

// Example usage function for testing
export function createSampleEmail(): EmailTemplate {
  const sampleData: EmailTemplateData = {
    user: {
      firstName: 'John',
      lastName: 'Smith',
      companyName: 'ABC Manufacturing',
      email: 'john.smith@abcmfg.com'
    },
    demo: {
      date: '2024-01-15T14:00:00Z',
      displayTime: '2:00 PM'
    },
    confirmationNumber: 'SF123456',
    userTimezone: 'America/Phoenix',
    userTimezoneAbbr: 'MST'
  };

  return generateDemoConfirmationEmail(sampleData);
}

// Example support ticket email for testing
export function createSampleSupportTicketEmail(): EmailTemplate {
  const sampleData: SupportTicketTemplateData = {
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      companyName: 'Sample Solar Company',
      userId: 'usr_123456'
    },
    ticket: {
      ticketNumber: 'SKY-20241201-0001',
      subject: 'App crashes when loading project details',
      description: 'The mobile app crashes immediately when I try to view project details. This happens consistently on multiple projects.',
      category: 'bug',
      priority: 'high',
      status: 'open',
      currentScreen: 'ProjectDetailsScreen',
      appVersion: '2.1.19',
      deviceInfo: { device: 'iPhone 14 Pro', os: 'iOS 17.1', ram: '6GB' },
      submittedAt: new Date().toISOString()
    },
    adminEmail: 'logan@skyfiresd.com'
  };

  return generateSupportTicketEmail(sampleData);
}