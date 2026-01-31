// Integration Example for Skyfire Solar Email Templates
// This file demonstrates how to integrate the email template system with your booking flow

import {
  EmailService,
  sendDemoConfirmationEmail,
  createTemplateDataFromBookingParams
} from '../services/emailService';
import { generateDemoConfirmationEmail } from './emailTemplates';

/**
 * Example integration function that would be called after successful booking
 * This shows how to integrate the email system with your existing booking confirmation flow
 */
export async function handleBookingConfirmation(
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
) {
  try {
    // Step 1: Create template data from booking parameters
    const templateData = createTemplateDataFromBookingParams(
      registrationData,
      bookingData,
      confirmationNumber,
      userTimezone
    );

    // Step 2: Configure email service (in production, these would come from environment variables)
    const emailService = new EmailService({
      region: 'us-west-2', // or your preferred AWS region
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    });

    // Step 3: Validate template data before sending
    if (!emailService.validateTemplateData(templateData)) {
      throw new Error('Invalid template data - cannot send email');
    }

    // Step 4: Send the confirmation email
    const emailResult = await emailService.sendDemoConfirmationEmail(templateData);

    if (emailResult.success) {
      console.log(`✅ Demo confirmation email sent successfully!`);
      console.log(`   Message ID: ${emailResult.messageId}`);
      console.log(`   Recipient: ${registrationData.email}`);
      console.log(`   Confirmation: ${confirmationNumber}`);

      // Log successful email send for analytics/tracking
      // You might want to update your database or send analytics events here

      return {
        emailSent: true,
        messageId: emailResult.messageId
      };
    } else {
      console.error('❌ Failed to send demo confirmation email:', emailResult.error);

      // Handle email failure - maybe retry or notify admin
      // You might want to store failed email attempts for retry later

      return {
        emailSent: false,
        error: emailResult.error
      };
    }

  } catch (error) {
    console.error('Error in booking confirmation email process:', error);
    return {
      emailSent: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Example of how to preview/test the email template
 * Useful for development and testing
 */
export function previewEmailTemplate() {
  const sampleData = {
    user: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      companyName: 'Green Tech Solutions',
      email: 'sarah.johnson@greentechsolutions.com'
    },
    demo: {
      date: '2024-02-15T15:30:00Z',
      displayTime: '3:30 PM'
    },
    confirmationNumber: 'SF789123',
    userTimezone: 'America/Phoenix',
    userTimezoneAbbr: 'MST'
  };

  const template = generateDemoConfirmationEmail(sampleData);

  console.log('Email Preview Generated:');
  console.log('Subject:', template.subject);
  console.log('Calendar Event:', template.calendarEvent);

  // Return template for further inspection
  return template;
}

/**
 * Example of handling the email sending in your React Native component
 * This shows how you might integrate this into your existing BookingConfirmationScreen
 */
export const BookingConfirmationEmailHandler = {
  /**
   * Send confirmation email after successful booking
   */
  async sendConfirmationEmail(
    registrationData: any,
    bookingData: any,
    confirmationNumber: string,
    userTimezone?: string
  ) {
    try {
      // Show loading state in your UI
      // setEmailSending(true);

      const result = await handleBookingConfirmation(
        registrationData,
        bookingData,
        confirmationNumber,
        userTimezone
      );

      if (result.emailSent) {
        // Show success message in your UI
        console.log('Email sent successfully!');
        // You might want to show a toast or update the UI
        // showToast('Confirmation email sent successfully!');
      } else {
        // Handle email failure gracefully
        console.warn('Email failed to send, but booking was successful');
        // You might want to show a warning message
        // showToast('Booking confirmed! Email confirmation will be sent shortly.');
      }

      return result;

    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Handle error gracefully - booking was still successful
      return { emailSent: false, error: 'Email service temporarily unavailable' };
    } finally {
      // Hide loading state
      // setEmailSending(false);
    }
  },

  /**
   * Generate calendar file for download
   */
  generateCalendarDownload(
    registrationData: any,
    bookingData: any,
    confirmationNumber: string,
    userTimezone?: string
  ): string {
    const templateData = createTemplateDataFromBookingParams(
      registrationData,
      bookingData,
      confirmationNumber,
      userTimezone
    );

    const emailService = new EmailService();
    return emailService.generateCalendarFile(templateData);
  }
};

/**
 * Environment configuration helper
 * Use this to manage different configurations for development, staging, and production
 */
export const EmailConfig = {
  development: {
    ses: {
      region: 'us-west-2',
      // Use test credentials or mock service in development
      accessKeyId: 'development-key',
      secretAccessKey: 'development-secret'
    },
    fromEmail: 'dev-designs@skyfiresd.com',
    enableSending: false // Don't send real emails in development
  },

  staging: {
    ses: {
      region: 'us-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    fromEmail: 'staging-designs@skyfiresd.com',
    enableSending: true
  },

  production: {
    ses: {
      region: 'us-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    },
    fromEmail: 'Designs@SkyfireSD.com',
    enableSending: true
  }
};

/**
 * Get configuration based on environment
 */
export function getEmailConfig() {
  const env = process.env.NODE_ENV || 'development';
  return EmailConfig[env as keyof typeof EmailConfig] || EmailConfig.development;
}

/**
 * Testing utilities
 */
export const EmailTestUtils = {
  /**
   * Generate test template data
   */
  createTestData(overrides: Partial<any> = {}) {
    return {
      user: {
        firstName: 'Test',
        lastName: 'User',
        companyName: 'Test Company',
        email: 'test@example.com',
        ...overrides.user
      },
      demo: {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        displayTime: '2:00 PM',
        ...overrides.demo
      },
      confirmationNumber: `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      userTimezone: 'America/Phoenix',
      userTimezoneAbbr: 'MST',
      ...overrides
    };
  },

  /**
   * Test email template generation
   */
  testTemplateGeneration() {
    const testData = this.createTestData();
    const template = generateDemoConfirmationEmail(testData);

    console.log('✅ Template generation test passed');
    console.log(`   Subject: ${template.subject}`);
    console.log(`   HTML length: ${template.html.length} characters`);
    console.log(`   Text length: ${template.text.length} characters`);

    return template;
  },

  /**
   * Test email service validation
   */
  testValidation() {
    const emailService = new EmailService();

    // Test valid data
    const validData = this.createTestData();
    const isValid = emailService.validateTemplateData(validData);
    console.log(`✅ Valid data test: ${isValid ? 'PASSED' : 'FAILED'}`);

    // Test invalid data
    const invalidData = this.createTestData({
      user: { email: 'invalid-email' }
    });
    const isInvalid = !emailService.validateTemplateData(invalidData);
    console.log(`✅ Invalid data test: ${isInvalid ? 'PASSED' : 'FAILED'}`);

    return { validData: isValid, invalidData: isInvalid };
  }
};

// Export everything for easy testing and integration
export default {
  handleBookingConfirmation,
  previewEmailTemplate,
  BookingConfirmationEmailHandler,
  EmailConfig,
  getEmailConfig,
  EmailTestUtils
};