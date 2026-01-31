import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/Scheduling.module.css';
import EventCard from './EventCard';

/**
 * WeekView - Week calendar view with time slots
 *
 * Features:
 * - Shows 7 days (Sunday - Saturday)
 * - Time slots from 6am to 8pm (working hours)
 * - Current time indicator (orange/red line)
 * - Events positioned based on start time and sized by duration
 * - Click empty slot to create new event
 * - Click event to edit
 *
 * @param {Date} selectedDate - Currently selected date (determines which week to show)
 * @param {Array} events - Array of event objects
 * @param {Function} onEventClick - Handler for event clicks
 * @param {Function} onTimeSlotClick - Handler for empty time slot clicks
 */
const WeekView = ({
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
      if (currentHour >= 6 && currentHour <= 20) {
        const hoursSince6am = currentHour - 6;
        const scrollPosition = hoursSince6am * 60; // 60px per hour slot
        gridRef.current.scrollTop = scrollPosition;
      }
    }
  }, []);

  // Get week start (Sunday) and end (Saturday)
  const getWeekDates = (date) => {
    const current = new Date(date);
    const dayOfWeek = current.getDay(); // 0 = Sunday
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const weekDates = getWeekDates(selectedDate);

  // Working hours: 6am to 8pm
  const HOURS_START = 6;
  const HOURS_END = 20;
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
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // If before working hours, show at top edge
    if (currentHour < HOURS_START) {
      return 0;
    }

    // If after working hours, show at bottom edge
    if (currentHour > HOURS_END) {
      const totalHours = HOURS_END - HOURS_START + 1;
      return totalHours * 60 - 2; // -2 to keep it visible
    }

    // Within working hours - calculate exact position
    const hoursSince6am = currentHour - HOURS_START;
    const minuteOffset = (currentMinutes / 60) * 60; // 60px per hour
    const topPosition = (hoursSince6am * 60) + minuteOffset;

    return topPosition;
  };

  // Get events for a specific day
  const getEventsForDay = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);

      // Normalize both dates to midnight local time for comparison
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const filterDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

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
    const minuteOffset = (startMinutes / 60) * 60;
    const top = (hoursSinceStart * 60) + minuteOffset;

    // Calculate height based on duration
    const durationHours = endHour - startHour;
    const durationMinutes = endMinutes - startMinutes;
    const totalMinutes = (durationHours * 60) + durationMinutes;
    const height = (totalMinutes / 60) * 60; // 60px per hour

    return {
      position: 'absolute',
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`, // Minimum 30px height
      left: '2px',
      right: '2px',
      zIndex: 2
    };
  };

  // Handle time slot click
  const handleTimeSlotClick = (date, hour) => {
    if (onTimeSlotClick) {
      const clickedDate = new Date(date);
      clickedDate.setHours(hour, 0, 0, 0);
      onTimeSlotClick(clickedDate);
    }
  };

  const currentTimePosition = getCurrentTimePosition();

  // Check if there are any events for the current week
  const hasEvents = weekDates.some(date => getEventsForDay(date).length > 0);

  return (
    <div className={styles.weekViewContainer}>
      {/* Week Header */}
      <div className={styles.weekViewHeader}>
        <div className={styles.weekViewTimeLabel}>Time</div>
        {weekDates.map((date, index) => (
          <div
            key={index}
            className={`${styles.weekViewDayHeader} ${
              isToday(date) ? styles.weekViewDayHeaderToday : ''
            }`}
          >
            <div className={styles.weekViewDayName}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={styles.weekViewDayDate}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className={styles.weekViewGrid} ref={gridRef}>
        {/* Time Column */}
        <div className={styles.timeColumn}>
          {hours.map((hour, index) => (
            <div key={hour} className={styles.hourSlot}>
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {weekDates.map((date, dayIndex) => {
          const dayEvents = getEventsForDay(date);
          const isTodayColumn = isToday(date);

          return (
            <div key={dayIndex} className={styles.dayColumn}>
              {/* Time Slots */}
              {hours.map((hour, hourIndex) => (
                <div
                  key={hour}
                  className={`${styles.timeSlot} ${
                    isTodayColumn ? styles.timeSlotToday : ''
                  }`}
                  onClick={() => handleTimeSlotClick(date, hour)}
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
            </div>
          );
        })}

        {/* Current Time Indicator */}
        {currentTimePosition !== null && (
          <div
            className={styles.currentTimeIndicator}
            style={{ top: `${currentTimePosition}px` }}
          />
        )}

        {/* Empty State Overlay */}
        {!hasEvents && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--spacing-xs)' }}>
              No events this week
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-disabled)' }}>
              Click a time slot to create your first event
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekView;
