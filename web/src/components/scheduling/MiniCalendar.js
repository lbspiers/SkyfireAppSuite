import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../../styles/Scheduling.module.css';

/**
 * MiniCalendar - Small calendar widget for date navigation
 *
 * Features:
 * - Shows current month
 * - Navigate between months
 * - Highlight current day
 * - Show selected day
 * - Show dots for days with events
 * - Click to jump to date in main calendar
 */
const MiniCalendar = ({
  selectedDate,
  onDateSelect,
  eventsData = [] // Array of event dates to show dots
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Sync with selected date
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  // Get calendar data
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];

    // Add previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const handleDayClick = (dayData) => {
    if (onDateSelect) {
      onDateSelect(dayData.date);
    }
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const hasEvents = (date) => {
    // Check if this date has any events
    return eventsData.some(eventDate => isSameDay(new Date(eventDate), date));
  };

  const isToday = (date) => {
    return isSameDay(date, today);
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return isSameDay(date, selected);
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className={styles.miniCalendar}>
      {/* Header */}
      <div className={styles.miniCalendarHeader}>
        <div className={styles.miniCalendarTitle}>{monthName}</div>
        <div className={styles.miniCalendarNav}>
          <button
            className={styles.miniCalendarNavButton}
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            className={styles.miniCalendarNavButton}
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className={styles.miniCalendarWeekdays}>
        {weekdays.map((day, index) => (
          <div key={index} className={styles.miniCalendarWeekday}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.miniCalendarGrid}>
        {days.map((dayData, index) => {
          const dayIsToday = isToday(dayData.date);
          const dayIsSelected = isSelected(dayData.date);
          const dayHasEvents = hasEvents(dayData.date);

          return (
            <motion.button
              key={index}
              className={`
                ${styles.miniCalendarDay}
                ${!dayData.isCurrentMonth ? styles.miniCalendarDayOtherMonth : ''}
                ${dayIsToday ? styles.miniCalendarDayToday : ''}
                ${dayIsSelected ? styles.miniCalendarDaySelected : ''}
                ${dayHasEvents ? styles.miniCalendarDayHasEvents : ''}
              `}
              onClick={() => handleDayClick(dayData)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={dayData.date.toLocaleDateString()}
            >
              {dayData.day}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
