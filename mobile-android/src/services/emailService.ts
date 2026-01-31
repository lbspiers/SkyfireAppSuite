// Email Service for Skyfire Solar
// Service layer for sending demo confirmation emails

import {
  generateDemoConfirmationEmail,
  createSESParams,
  generateICSFile,
  type EmailTemplateData,
  type EmailTemplate,
  type SESEmailParams
} from '../utils/emailTemplates';

// AWS SES Configuration
interface SESConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// Email sending result
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email Service Class for handling demo confirmation emails
 */
export class EmailService {
  private sesConfig: SESConfig | null = null;

  constructor(sesConfig?: SESConfig) {
    this.sesConfig = sesConfig || null;
  }

  /**
   * Configure AWS SES credentials
   */
  configureSES(config: SESConfig): void {
    this.sesConfig = config;
  }

  /**
   * Send demo confirmation email
   * @param templateData - Data for generating the email template
   * @returns Promise<EmailResult> - Result of the email sending operation
   */
  async sendDemoConfirmationEmail(templateData: EmailTemplateData): Promise<EmailResult> {
    try {
      // Generate the email template
      const emailTemplate = generateDemoConfirmationEmail(templateData);

      // Create SES parameters
      const sesParams = createSESParams(
        emailTemplate,
        templateData.user.email,
        'Designs@SkyfireSD.com'
      );

      // Send email using AWS SES
      const result = await this.sendEmailWithSES(sesParams);

      // Log success
      console.log(`Demo confirmation email sent successfully to ${templateData.user.email}`, {
        confirmationNumber: templateData.confirmationNumber,
        messageId: result.messageId,
        recipient: templateData.user.email
      });

      return result;

    } catch (error) {
      console.error('Failed to send demo confirmation email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send email using AWS SES SDK
   * @param params - SES email parameters
   * @returns Promise<EmailResult> - Result of the email sending
   */
  private async sendEmailWithSES(params: SESEmailParams): Promise<EmailResult> {
    if (!this.sesConfig) {
      throw new Error('SES configuration not provided. Please configure SES before sending emails.');
    }

    try {
      // Note: In a real implementation, you would use AWS SES SDK here
      // For now, we'll simulate the API call

      // Example implementation with AWS SES SDK:
      /*
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({
        region: this.sesConfig.region,
        accessKeyId: this.sesConfig.accessKeyId,
        secretAccessKey: this.sesConfig.secretAccessKey
      });

      const result = await ses.sendEmail(params).promise();
      return {
        success: true,
        messageId: result.MessageId
      };
      */

      // Simulation for development/testing
      console.log('Simulating SES email send with params:', {
        to: params.Destination.ToAddresses,
        subject: params.Message.Subject.Data,
        from: params.Source
      });

      // Simulate successful response
      return {
        success: true,
        messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(7)}`
      };

    } catch (error) {
      throw new Error(`SES email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate and return calendar ICS file content
   * @param templateData - Data for generating the calendar event
   * @returns string - ICS file content
   */
  generateCalendarFile(templateData: EmailTemplateData): string {
    const emailTemplate = generateDemoConfirmationEmail(templateData);
    return generateICSFile(emailTemplate.calendarEvent, templateData.confirmationNumber);
  }

  /**
   * Validate email template data
   * @param data - Email template data to validate
   * @returns boolean - Whether the data is valid
   */
  validateTemplateData(data: EmailTemplateData): boolean {
    try {
      // Required fields validation
      const requiredUserFields = ['firstName', 'lastName', 'email', 'companyName'];
      const requiredDemoFields = ['date', 'displayTime'];

      // Check user data
      for (const field of requiredUserFields) {
        if (!data.user[field as keyof typeof data.user]) {
          console.error(`Missing required user field: ${field}`);
          return false;
        }
      }

      // Check demo data
      for (const field of requiredDemoFields) {
        if (!data.demo[field as keyof typeof data.demo]) {
          console.error(`Missing required demo field: ${field}`);
          return false;
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.user.email)) {
        console.error('Invalid email format');
        return false;
      }

      // Validate date format
      const demoDate = new Date(data.demo.date);
      if (isNaN(demoDate.getTime())) {
        console.error('Invalid demo date format');
        return false;
      }

      // Validate confirmation number
      if (!data.confirmationNumber || data.confirmationNumber.length < 3) {
        console.error('Invalid confirmation number');
        return false;
      }

      return true;

    } catch (error) {
      console.error('Error validating template data:', error);
      return false;
    }
  }

  /**
   * Preview email template (for testing/debugging)
   * @param templateData - Data for generating the template
   * @returns EmailTemplate - The generated email template
   */
  previewEmailTemplate(templateData: EmailTemplateData): EmailTemplate {
    if (!this.validateTemplateData(templateData)) {
      throw new Error('Invalid template data provided');
    }

    return generateDemoConfirmationEmail(templateData);
  }
}

// Convenience function for one-off email sending
export async function sendDemoConfirmationEmail(
  templateData: EmailTemplateData,
  sesConfig?: SESConfig
): Promise<EmailResult> {
  const emailService = new EmailService(sesConfig);
  return emailService.sendDemoConfirmationEmail(templateData);
}

// Helper function to create template data from booking confirmation screen params
export function createTemplateDataFromBookingParams(
  registrationData: {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
  },
  bookingData: {
    date: string;
    displayTime: string;
    arizonaDateTime?: string;
  },
  confirmationNumber: string,
  userTimezone?: string
): EmailTemplateData {
  // Get timezone abbreviation
  let userTimezoneAbbr: string | undefined;
  if (userTimezone) {
    try {
      // This would work in a Node.js environment with proper timezone data
      // For React Native, you might need a different approach
      const now = new Date();
      const timeZoneOffset = now.toLocaleString('en', { timeZone: userTimezone, timeZoneName: 'short' });
      userTimezoneAbbr = timeZoneOffset.split(' ').pop();
    } catch (error) {
      console.warn('Could not determine timezone abbreviation:', error);
      userTimezoneAbbr = userTimezone;
    }
  }

  return {
    user: {
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      companyName: registrationData.companyName
    },
    demo: {
      date: bookingData.date,
      displayTime: bookingData.displayTime,
      arizonaDateTime: bookingData.arizonaDateTime
    },
    confirmationNumber,
    userTimezone,
    userTimezoneAbbr
  };
}

// Export default instance
export default new EmailService();