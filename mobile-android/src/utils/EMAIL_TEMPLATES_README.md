# Skyfire Solar Email Template System

A professional email template system for demo booking confirmations with full Skyfire Solar branding.

## 🚀 Features

- **Professional HTML Email Templates** - Mobile-responsive with Skyfire branding
- **Text Email Fallbacks** - Plain text versions for all email clients
- **Calendar Integration** - ICS file generation for calendar apps
- **AWS SES Integration** - Ready for Amazon SES email delivery
- **TypeScript Support** - Full type safety and IntelliSense
- **Template Validation** - Built-in data validation and error handling
- **Responsive Design** - Works perfectly on all devices and email clients

## 📁 File Structure

```
src/
├── utils/
│   ├── emailTemplates.ts           # Core template generation logic
│   └── emailIntegrationExample.ts  # Usage examples and integration helpers
├── services/
│   └── emailService.ts            # Email service layer with SES integration
└── utils/
    └── EMAIL_TEMPLATES_README.md  # This documentation file
```

## 🎨 Brand Colors

The email templates use the official Skyfire Solar brand colors from `src/styles/gradient.tsx`:

- **Primary Orange**: `#FD7332`
- **Secondary Orange**: `#B92011`
- **Primary Blue**: `#2E4161`
- **Medium Blue**: `#213454`
- **Dark Blue**: `#0C1F3F`

## 📧 Template Features

### HTML Email Template
- **Responsive Design** - Adapts to mobile, tablet, and desktop
- **Professional Layout** - Clean, modern design with proper hierarchy
- **Brand Consistency** - Uses Skyfire Solar colors and styling
- **Calendar Integration** - Built-in "Add to Calendar" button
- **Contact Information** - Easy access to support contacts

### Text Email Template
- **Clean Format** - Well-structured plain text version
- **All Information** - Contains same details as HTML version
- **Accessibility** - Works with screen readers and text-only clients

## 🔧 Quick Start

### Basic Usage

```typescript
import { generateDemoConfirmationEmail } from './utils/emailTemplates';
import { EmailService } from './services/emailService';

// Prepare your data
const templateData = {
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

// Generate the email template
const emailTemplate = generateDemoConfirmationEmail(templateData);

// Send the email
const emailService = new EmailService({
  region: 'us-west-2',
  accessKeyId: 'your-aws-key',
  secretAccessKey: 'your-aws-secret'
});

const result = await emailService.sendDemoConfirmationEmail(templateData);
```

### Integration with BookingConfirmationScreen

```typescript
import { handleBookingConfirmation } from './utils/emailIntegrationExample';

// In your booking confirmation logic
const emailResult = await handleBookingConfirmation(
  registrationData,  // from BookingConfirmationScreen params
  bookingData,       // from BookingConfirmationScreen params
  confirmationNumber,
  userTimezone
);

if (emailResult.emailSent) {
  console.log('✅ Email sent successfully!');
} else {
  console.warn('⚠️ Email failed to send:', emailResult.error);
}
```

## 🛠️ API Reference

### `generateDemoConfirmationEmail(data: EmailTemplateData): EmailTemplate`

Generates a complete email template with HTML, text, and calendar components.

**Parameters:**
- `data.user` - User information (firstName, lastName, email, companyName)
- `data.demo` - Demo details (date, displayTime, arizonaDateTime)
- `data.confirmationNumber` - Booking confirmation number
- `data.userTimezone` - User's timezone (optional)
- `data.userTimezoneAbbr` - Timezone abbreviation (optional)

**Returns:**
```typescript
{
  subject: string;        // Email subject line
  html: string;          // HTML email content
  text: string;          // Plain text email content
  calendarEvent: {       // Calendar event data
    title: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    location: string;
  }
}
```

### `EmailService` Class

#### Constructor
```typescript
new EmailService(sesConfig?: SESConfig)
```

#### Methods

**`sendDemoConfirmationEmail(templateData: EmailTemplateData): Promise<EmailResult>`**
- Sends a complete demo confirmation email
- Returns success/failure status and message ID

**`validateTemplateData(data: EmailTemplateData): boolean`**
- Validates all required fields and formats
- Returns true if data is valid

