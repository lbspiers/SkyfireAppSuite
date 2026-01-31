import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Scheduling.module.css';
import { getEventType, EVENT_TYPES, EVENT_STATUS } from '../../constants/scheduleConstants';

/**
 * ListView - Agenda-style list grouped by date
 *
 * Features:
 * - Events grouped by date with date headers
 * - "Today", "Tomorrow", "This Week", "Next Week", "Later" sections
 * - Each event shows: type icon/color, title, time range, location, project name
 * - Click event to open modal
 * - Empty state when no events
 * - Filter pills at top: All, Site Surveys, Installations, etc.
 * - Status filter: Scheduled, In Progress, Completed
 *
 * @param {Array} events - Array of event objects
 * @param {Function} onEventClick - Handler for event clicks
 */
const ListView = ({
  events = [],
  onEventClick
}) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter events
  const getFilteredEvents = () => {
    let filtered = [...events];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Sort by start time
    filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return filtered;
  };

  // Group events by time period
  const groupEventsByPeriod = () => {
    const filtered = getFilteredEvents();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(now);
    const daysUntilSaturday = 6 - now.getDay();
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilSaturday);

    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    const groups = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: []
    };

    filtered.forEach(event => {
      const eventDate = new Date(event.startTime);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate.getTime() === now.getTime()) {
        groups.today.push(event);
      } else if (eventDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(event);
      } else if (eventDate > tomorrow && eventDate <= endOfWeek) {
        groups.thisWeek.push(event);
      } else if (eventDate > endOfWeek && eventDate <= endOfNextWeek) {
        groups.nextWeek.push(event);
      } else if (eventDate > endOfNextWeek) {
        groups.later.push(event);
      }
    });

    return groups;
  };

  const groupedEvents = groupEventsByPeriod();

  // Format time for display
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle event click
  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Render event item
  const renderEventItem = (event) => {
    const eventType = getEventType(event.type);

    return (
      <motion.div
        key={event.id}
        className={styles.listEventItem}
        onClick={() => handleEventClick(event)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, backgroundColor: 'var(--color-hover)' }}
        transition={{ duration: 0.15 }}
      >
        {/* Event Type Color Bar */}
        <div
          className={styles.listEventColorBar}
          style={{ backgroundColor: eventType.color }}
        />

        {/* Event Content */}
        <div className={styles.listEventContent}>
          {/* Main Info */}
          <div className={styles.listEventMain}>
            <div className={styles.listEventHeader}>
              <span
                className={styles.listEventIcon}
                style={{ backgroundColor: eventType.color }}
              />
              <h3 className={styles.listEventTitle}>{event.title}</h3>
            </div>

            {/* Time and Date */}
            <div className={styles.listEventTime}>
              {event.allDay ? (
                <span>All Day • {formatDate(event.startTime)}</span>
              ) : (
                <span>
                  {formatTime(event.startTime)} - {formatTime(event.endTime)} • {formatDate(event.startTime)}
                </span>
              )}
            </div>

            {/* Meta Information */}
            <div className={styles.listEventMeta}>
              {event.projectName && (
                <span className={styles.listEventMetaItem}>
                  <span className={styles.listEventMetaLabel}>Project:</span> {event.projectName}
                </span>
              )}
              {event.location && (
                <span className={styles.listEventMetaItem}>
                  <span className={styles.listEventMetaLabel}>Location:</span> {event.location}
                </span>
              )}
              {event.assignedNames && event.assignedNames.length > 0 && (
                <span className={styles.listEventMetaItem}>
                  <span className={styles.listEventMetaLabel}>Assigned:</span>{' '}
                  {event.assignedNames.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          {event.status && (
            <div className={styles.listEventStatus}>
              <span className={`${styles.statusBadge} ${styles[`statusBadge--${event.status}`]}`}>
                {event.status.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render event group
  const renderEventGroup = (title, events) => {
    if (events.length === 0) return null;

    return (
      <div key={title} className={styles.listEventGroup}>
        <h2 className={styles.listGroupTitle}>{title}</h2>
        <div className={styles.listGroupEvents}>
          {events.map(renderEventItem)}
        </div>
      </div>
    );
  };

  // Check if any events match filters
  const hasFilteredEvents = getFilteredEvents().length > 0;

  return (
    <div className={styles.listViewContainer}>
      {/* Filters */}
      <div className={styles.listViewFilters}>
        {/* Type Filters */}
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Event Type</div>
          <div className={styles.filterChips}>
            <button
              className={`${styles.filterChip} ${typeFilter === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All Events
            </button>
            {EVENT_TYPES.slice(0, 5).map((type) => (
              <button
                key={type.id}
                className={`${styles.filterChip} ${typeFilter === type.id ? styles.filterChipActive : ''}`}
                onClick={() => setTypeFilter(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Status</div>
          <div className={styles.filterChips}>
            <button
              className={`${styles.filterChip} ${statusFilter === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Status
            </button>
            <button
              className={`${styles.filterChip} ${statusFilter === EVENT_STATUS.SCHEDULED ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(EVENT_STATUS.SCHEDULED)}
            >
              Scheduled
            </button>
            <button
              className={`${styles.filterChip} ${statusFilter === EVENT_STATUS.IN_PROGRESS ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(EVENT_STATUS.IN_PROGRESS)}
            >
              In Progress
            </button>
            <button
              className={`${styles.filterChip} ${statusFilter === EVENT_STATUS.COMPLETED ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(EVENT_STATUS.COMPLETED)}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Event Groups */}
      <AnimatePresence mode="wait">
        {hasFilteredEvents ? (
          <motion.div
            className={styles.listViewEvents}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderEventGroup('Today', groupedEvents.today)}
            {renderEventGroup('Tomorrow', groupedEvents.tomorrow)}
            {renderEventGroup('This Week', groupedEvents.thisWeek)}
            {renderEventGroup('Next Week', groupedEvents.nextWeek)}
            {renderEventGroup('Later', groupedEvents.later)}
          </motion.div>
        ) : (
          <motion.div
            className={styles.listViewEmptyState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.emptyStateTitle}>
              No events found
            </div>
            <div className={styles.emptyStateDescription}>
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create an event to get started'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListView;
