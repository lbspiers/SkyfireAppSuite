import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VIEW_TYPES } from '../../constants/scheduleConstants';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import ListView from './ListView';
import styles from '../../styles/Scheduling.module.css';

/**
 * ScheduleCalendar - Wrapper component for calendar views
 *
 * Handles view switching logic between Day, Week, Month, and List views
 *
 * @param {string} currentView - Active view type (day/week/month/list)
 * @param {Date} selectedDate - Currently selected date
 * @param {Array} events - Events to display
 * @param {Function} onEventClick - Event click handler
 * @param {Function} onTimeSlotClick - Time slot click handler
 * @param {Function} onDateSelect - Date selection handler (for MonthView navigation)
 * @param {boolean} loading - Loading state
 */
const ScheduleCalendar = ({
  currentView = VIEW_TYPES.WEEK,
  selectedDate,
  events = [],
  onEventClick,
  onTimeSlotClick,
  onDateSelect,
  loading = false
}) => {

  // Render the appropriate view based on currentView
  const renderView = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing)' }}>⏳</div>
          <div>Loading events...</div>
        </div>
      );
    }

    switch (currentView) {
      case VIEW_TYPES.DAY:
        return (
          <DayView
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
            onTimeSlotClick={onTimeSlotClick}
          />
        );

      case VIEW_TYPES.WEEK:
        return (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
            onTimeSlotClick={onTimeSlotClick}
          />
        );

      case VIEW_TYPES.MONTH:
        return (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            onEventClick={onEventClick}
            onDateSelect={onDateSelect}
          />
        );

      case VIEW_TYPES.LIST:
        return (
          <ListView
            events={events}
            onEventClick={onEventClick}
          />
        );

      default:
        return (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>❓</div>
            <div className={styles.emptyStateTitle}>Unknown View</div>
            <div className={styles.emptyStateDescription}>
              The selected view type is not recognized
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        style={{ flex: 1, overflow: 'hidden', display: 'flex' }}
      >
        {renderView()}
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleCalendar;
