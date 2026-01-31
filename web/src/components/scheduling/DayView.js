import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/Scheduling.module.css';
import EventCard from './EventCard';

/**
 * DayView - Single day timeline view
 *
 * Features:
 * - Shows single day with time slots from 6am to 10pm
 * - Current time indicator (orange/red line)
 * - Events positioned based on start time and sized by duration
 * - Click empty slot to create new event
 * - Click event to edit
 * - Auto-scroll to current time on mount
 *
 * @param {Date} selectedDate - The date to display
 * @param {Array} events - Array of event objects
 * @param {Function} onEventClick - Handler for event clicks
 * @param {Function} onTimeSlotClick - Handler for empty time slot clicks
 */
const DayView = ({
  selectedDate,
  events = [],
  onEventClick,
  onTimeSlotClick
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const gridRef = useRef(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const now = new Date();
      const currentHour = now.getHours();

      // Only scroll if current time is within working hours
      if (currentHour >= 6 && currentHour <= 22) {
        const hoursSince6am = currentHour - 6;
        const scrollPosition = hoursSince6am * 80; // 80px per hour slot in day view
        gridRef.current.scrollTop = Math.max(0, scrollPosition - 100); // Offset for visibility
      }
    }
  }, [selectedDate]);

  // Working hours: 6am to 10pm
  const HOURS_START = 6;
  const HOURS_END = 22;
  const hours = [];
  for (let hour = HOURS_START; hour <= HOURS_END; hour++) {
    hours.push(hour);
  }

  // Format hour for display
  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    const now = new Date();

    // Only show indicator if viewing today
    if (!isToday(selectedDate)) {
      return null;
    }

    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // If before working hours, show at top edge
    if (currentHour < HOURS_START) {
      return 0;
    }

    // If after working hours, show at bottom edge
    if (currentHour > HOURS_END) {
      const totalHours = HOURS_END - HOURS_START + 1;
      return totalHours * 80 - 2; // -2 to keep it visible
    }

    // Within working hours - calculate exact position
    const hoursSince6am = currentHour - HOURS_START;
    const minuteOffset = (currentMinutes / 60) * 80; // 80px per hour
    const topPosition = (hoursSince6am * 80) + minuteOffset;

    return topPosition;
  };

  // Get events for the selected day
  const getDayEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);

      // Normalize both dates to midnight local time for comparison
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const filterDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

      return eventDateOnly.getTime() === filterDateOnly.getTime();
    });
  };

  // Calculate event position and height
  const getEventStyle = (event) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    const startHour = startDate.getHours();
    const startMinutes = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();

    // Calculate position from 6am
    const hoursSinceStart = startHour - HOURS_START;
    const minuteOffset = (startMinutes / 60) * 80;
    const top = (hoursSinceStart * 80) + minuteOffset;

    // Calculate height based on duration
    const durationHours = endHour - startHour;
    const durationMinutes = endMinutes - startMinutes;
    const totalMinutes = (durationHours * 60) + durationMinutes;
    const height = (totalMinutes / 60) * 80; // 80px per hour

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${Math.max(height, 40)}px`, // Minimum 40px height
      left: '4px',
      right: '4px',
      zIndex: 2
    };
  };

  // Handle time slot click
  const handleTimeSlotClick = (hour) => {
    if (onTimeSlotClick) {
      const clickedDate = new Date(selectedDate);
      clickedDate.setHours(hour, 0, 0, 0);
      onTimeSlotClick(clickedDate);
    }
  };

  const dayEvents = getDayEvents();
  const currentTimePosition = getCurrentTimePosition();
  const isTodayView = isToday(selectedDate);

  return (
    <div className={styles.dayViewContainer}>
      {/* Day Header */}
      <div className={styles.dayViewHeader}>
        <div className={styles.dayViewDateTitle}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        {isTodayView && (
          <div className={styles.dayViewTodayBadge}>
            Today
          </div>
        )}
      </div>

      {/* Day Grid */}
      <div className={styles.dayViewGrid} ref={gridRef}>
        {/* Time Column */}
        <div className={styles.dayTimeColumn}>
          {hours.map((hour) => (
            <div key={hour} className={styles.dayHourSlot}>
              <span className={styles.dayHourLabel}>{formatHour(hour)}</span>
            </div>
          ))}
        </div>

        {/* Event Column */}
        <div className={styles.dayEventColumn}>
          {/* Time Slots */}
          {hours.map((hour) => (
            <div
              key={hour}
              className={`${styles.dayTimeSlot} ${
                isTodayView ? styles.dayTimeSlotToday : ''
              }`}
              onClick={() => handleTimeSlotClick(hour)}
            />
          ))}

          {/* Events */}
          {dayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={onEventClick}
              style={getEventStyle(event)}
              compact={false}
            />
          ))}

          {/* Current Time Indicator */}
          {currentTimePosition !== null && (
            <div
              className={styles.currentTimeIndicator}
              style={{ top: `${currentTimePosition}px` }}
            />
          )}

          {/* Empty State */}
          {dayEvents.length === 0 && (
            <div className={styles.dayViewEmptyState}>
              <div className={styles.emptyStateTitle}>
                No events scheduled
              </div>
              <div className={styles.emptyStateDescription}>
                Click a time slot to create an event
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayView;
