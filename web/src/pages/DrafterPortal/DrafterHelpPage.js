import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, FormInput, FormSelect, Textarea, Accordion, useToast } from '../../components/ui';
import { drafterProfileService } from '../../services/drafterProfileService';
import styles from './DrafterHelpPage.module.css';

const DrafterHelpPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [supportForm, setSupportForm] = useState({
    category: 'general',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (field, value) => {
    setSupportForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();

    if (!supportForm.subject.trim()) {
      addToast('Please enter a subject', 'error');
      return;
    }

    if (!supportForm.message.trim()) {
      addToast('Please enter a message', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await drafterProfileService.submitSupportTicket(
        supportForm.subject,
        supportForm.message,
        supportForm.category
      );
      addToast('Support ticket submitted successfully', 'success');
      setSupportForm({ category: 'general', subject: '', message: '' });
    } catch (err) {
      addToast('Failed to submit ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSupport = () => {
    document.getElementById('contact-support')?.scrollIntoView({ behavior: 'smooth' });
  };

  // FAQ Items
  const faqItems = [
    {
      title: 'How do I claim a project?',
      content: (
        <p>
          From the dashboard, click the "Assign Me Next" button when projects are available in the queue.
          You can also press <code>Enter</code> to quickly claim a project. Once claimed, you'll have 30 minutes
          to complete it before the timer expires.
        </p>
      )
    },
    {
      title: 'What happens if my timer expires?',
      content: (
        <p>
          If the 30-minute timer expires before you submit, the project will be automatically released back to
          the queue for another drafter to claim. You'll receive a "release" on your account, which affects your
          completion rate. Try to only claim projects when you have time to complete them.
        </p>
      )
    },
    {
      title: 'How do I release a project?',
      content: (
        <p>
          If you need to release a project before the timer expires, click the "Release Project" button in the
          workspace header. You can also use the keyboard shortcut <code>Ctrl+Shift+R</code>. Note that releases
          affect your metrics, so only use this when absolutely necessary.
        </p>
      )
    },
    {
      title: 'How do I get paid?',
      content: (
        <p>
          Earnings are tracked in real-time and can be viewed in the Earnings page. You can request a payout once
          your available balance reaches $25 or more. Choose between standard bank transfer (free, 3-5 business days)
          or instant transfer (2.5% fee, arrives within minutes). Payouts are sent to your registered payment method.
        </p>
      )
    },
    {
      title: 'What are the file requirements?',
      content: (
        <div>
          <p>All submitted designs must meet these requirements:</p>
          <ul>
            <li>PDF format for final deliverables</li>
            <li>DWG or DXF files for AutoCAD drawings</li>
            <li>All layers properly named and organized</li>
            <li>Comply with local building codes and NEC standards</li>
            <li>Include all required notes and dimensions</li>
          </ul>
        </div>
      )
    },
    {
      title: 'How does the leveling system work?',
      content: (
        <p>
          You earn XP (experience points) for completing projects, maintaining high quality, and achieving milestones.
          As you level up, you unlock perks like seeing the project phase before claiming and earning bonus percentages
          on all jobs. Check the Achievements page to see your progress and unlock new achievements.
        </p>
      )
    },
    {
      title: 'Can I work on multiple projects at once?',
      content: (
        <p>
          No, you can only have one active project at a time. This ensures you can focus on delivering high-quality
          work within the 30-minute timeframe. Once you submit your current project, you can immediately claim another
          one from the queue.
        </p>
      )
    },
    {
      title: 'How do I contact support?',
      content: (
        <p>
          You can submit a support ticket using the form at the bottom of this page. For urgent issues, you can also
          reach us at <strong>support@skyfiresd.com</strong> or call <strong>(555) 123-4567</strong> during business
          hours (9 AM - 5 PM EST, Monday-Friday).
        </p>
      )
    }
  ];

  // Keyboard shortcuts
  const shortcuts = [
    { shortcut: 'Enter', action: 'Claim next project', page: 'Dashboard' },
    { shortcut: 'Ctrl+Enter', action: 'Submit project', page: 'Workspace' },
    { shortcut: 'Escape', action: 'Close modal / Cancel', page: 'All pages' },
    { shortcut: 'Ctrl+Shift+R', action: 'Release project', page: 'Workspace' }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleIcon}>❓</span>
          Help & Support
        </h1>
      </div>

      {/* Quick Links */}
      <div className={styles.quickLinks}>
        <a href="https://docs.skyfiresd.com" target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
          <span className={styles.quickLinkIcon}>📚</span>
          <span className={styles.quickLinkLabel}>Documentation</span>
        </a>
        <a href="https://training.skyfiresd.com" target="_blank" rel="noopener noreferrer" className={styles.quickLink}>
          <span className={styles.quickLinkIcon}>🎥</span>
          <span className={styles.quickLinkLabel}>Training Videos</span>
        </a>
        <button onClick={scrollToSupport} className={styles.quickLink}>
          <span className={styles.quickLinkIcon}>💬</span>
          <span className={styles.quickLinkLabel}>Contact Support</span>
        </button>
      </div>

      {/* FAQ Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <Accordion items={faqItems} />
      </section>

      {/* Keyboard Shortcuts */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Keyboard Shortcuts</h2>
        <div className={styles.shortcutsTable}>
          <div className={styles.shortcutsHeader}>
            <div className={styles.shortcutsCol}>Shortcut</div>
            <div className={styles.shortcutsCol}>Action</div>
            <div className={styles.shortcutsCol}>Page</div>
          </div>
          {shortcuts.map((item, index) => (
            <div key={index} className={styles.shortcutsRow}>
              <div className={styles.shortcutsCol}>
                <kbd className={styles.kbd}>{item.shortcut}</kbd>
              </div>
              <div className={styles.shortcutsCol}>{item.action}</div>
              <div className={styles.shortcutsCol}>{item.page}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support Form */}
      <section id="contact-support" className={styles.section}>
        <h2 className={styles.sectionTitle}>Contact Support</h2>
        <form onSubmit={handleSubmitTicket} className={styles.form}>
          <FormSelect
            label="Category"
            value={supportForm.category}
            onChange={(e) => handleFormChange('category', e.target.value)}
            options={[
              { value: 'general', label: 'General' },
              { value: 'technical', label: 'Technical' },
              { value: 'payment', label: 'Payment' },
              { value: 'other', label: 'Other' }
            ]}
          />
          <FormInput
            label="Subject"
            value={supportForm.subject}
            onChange={(e) => handleFormChange('subject', e.target.value)}
            placeholder="Brief description of your issue"
            disabled={submitting}
          />
          <Textarea
            label="Message"
            value={supportForm.message}
            onChange={(e) => handleFormChange('message', e.target.value)}
            placeholder="Provide details about your issue..."
            rows={6}
            disabled={submitting}
          />
          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </section>

      {/* App Information */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>App Information</h2>
        <div className={styles.appInfo}>
          <div className={styles.appInfoRow}>
            <span className={styles.appInfoLabel}>Version:</span>
            <span className={styles.appInfoValue}>1.0.0</span>
          </div>
          <div className={styles.appInfoRow}>
            <span className={styles.appInfoLabel}>Last Updated:</span>
            <span className={styles.appInfoValue}>January 2025</span>
          </div>
          <div className={styles.appInfoLinks}>
            <a href="https://skyfiresd.com/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            {' • '}
            <a href="https://skyfiresd.com/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DrafterHelpPage;
