import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import FormInput from '../components/ui/FormInput';
import FormSelect from '../components/ui/FormSelect';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import styles from '../styles/SupportTickets.module.css';
import {
  getUserTickets,
  searchTickets,
  getTicketDetails,
  createTicket,
  canCreateTicket,
  updateLastTicketTime,
  getRemainingCooldown,
  getDeviceInfo,
  getPriorityColor,
  getStatusColor,
  getStatusLabel,
  getCategoryLabel,
  formatDate,
  formatDateTime,
  DEFAULT_OPTIONS,
} from '../services/supportTicketService';

/**
 * Support Tickets Page
 * Manages support ticket creation, viewing, and keyboard shortcuts
 */
const SupportTickets = () => {
  // Redux
  const user = useSelector((state) => state.auth?.user);
  const company = useSelector((state) => state.auth?.company);

  // Tab state
  const [activeTab, setActiveTab] = useState('support'); // 'support' | 'shortcuts'

  // Tickets list state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Ticket details modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailsLoading, setTicketDetailsLoading] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium'
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({ canCreate: true, remainingMs: 0 });

  // Tabs configuration
  const tabs = [
    { id: 'support', label: 'Support Tickets' },
    { id: 'shortcuts', label: 'Keyboard Shortcuts' }
  ];

  /**
   * Load tickets with pagination
   */
  const loadTickets = useCallback(async (page = 1) => {
    setTicketsLoading(true);
    try {
      let response;
      if (searchQuery.trim()) {
        response = await searchTickets(searchQuery, page, pagination.limit);
      } else {
        response = await getUserTickets(page, pagination.limit);
      }

      setTickets(response.tickets || []);
      setPagination({
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        totalPages: response.totalPages || 1
      });
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets. Please try again.');
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, [searchQuery, pagination.limit]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadTickets();
  }, []);

  /**
   * Search debounce effect
   */
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      loadTickets(1);
    }, 300);

    setSearchDebounce(timeout);

    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchQuery]);

  /**
   * Handle ticket click - load full details
   */
  const handleTicketClick = async (ticket) => {
    setSelectedTicket(ticket);
    setTicketDetailsLoading(true);

    try {
      const fullDetails = await getTicketDetails(ticket.ticketNumber);
      setSelectedTicket(fullDetails);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast.error('Failed to load ticket details');
      // Keep basic info visible
    } finally {
      setTicketDetailsLoading(false);
    }
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setSelectedTicket(null);
  };

  /**
   * Render priority badge
   */
  const renderPriorityBadge = (priority) => {
    const colors = getPriorityColor(priority);
    return (
      <span
        className={styles.priorityBadge}
        style={{
          backgroundColor: colors.bg,
          color: colors.text
        }}
      >
        {priority}
      </span>
    );
  };

  /**
   * Render status badge
   */
  const renderStatusBadge = (status) => {
    const colors = getStatusColor(status);
    return (
      <span
        className={styles.statusBadge}
        style={{
          backgroundColor: colors.bg,
          color: colors.text
        }}
      >
        {getStatusLabel(status)}
      </span>
    );
  };

  /**
   * Handle refresh button
   */
  const handleRefresh = () => {
    loadTickets(pagination.page);
  };

  /**
   * Handle pagination
   */
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      loadTickets(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      loadTickets(pagination.page + 1);
    }
  };

  /**
   * Handle email about ticket
   */
  const handleEmailAboutTicket = () => {
    const email = 'support@skyfireapp.io';
    const subject = `Re: Ticket ${selectedTicket?.ticketNumber}`;
    const body = `Hello Skyfire Support,\n\nI am following up on ticket ${selectedTicket?.ticketNumber}.\n\n`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  /**
   * Check rate limit and set up interval if needed
   */
  const checkRateLimit = useCallback(() => {
    const rateLimitCheck = canCreateTicket();
    setRateLimitInfo(rateLimitCheck);

    if (!rateLimitCheck.canCreate) {
      const interval = setInterval(() => {
        const check = canCreateTicket();
        setRateLimitInfo(check);

        if (check.canCreate) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, []);

  /**
   * Rate limit check on mount
   */
  useEffect(() => {
    const cleanup = checkRateLimit();
    return cleanup;
  }, [checkRateLimit]);

  /**
   * Handle form input change
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const errors = {};

    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    } else if (formData.subject.length > 255) {
      errors.subject = 'Subject cannot exceed 255 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters';
    }

    // Category validation
    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check rate limit first
    const rateLimitCheck = canCreateTicket();
    if (!rateLimitCheck.canCreate) {
      toast.error(`Please wait ${getRemainingCooldown(rateLimitCheck.remainingMs)} before creating another ticket`);
      return;
    }

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setFormSubmitting(true);

    try {
      const ticketData = {
        subject: formData.subject,
        description: formData.description,
        category: formData.category,
        priority: formData.priority || 'medium',
        current_screen: window.location.pathname,
        app_version: '1.0.0-web',
        user_id: user?.id,
        company_id: company?.id || user?.company_id,
        user_info: {
          firstName: user?.first_name || user?.firstName || '',
          lastName: user?.last_name || user?.lastName || '',
          email: user?.email || '',
          companyName: company?.name || ''
        },
        screenshots: [],
        logs: null,
        deviceInfo: getDeviceInfo(),
        additionalData: {
          timestamp: new Date().toISOString(),
          platform: 'web'
        }
      };

      const response = await createTicket(ticketData);

      // Update rate limit
      updateLastTicketTime();
      checkRateLimit();

      // Show success message
      toast.success(`Ticket ${response.ticketNumber || 'created'} submitted successfully!`);

      // Reset form
      setFormData({
        subject: '',
        description: '',
        category: '',
        priority: 'medium'
      });
      setFormErrors({});

      // Refresh ticket list
      loadTickets(1);
    } catch (error) {
      console.error('Error creating ticket:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create ticket. Please try again.';
      toast.error(errorMessage);
    } finally {
      setFormSubmitting(false);
    }
  };

  /**
   * Get character count class
   */
  const getCharCountClass = (current, max, warningThreshold = 0.8) => {
    if (current >= max) {
      return styles.charCountError;
    }
    if (current >= max * warningThreshold) {
      return styles.charCountWarning;
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.container}
    >
      {/* Subtab Navigation */}
      <div className={styles.subtabContainer}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.subtabLink} ${styles.subtabButton} ${activeTab === tab.id ? styles.subtabLinkActive : ''}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className={styles.subtabIndicator} />
            )}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {/* SUPPORT TICKETS TAB */}
        {activeTab === 'support' && (
          <div className={styles.supportGrid}>
            {/* LEFT COLUMN - Ticket List */}
            <div className={styles.leftColumn}>
              <div className={styles.panelWrapper}>
                {/* Panel Header */}
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>
                    My Tickets {!ticketsLoading && `(${pagination.total})`}
                  </h2>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={ticketsLoading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.iconWithMargin}>
                      <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Refresh
                  </Button>
                </div>

                {/* Search Container */}
                <div className={styles.searchContainer}>
                  <div className={styles.searchWrapper}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Panel Content */}
                <div className={styles.panelContent}>
                  {ticketsLoading ? (
                    // Loading State
                    <div className={styles.loadingState}>
                      <div className={styles.loadingSpinner}></div>
                    </div>
                  ) : tickets.length === 0 ? (
                    // Empty State
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>🎫</div>
                      <h3 className={styles.emptyTitle}>
                        {searchQuery ? 'No tickets found' : 'No support tickets yet'}
                      </h3>
                      <p className={styles.emptyText}>
                        {searchQuery
                          ? 'Try adjusting your search query'
                          : 'Create your first support ticket to get started'}
                      </p>
                    </div>
                  ) : (
                    // Ticket List
                    <div className={styles.ticketList}>
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.ticketNumber}
                          className={`${styles.ticketItem} ${selectedTicket?.ticketNumber === ticket.ticketNumber ? styles.ticketItemActive : ''}`}
                          onClick={() => handleTicketClick(ticket)}
                        >
                          <div className={styles.ticketItemHeader}>
                            <span className={styles.ticketNumber}>
                              {ticket.ticketNumber}
                            </span>
                            <span className={styles.ticketDate}>
                              {formatDate(ticket.createdAt)}
                            </span>
                          </div>
                          <div className={styles.ticketSubject}>
                            {ticket.subject}
                          </div>
                          <div className={styles.ticketMeta}>
                            {renderStatusBadge(ticket.status)}
                            {renderPriorityBadge(ticket.priority)}
                            <span className={styles.categoryBadge}>
                              {getCategoryLabel(ticket.category)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {!ticketsLoading && pagination.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.paginationButton}
                      onClick={handlePrevPage}
                      disabled={pagination.page === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Previous
                    </button>
                    <span className={styles.paginationInfo}>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      className={styles.paginationButton}
                      onClick={handleNextPage}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - Create Ticket Form */}
            <div className={styles.rightColumn}>
              <div className={styles.panelWrapper}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>Create New Ticket</h2>
                </div>

                <form onSubmit={handleSubmit} className={styles.panelContent}>
                  <div className={styles.formContent}>
                    {/* Rate Limit Warning */}
                    {!rateLimitInfo.canCreate && (
                      <div className={styles.rateLimitWarning}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Please wait {getRemainingCooldown(rateLimitInfo.remainingMs)} before creating another ticket
                      </div>
                    )}

                    <div className={styles.formGrid}>
                      {/* Subject Field */}
                      <div>
                        <FormInput
                          label="Subject"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          placeholder="Brief summary of your issue"
                          error={formErrors.subject}
                          required
                          maxLength={255}
                        />
                        <div className={`${styles.charCount} ${getCharCountClass(formData.subject.length, 255)}`}>
                          {formData.subject.length}/255
                        </div>
                      </div>

                      {/* Category & Priority Row */}
                      <div className={styles.formTwoColumn}>
                        <FormSelect
                          label="Category"
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          options={[
                            { value: 'bug', label: 'Bug Report' },
                            { value: 'feature_request', label: 'Feature Request' },
                            { value: 'general_support', label: 'General Support' },
                            { value: 'account_issue', label: 'Account Issue' }
                          ]}
                          placeholder="Select category"
                          error={formErrors.category}
                          required
                        />
                        <FormSelect
                          label="Priority"
                          value={formData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          options={[
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                            { value: 'urgent', label: 'Urgent' }
                          ]}
                          placeholder="Select priority"
                        />
                      </div>

                      {/* Description Field */}
                      <div>
                        <Textarea
                          label="Description"
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Please describe your issue in detail. Include steps to reproduce if reporting a bug."
                          error={formErrors.description}
                          required
                          rows={6}
                          maxLength={2000}
                          showCount
                        />
                      </div>

                      {/* Help Section */}
                      <div className={styles.helpSection}>
                        <h4 className={styles.helpTitle}>Tips for a great ticket</h4>
                        <p className={styles.helpText}>
                          • Be specific about what you were doing when the issue occurred<br/>
                          • Include any error messages you saw<br/>
                          • Describe what you expected to happen<br/>
                          • For bugs, list the steps to reproduce the issue
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className={styles.formFooter}>
                    <div className={styles.supportContact}>
                      <a href="mailto:logan@skyfiresd.com" className={styles.contactLink}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.iconWithMargin}>
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Email Support
                      </a>
                      <a href="tel:+14807593473" className={styles.contactLink}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.iconWithMargin}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        (480) 759-3473
                      </a>
                    </div>
                    <Button
                      type="submit"
                      onClick={handleSubmit}
                      loading={formSubmitting}
                      disabled={!rateLimitInfo.canCreate || formSubmitting}
                    >
                      Submit Ticket
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* KEYBOARD SHORTCUTS TAB */}
        {activeTab === 'shortcuts' && (
          <div className={`${styles.panelWrapper} ${styles.panelWrapperNarrow}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Keyboard Shortcuts</h2>
            </div>
            <div className={styles.panelContent}>
              <div className={styles.keyboardShortcuts}>

                {/* General Navigation */}
                <div className={styles.shortcutSection}>
                  <h3 className={styles.shortcutSectionTitle}>General Navigation</h3>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Go to Dashboard</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>G</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>D</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Go to Projects</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>G</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>P</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Global Search</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>K</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Toggle Sidebar</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>[</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Open Notifications</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>G</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>N</span>
                    </div>
                  </div>
                </div>

                {/* Project Actions */}
                <div className={styles.shortcutSection}>
                  <h3 className={styles.shortcutSectionTitle}>Project Actions</h3>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>New Project</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>N</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Save Changes</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>S</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Undo</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>Z</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Redo</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>⇧</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>Z</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Duplicate</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>D</span>
                    </div>
                  </div>
                </div>

                {/* PDF Viewer */}
                <div className={styles.shortcutSection}>
                  <h3 className={styles.shortcutSectionTitle}>PDF Viewer</h3>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Zoom In</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>+</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Zoom Out</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>-</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Reset Zoom / Fit to Width</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>0</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Next Page</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>→</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Previous Page</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>←</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>First Page</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Home</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Last Page</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>End</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Delete Selected Annotation</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Delete</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Toggle Fullscreen</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>F</span>
                    </div>
                  </div>
                </div>

                {/* Table / Grid Navigation */}
                <div className={styles.shortcutSection}>
                  <h3 className={styles.shortcutSectionTitle}>Tables & Grids</h3>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Select All</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>A</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Copy Selection</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>C</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Paste</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>V</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Navigate Cells</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>↑</span>
                      <span className={styles.keyboardKey}>↓</span>
                      <span className={styles.keyboardKey}>←</span>
                      <span className={styles.keyboardKey}>→</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Edit Cell</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Enter</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Cancel Edit</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Esc</span>
                    </div>
                  </div>
                </div>

                {/* Forms & Modals */}
                <div className={styles.shortcutSection}>
                  <h3 className={styles.shortcutSectionTitle}>Forms & Modals</h3>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Submit Form</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⌘</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>Enter</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Close Modal / Cancel</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Esc</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Next Field</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Tab</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Previous Field</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⇧</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>Tab</span>
                    </div>
                  </div>
                </div>

                {/* Chatter */}
                <div className={styles.shortcutSection}>
                  <h3 className={styles.shortcutSectionTitle}>Chatter</h3>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Send Message</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>Enter</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>New Line in Message</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>⇧</span>
                      <span className={styles.keyboardPlus}>+</span>
                      <span className={styles.keyboardKey}>Enter</span>
                    </div>
                  </div>

                  <div className={styles.shortcutItem}>
                    <span className={styles.shortcutLabel}>Mention User</span>
                    <div className={styles.shortcutKeys}>
                      <span className={styles.keyboardKey}>@</span>
                    </div>
                  </div>
                </div>

                {/* Platform Note */}
                <div className={`${styles.helpSection} ${styles.helpSectionTop}`}>
                  <p className={`${styles.helpText} ${styles.helpTextSmall}`}>
                    <strong>Note:</strong> On Windows, use <span className={`${styles.keyboardKey} ${styles.keyboardKeyInline}`}>Ctrl</span> instead of <span className={`${styles.keyboardKey} ${styles.keyboardKeyInline}`}>⌘</span>
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <h2 className={styles.panelTitle}>
                Ticket {selectedTicket.ticketNumber}
              </h2>
              <button
                className={styles.modalClose}
                onClick={closeModal}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {ticketDetailsLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              ) : (
                <>
                  {/* Badges */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailBadges}>
                      {renderStatusBadge(selectedTicket.status)}
                      {renderPriorityBadge(selectedTicket.priority)}
                      <span className={styles.categoryBadge}>
                        {getCategoryLabel(selectedTicket.category)}
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>Subject</div>
                    <div className={styles.detailValue}>{selectedTicket.subject}</div>
                  </div>

                  {/* Description */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>Description</div>
                    <div className={`${styles.detailValue} ${styles.detailValuePreWrap}`}>
                      {selectedTicket.description || 'No description provided'}
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>Created</div>
                    <div className={styles.detailValue}>
                      {formatDateTime(selectedTicket.createdAt)}
                    </div>
                  </div>

                  {/* Updated Date */}
                  {selectedTicket.updatedAt && (
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>Last Updated</div>
                      <div className={styles.detailValue}>
                        {formatDateTime(selectedTicket.updatedAt)}
                      </div>
                    </div>
                  )}

                  {/* Assigned To */}
                  {selectedTicket.assignedTo && (
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>Assigned To</div>
                      <div className={styles.detailValue}>
                        {selectedTicket.assignedTo}
                      </div>
                    </div>
                  )}

                  {/* Resolution Notes */}
                  {selectedTicket.resolutionNotes && (
                    <div className={styles.detailSection}>
                      <div className={styles.detailLabel}>Resolution Notes</div>
                      <div className={`${styles.detailValue} ${styles.detailValuePreWrap}`}>
                        {selectedTicket.resolutionNotes}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                onClick={handleEmailAboutTicket}
              >
                Email About Ticket
              </Button>
              <Button
                variant="primary"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SupportTickets;
