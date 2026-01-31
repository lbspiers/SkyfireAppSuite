import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/Scheduling.module.css';
import { getEventType } from '../../constants/scheduleConstants';
import { getUpcomingEvents } from '../../services/scheduleAPI';

/**
 * UpcomingEvents - Sidebar list of upcoming events
 *
 * Features:
 * - Groups events by: Today, Tomorrow, This Week, Next Week
 * - Shows event type icon, title, time, project name
 * - Limit to 10 events max
 * - "View All" link at bottom
 * - Click event to select that date in calendar
 *
 * @param {Function} onEventClick - Handler when event is clicked
 * @param {Function} onDateSelect - Handler to select date in main calendar
 */
const UpcomingEvents = ({
  onEventClick,
  onDateSelect
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingEvents = async () => {
      setLoading(true);
      try {
        const upcomingEvents = await getUpcomingEvents(10);
        setEvents(upcomingEvents);
      } catch (error) {
        console.error('Error loading upcoming events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingEvents();
  }, []);

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

  // Group events by time period
  const groupEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (6 - now.getDay())); // Saturday

    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    const groups = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: []
    };

    events.forEach(event => {
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
      }
    });

    return groups;
  };

  const groupedEvents = groupEvents();

  const handleEventClick = (event) => {
    // Select the date in the main calendar
    if (onDateSelect) {
      onDateSelect(new Date(event.startTime));
    }

    // Also trigger event click if provided
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const handleViewAll = () => {
    // TODO: Navigate to list view or expand all events
  };

  const renderEventGroup = (title, events) => {
    if (events.length === 0) return null;

    return (
      <div key={title}>
        <div className={styles.upcomingEventDate}>{title}</div>
        {events.map(event => {
          const eventType = getEventType(event.type);

          return (
            <motion.div
              key={event.id}
              className={styles.upcomingEventItem}
              style={{ borderLeftColor: eventType.color }}
              onClick={() => handleEventClick(event)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Dynamic event type color */}
              <span
                className={styles.upcomingEventIcon}
                style={{ backgroundColor: eventType.color }}
                aria-label={eventType.label}
              />
              <div className={styles.upcomingEventDetails}>
                <div className={styles.upcomingEventTitle} title={event.title}>
                  {event.title}
                </div>
                <div className={styles.upcomingEventTime}>
                  {event.allDay ? 'All Day' : formatTime(event.startTime)}
                </div>
                {event.projectName && (
                  <div className={styles.upcomingEventProject} title={event.projectName}>
                    {event.projectName}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.upcomingEventsContainer}>
        <div className={styles.upcomingEventsHeader}>
          <div className={styles.upcomingEventsTitle}>Upcoming</div>
        </div>
        <div className={styles.loadingContainer}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.upcomingEventsContainer}>
        <div className={styles.upcomingEventsHeader}>
          <div className={styles.upcomingEventsTitle}>Upcoming</div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateTitle}>No upcoming events</div>
          <div className={styles.emptyStateDescription}>
            Create an event to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.upcomingEventsContainer}>
      <div className={styles.upcomingEventsHeader}>
        <div className={styles.upcomingEventsTitle}>Upcoming</div>
      </div>

      <div className={styles.upcomingEventsList}>
        {renderEventGroup('Today', groupedEvents.today)}
        {renderEventGroup('Tomorrow', groupedEvents.tomorrow)}
        {renderEventGroup('This Week', groupedEvents.thisWeek)}
        {renderEventGroup('Next Week', groupedEvents.nextWeek)}
      </div>

      {events.length >= 10 && (
        <div className={styles.viewAllLink} onClick={handleViewAll}>
          View All Events →
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
