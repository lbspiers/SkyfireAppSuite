import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/Scheduling.module.css';
import { getEventType } from '../../constants/scheduleConstants';

/**
 * EventCard - Individual event display within calendar
 *
 * Features:
 * - Left border color indicates event type
 * - Compact view: time, title, icon
 * - Hover shows more details
 * - Different sizes based on duration
 * - Click to open event details
 *
 * @param {Object} event - Event data object
 * @param {Function} onClick - Click handler
 * @param {Object} style - Additional inline styles for positioning
 * @param {Boolean} compact - Use compact layout for short events
 */
const EventCard = ({
  event,
  onClick,
  style = {},
  compact = false
}) => {
  if (!event) return null;

  const eventType = getEventType(event.type);

  // Format time display
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const startTime = formatTime(event.startTime);
  const endTime = formatTime(event.endTime);

  // Handle click
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <motion.div
      className={`${styles.eventCard} ${compact ? styles.eventCardCompact : ''}`}
      style={{
        ...style,
        borderLeftColor: eventType.color,
      }}
      onClick={handleClick}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
    >
      {/* Event Header */}
      <div className={styles.eventHeader}>
        {/* Dynamic event type color */}
        <span
          className={styles.eventIcon}
          style={{ backgroundColor: eventType.color }}
          aria-label={eventType.label}
        />
        <div className={styles.eventTitle} title={event.title}>
          {event.title}
        </div>
      </div>

      {/* Event Time */}
      <div className={styles.eventTime}>
        {event.allDay ? 'All Day' : `${startTime} - ${endTime}`}
      </div>

      {/* Event Meta (only show if not compact) */}
      {!compact && event.projectName && (
        <div className={styles.eventMeta} title={event.projectName}>
          {event.projectName}
        </div>
      )}

      {!compact && event.location && (
        <div className={styles.eventMeta} title={event.location}>
          {event.location}
        </div>
      )}
    </motion.div>
  );
};

export default EventCard;