**`previewEmailTemplate(templateData: EmailTemplateData): EmailTemplate`**
- Generates template for preview/testing
- Throws error if data is invalid

**`generateCalendarFile(templateData: EmailTemplateData): string`**
- Returns ICS calendar file content
- Can be used for calendar downloads

## 🔧 AWS SES Configuration

### Environment Variables
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
```

### SES Setup Requirements
1. **Verify Sender Email** - Add `Designs@SkyfireSD.com` to SES verified identities
2. **Configure Region** - Use consistent region (recommended: `us-west-2`)
3. **Set Sending Limits** - Configure appropriate sending quotas
4. **Domain Verification** - Verify `skyfiresd.com` domain (optional but recommended)

## 📱 Calendar Integration

The system generates standard ICS files that work with:
- **Google Calendar**
- **Apple Calendar**
- **Outlook**
- **Yahoo Calendar**
- **Any RFC-compliant calendar app**

### Calendar Features
- **Event Reminders** - 24-hour and 1-hour reminders
- **Event Details** - Complete demo information
- **Time Zones** - Proper timezone handling
- **Duration** - 45-minute event duration

## 🧪 Testing

### Preview Templates
```typescript
import { previewEmailTemplate } from './utils/emailIntegrationExample';

// Generate and preview template
const template = previewEmailTemplate();
console.log(template.subject);
console.log(template.html); // Full HTML email
console.log(template.text); // Text version
```

### Validation Testing
```typescript
import { EmailTestUtils } from './utils/emailIntegrationExample';

// Test template generation
EmailTestUtils.testTemplateGeneration();

// Test validation logic
EmailTestUtils.testValidation();

// Create test data
const testData = EmailTestUtils.createTestData({
  user: { firstName: 'Custom Test User' }
});
```

## 🎯 Best Practices

### Data Validation
Always validate template data before sending:
```typescript
const emailService = new EmailService();
if (!emailService.validateTemplateData(templateData)) {
  throw new Error('Invalid template data');
}
```

### Error Handling
Implement proper error handling:
```typescript
try {
  const result = await emailService.sendDemoConfirmationEmail(templateData);
  if (!result.success) {
    // Log error but don't fail the booking
    console.error('Email failed:', result.error);
    // Maybe retry later or notify admin
  }
} catch (error) {
  // Handle critical errors
  console.error('Email service error:', error);
}
```

### Environment Configuration
Use different configurations for different environments:
```typescript
import { getEmailConfig } from './utils/emailIntegrationExample';

const config = getEmailConfig(); // Automatically detects environment
const emailService = new EmailService(config.ses);
```

## 🔍 Troubleshooting

### Common Issues

**Email not sending:**
- Check AWS SES configuration
- Verify sender email is verified in SES
- Check AWS credentials and permissions
- Ensure recipient email is not bounced/complained

**Template rendering issues:**
- Validate all template data fields
- Check date format (should be ISO 8601)
- Verify email address format

**Calendar integration problems:**
- Check date/time format in demo data
- Verify timezone handling
- Test ICS file with different calendar apps

### Debug Mode
Enable detailed logging:
```typescript
process.env.NODE_ENV = 'development'; // Shows detailed logs
const result = await emailService.sendDemoConfirmationEmail(templateData);
```

## 📞 Support

For questions about the email template system:
- **Email**: Designs@SkyfireSD.com
- **Phone**: (480) 759-3473

## 🔄 Future Enhancements

Potential improvements for the email system:
- **Multiple Templates** - Different templates for different demo types
- **A/B Testing** - Test different email designs
- **Analytics Integration** - Track email open/click rates
- **Multi-language Support** - Templates in different languages
- **SMS Integration** - SMS confirmations in addition to email
- **Email Preferences** - User preferences for email frequency/format

## 📋 Checklist for Integration

- [ ] Install AWS SDK dependencies
- [ ] Configure AWS SES credentials
- [ ] Verify sender email in SES
- [ ] Test email sending in development
- [ ] Integrate with existing booking flow
- [ ] Add error handling for email failures
- [ ] Test on different email clients
- [ ] Configure production environment variables
- [ ] Set up monitoring/logging for email delivery
- [ ] Document deployment process

---

*Generated with ❤️ for Skyfire Solar*