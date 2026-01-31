import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import styles from '../styles/Scheduling.module.css';
import dashboardStyles from '../styles/Dashboard.module.css';
import { VIEW_TYPES } from '../constants/scheduleConstants';
import MiniCalendar from '../components/scheduling/MiniCalendar';
import UpcomingEvents from '../components/scheduling/UpcomingEvents';
import ScheduleCalendar from '../components/scheduling/ScheduleCalendar';
import EventModal from '../components/scheduling/EventModal';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/scheduleAPI';
import { useSocket } from '../hooks/useSocket';

/**
 * SchedulingPortal - Main scheduling page
 *
 * Layout:
 * - Header with title and "New Event" button
 * - View tabs (Day, Week, Month, List)
 * - Split layout: Sidebar (30%) | Calendar (70%)
 * - Sidebar contains: Mini calendar, Filters, Upcoming events
 * - Main content shows the selected calendar view
 */
const SchedulingPortal = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [currentView, setCurrentView] = useState(VIEW_TYPES.WEEK);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialEventDate, setInitialEventDate] = useState(null);

  // View tabs configuration
  const viewTabs = [
    { id: VIEW_TYPES.DAY, label: 'Day' },
    { id: VIEW_TYPES.WEEK, label: 'Week' },
    { id: VIEW_TYPES.MONTH, label: 'Month' },
    { id: VIEW_TYPES.LIST, label: 'List' },
  ];

  const handleNewEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleSaveEvent = async (eventData, eventId = null) => {
    try {
      if (eventId) {
        // Update existing event
        await updateEvent(eventId, eventData);
      } else {
        // Create new event
        await createEvent(eventData);
      }

      // Reload events
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - 14);
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 14);
      const fetchedEvents = await getEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
      setEvents(fetchedEvents);

      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);

      // Reload events
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - 14);
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 14);
      const fetchedEvents = await getEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
      setEvents(fetchedEvents);

      handleCloseModal();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event. Please try again.', {
        position: 'top-center',
        autoClose: 5000,
      });
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotClick = (dateTime) => {
    setInitialEventDate(dateTime);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Load events when date range changes
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      try {
        // Get start and end of current week/month based on view
        const start = new Date(selectedDate);
        start.setDate(start.getDate() - 14); // 2 weeks before
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 14); // 2 weeks after

        const fetchedEvents = await getEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate]);

  // Real-time socket listeners for schedule updates
  useEffect(() => {
    if (!socket) {
      console.log('[Schedule] Socket not available yet');
      return;
    }

    // Get user data to join company room
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const companyId = userData?.company_id || userData?.companyId;

    if (!companyId) {
      console.log('[Schedule] No companyId found, skipping socket listeners');
      return;
    }

    console.log('[Schedule] Setting up real-time listeners for company:', companyId);

    // Join company room for schedule updates
    socket.emit('join:company', { companyId });

    // Listen for real-time schedule updates
    const handleEventCreated = (newEvent) => {
      console.log('[Schedule] Real-time: Event created', newEvent);
      setEvents(prev => {
        // Check if event already exists to avoid duplicates
        const exists = prev.some(e => e.uuid === newEvent.uuid || e.id === newEvent.id);
        if (exists) {
          console.log('[Schedule] Event already exists, skipping duplicate');
          return prev;
        }
        return [...prev, newEvent];
      });
      toast.success('New event added to schedule', {
        position: 'bottom-right',
        autoClose: 3000,
      });
    };

    const handleEventUpdated = (updatedEvent) => {
      console.log('[Schedule] Real-time: Event updated', updatedEvent);
      setEvents(prev => prev.map(e =>
        (e.uuid === updatedEvent.uuid || e.id === updatedEvent.id) ? updatedEvent : e
      ));
      toast.info('Event updated', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    };

    const handleEventDeleted = ({ uuid, id }) => {
      console.log('[Schedule] Real-time: Event deleted', uuid || id);
      setEvents(prev => prev.filter(e => e.uuid !== uuid && e.id !== id));
      toast.info('Event removed from schedule', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    };

    socket.on('schedule:event:created', handleEventCreated);
    socket.on('schedule:event:updated', handleEventUpdated);
    socket.on('schedule:event:deleted', handleEventDeleted);

    return () => {
      console.log('[Schedule] Cleaning up real-time listeners');
      socket.off('schedule:event:created', handleEventCreated);
      socket.off('schedule:event:updated', handleEventUpdated);
      socket.off('schedule:event:deleted', handleEventDeleted);
    };
  }, [socket]);

  // Get event dates for mini calendar dots
  const eventDates = events.map(event => event.startTime);

  return (
    <div className={styles.schedulingContainer}>
      {/* ===== HEADER ===== */}
      <div className={dashboardStyles.dashboardHeader}>
        <div>
          <h1 className={dashboardStyles.dashboardTitle}>
            Schedule
          </h1>
        </div>

        <nav className={dashboardStyles.topNav}>
          <button className={styles.newEventButton} onClick={handleNewEvent}>
            <span className={styles.newEventButtonIcon}>+</span>
            New Event
          </button>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              // Already on scheduling page
            }}
            className={`${dashboardStyles.navLink} ${dashboardStyles.navLinkActive}`}
          >
            Scheduling
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            className={dashboardStyles.navLink}
          >
            Projects
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            className={dashboardStyles.flameIconLink}
          >
            <img
              src={require('../assets/images/appIcon.png')}
              alt="Skyfire"
              className={dashboardStyles.flameIcon}
            />
          </a>
        </nav>
      </div>

      {/* ===== VIEW TABS (File Folder Style) ===== */}
      <div className={styles.viewTabsWrapper}>
        {/* Tabs Navigation */}
        <div className={styles.viewTabsContainer}>
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.viewTab} ${
                currentView === tab.id ? styles.viewTabSelected : ''
              }`}
              onClick={() => setCurrentView(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div
          className={`${styles.scheduleContentPanel} ${
            currentView === viewTabs[0].id
              ? styles.scheduleContentPanelFirstTab
              : currentView === viewTabs[viewTabs.length - 1].id
              ? styles.scheduleContentPanelLastTab
              : styles.scheduleContentPanelMiddleTab
          }`}
        >
          {/* ===== SPLIT LAYOUT ===== */}
          <div className={styles.schedulingSplitLayout}>
            {/* LEFT SIDEBAR (30%) */}
            <aside className={styles.schedulingSidebar}>
              {/* Mini Calendar */}
              <div>
                <MiniCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  eventsData={eventDates}
                />
              </div>

              {/* Filters Section */}
              <div>
                <h3 className={styles.filtersHeader}>
                  Filters
                </h3>
                <div className={styles.filtersContainer}>
                  <button className={`${styles.filterChip} ${styles.filterChipActive}`}>
                    All Events
                  </button>
                  <button className={styles.filterChip}>
                    Installations
                  </button>
                  <button className={styles.filterChip}>
                    Inspections
                  </button>
                  <button className={styles.filterChip}>
                    Sales
                  </button>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className={styles.upcomingEventsWrapper}>
                <UpcomingEvents
                  onEventClick={handleEventClick}
                  onDateSelect={handleDateSelect}
                />
              </div>
            </aside>

            {/* MAIN CONTENT (70%) - Calendar */}
            <main className={styles.scheduleMainContent}>
              <div className={styles.calendarContainer}>
                {/* Calendar Header */}
                <div className={styles.calendarHeader}>
                  <div className={styles.calendarHeaderTitle}>
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className={styles.calendarNavigation}>
                    <button
                      className={styles.calendarNavButton}
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() - 7);
                        setSelectedDate(newDate);
                      }}
                    >
                      ← Prev
                    </button>
                    <button
                      className={styles.todayButton}
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Today
                    </button>
                    <button
                      className={styles.calendarNavButton}
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() + 7);
                        setSelectedDate(newDate);
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Calendar View Content */}
                <ScheduleCalendar
                  currentView={currentView}
                  selectedDate={selectedDate}
                  events={events}
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onDateSelect={handleDateSelect}
                  loading={loading}
                />
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* ===== EVENT MODAL ===== */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            className={styles.eventModalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className={styles.eventModal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <EventModal
                event={selectedEvent}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                onClose={handleCloseModal}
                initialDate={initialEventDate}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchedulingPortal;
