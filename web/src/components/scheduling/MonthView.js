import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/Scheduling.module.css';
import { getEventType } from '../../constants/scheduleConstants';

/**
 * MonthView - Full month grid calendar (Google Calendar style)
 *
 * Features:
 * - 7 column grid (Sun-Sat)
 * - 5-6 rows depending on month
 * - Show day number in each cell
 * - Show up to 3 events per day, then "+N more" link
 * - Click day to navigate to that day
 * - Click event to open event modal
 * - Highlight today and selected date
 * - Previous/current/next month days in lighter color
 *
 * @param {Date} selectedDate - Currently selected date (determines which month to show)
 * @param {Array} events - Array of event objects
 * @param {Function} onEventClick - Handler for event clicks
 * @param {Function} onDateSelect - Handler for date selection (navigate to day view)
 */
const MonthView = ({
  selectedDate,
  events = [],
  onEventClick,
  onDateSelect
}) => {
  // Get all dates to display in the month grid (including prev/next month overflow)
  const getMonthDates = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();

    // Calculate dates
    const dates = [];

    // Previous month's days (if first day is not Sunday)
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      dates.push({ date, isCurrentMonth: false });
    }

    // Current month's days
    for (let day = 1; day <= lastDate; day++) {
      const date = new Date(year, month, day);
      dates.push({ date, isCurrentMonth: true });
    }

    // Next month's days (to fill the grid to 6 weeks = 42 days)
    const remainingDays = 42 - dates.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      dates.push({ date, isCurrentMonth: false });
    }

    return dates;
  };

  const monthDates = getMonthDates(selectedDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Check if date is the selected date
  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // Get events for a specific day
  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);

      // Normalize both dates to midnight local time for comparison
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const filterDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      return eventDateOnly.getTime() === filterDateOnly.getTime();
    }).sort((a, b) => {
      // Sort by start time
      return new Date(a.startTime) - new Date(b.startTime);
    });
  };

  // Handle day cell click
  const handleDayClick = (date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Handle event click
  const handleEventClick = (e, event) => {
    e.stopPropagation();
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Format time for event display
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes}${ampm}`;
  };

  return (
    <div className={styles.monthViewContainer}>
      {/* Weekday Header */}
      <div className={styles.monthViewHeader}>
        {weekDays.map((day) => (
          <div key={day} className={styles.monthViewWeekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className={styles.monthViewGrid}>
        {monthDates.map(({ date, isCurrentMonth }, index) => {
          const dayEvents = getEventsForDay(date);
          const maxVisibleEvents = 3;
          const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
          const remainingCount = dayEvents.length - maxVisibleEvents;

          return (
            <motion.div
              key={index}
              className={`${styles.monthDayCell} ${
                !isCurrentMonth ? styles.monthDayCellOtherMonth : ''
              } ${isToday(date) ? styles.monthDayCellToday : ''} ${
                isSelected(date) ? styles.monthDayCellSelected : ''
              }`}
              onClick={() => handleDayClick(date)}
              whileHover={{ backgroundColor: 'var(--color-hover)' }}
              transition={{ duration: 0.15 }}
            >
              {/* Day Number */}
              <div className={styles.monthDayNumber}>
                {date.getDate()}
              </div>

              {/* Events */}
              <div className={styles.monthDayEvents}>
                {visibleEvents.map((event) => {
                  const eventType = getEventType(event.type);

                  return (
                    <motion.div
                      key={event.id}
                      className={styles.monthEventItem}
                      onClick={(e) => handleEventClick(e, event)}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.1 }}
                    >
                      <span
                        className={styles.monthEventDot}
                        style={{ backgroundColor: eventType.color }}
                      />
                      <span className={styles.monthEventTitle}>
                        {event.allDay ? event.title : `${formatTime(event.startTime)} ${event.title}`}
                      </span>
                    </motion.div>
                  );
                })}

                {/* Show "+N more" if there are more events */}
                {remainingCount > 0 && (
                  <div className={styles.monthEventMore}>
                    +{remainingCount} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
