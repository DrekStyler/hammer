import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import useTranslation from "../utils/useTranslation";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function ProjectCalendar() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("month");
  const [hoveredButton, setHoveredButton] = useState(null);

  // Fetch project events from Firestore
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        setError(null);

        // Query calendar events for the current user
        const calendarEventsRef = collection(db, "calendarEvents");
        const q = query(
          calendarEventsRef,
          where("createdBy", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.start?.toDate() || new Date(data.start),
            end: data.end?.toDate() || new Date(data.end),
            backgroundColor: data.backgroundColor || getStatusColor(data.extendedProps?.status),
            borderColor: data.borderColor || getStatusColor(data.extendedProps?.status),
            extendedProps: {
              description: data.extendedProps?.description,
              client: data.extendedProps?.client,
              status: data.extendedProps?.status,
              projectId: data.projectId
            }
          };
        });

        setEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarEvents();
  }, [currentUser]);

  // Handle event click - navigate to project detail page
  const handleEventClick = (clickInfo) => {
    const projectId = clickInfo.event.extendedProps.projectId;
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  // Handle view change
  const handleViewChange = (viewType) => {
    setView(viewType);
  };

  // Simple function to handle the sync button click
  const handleSyncButtonClick = () => {
    alert(t('calendarSyncNotImplemented') || "Google Calendar sync will be implemented soon!");
  };

  // Function to render custom events
  const renderEventContent = (eventInfo) => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '2px 4px',
        fontSize: '12px',
        lineHeight: '1.2',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
      }}>
        <div style={{ fontWeight: '500' }}>{eventInfo.event.title}</div>
        {eventInfo.view.type === 'dayGridMonth' && eventInfo.event.extendedProps.client && (
          <div style={{ fontSize: '10px', opacity: '0.8' }}>
            {eventInfo.event.extendedProps.client}
          </div>
        )}
      </div>
    );
  };

  // Get color based on status
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'in progress':
      case 'in-progress':
        return '#4285F4'; // Blue
      case 'completed':
      case 'complete':
        return '#34A853'; // Green
      case 'cancelled':
      case 'canceled':
        return '#EA4335'; // Red
      case 'on hold':
      case 'on-hold':
        return '#FBBC05'; // Yellow
      case 'pending':
      case 'open':
        return '#F9AB00'; // Orange
      case 'draft':
        return '#9AA0A6'; // Grey
      default:
        return '#1a73e8'; // Default blue
    }
  };

  // Function to format event time
  const formatEventTime = (event) => {
    const options = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    };
    
    const start = event.start instanceof Date 
      ? event.start.toLocaleTimeString([], options)
      : new Date(event.start).toLocaleTimeString([], options);
    
    if (!event.end) return start;
    
    const end = event.end instanceof Date 
      ? event.end.toLocaleTimeString([], options)
      : new Date(event.end).toLocaleTimeString([], options);
    
    return `${start} - ${end}`;
  };

  // Comprehensive styles object matching Dashboard and Projects components
  const styles = {
    container: {
      padding: '30px',
      width: '90%',
      maxWidth: '1600px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    headerTitle: {
      color: '#333',
      fontSize: '28px',
      fontWeight: '600',
      marginBottom: '24px',
    },
    calendarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
    },
    viewButtons: {
      display: 'flex',
      gap: '10px',
    },
    button: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      backgroundColor: 'white',
      color: '#5f6368',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    buttonActive: {
      backgroundColor: '#1a73e8',
      color: 'white',
      borderColor: '#1a73e8',
    },
    buttonHover: {
      backgroundColor: '#f1f3f4',
      borderColor: '#d2d2d2',
    },
    activeButtonHover: {
      backgroundColor: '#1557b0',
      borderColor: '#1557b0',
    },
    calendarWrapper: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      padding: '20px',
      marginBottom: '24px',
    },
    loadingIndicator: {
      textAlign: 'center',
      padding: '40px',
      color: '#718096',
      fontSize: '18px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    },
    errorMessage: {
      backgroundColor: '#fed7d7',
      color: '#c53030',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '20px',
      fontSize: '14px',
      textAlign: 'center',
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      fontSize: '14px',
      color: '#5f6368',
      marginTop: '16px',
    },
    footerText: {
      margin: 0,
    },
    syncButton: {
      backgroundColor: '#1a73e8',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s',
    },
    syncButtonHover: {
      backgroundColor: '#1557b0',
    },
    calendarCustomStyles: {
      '.fc .fc-button-primary': {
        backgroundColor: '#1a73e8',
        borderColor: '#1a73e8',
      },
      '.fc .fc-button-primary:hover': {
        backgroundColor: '#1557b0',
        borderColor: '#1557b0',
      },
      '.fc .fc-today': {
        backgroundColor: '#e8f0fe',
      },
      '.fc .fc-event': {
        borderRadius: '4px',
        fontSize: '12px',
      },
      '.fc .fc-toolbar': {
        marginBottom: '16px',
      },
      '.fc .fc-toolbar-title': {
        fontSize: '18px',
        fontWeight: '500',
      },
      '.fc .fc-daygrid-day-frame': {
        padding: '2px',
      },
      '.fc .fc-col-header-cell': {
        padding: '8px 0',
        fontSize: '14px',
      },
    },
    // Additional styles for empty states and responsive design
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    },
    emptyStateIcon: {
      fontSize: '48px',
      color: '#9AA0A6',
      marginBottom: '16px',
    },
    emptyStateText: {
      fontSize: '16px',
      color: '#5f6368',
      textAlign: 'center',
      maxWidth: '400px',
      marginBottom: '24px',
    },
    emptyStateButton: {
      backgroundColor: '#1a73e8',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.headerTitle}>{t('projectCalendar')}</h1>
      
      <div style={styles.calendarHeader}>
        <div style={styles.viewButtons}>
          <button
            style={{
              ...styles.button,
              ...(view === "month" ? styles.buttonActive : {}),
              ...(hoveredButton === "month" && view !== "month" ? styles.buttonHover : {}),
              ...(hoveredButton === "month" && view === "month" ? styles.activeButtonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("month")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => handleViewChange("month")}
          >
            {t('monthView')}
          </button>
          <button
            style={{
              ...styles.button,
              ...(view === "weekGrid" ? styles.buttonActive : {}),
              ...(hoveredButton === "week" && view !== "weekGrid" ? styles.buttonHover : {}),
              ...(hoveredButton === "week" && view === "weekGrid" ? styles.activeButtonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("week")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => handleViewChange("weekGrid")}
          >
            {t('weekView')}
          </button>
          <button
            style={{
              ...styles.button,
              ...(view === "dayGrid" ? styles.buttonActive : {}),
              ...(hoveredButton === "day" && view !== "dayGrid" ? styles.buttonHover : {}),
              ...(hoveredButton === "day" && view === "dayGrid" ? styles.activeButtonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("day")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => handleViewChange("dayGrid")}
          >
            {t('dayView')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={styles.loadingIndicator}>
          <p>{t('loadingCalendar')}...</p>
        </div>
      ) : error ? (
        <div style={styles.errorMessage}>
          <p>{t('calendarError')}: {error}</p>
        </div>
      ) : events.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyStateIcon}>
            <i className="far fa-calendar-alt"></i>
          </div>
          <p style={styles.emptyStateText}>
            {t('noEventsYet') || "No calendar events found. Your project events will appear here."}
          </p>
          <button 
            style={{
              ...styles.emptyStateButton,
              ...(hoveredButton === "create" ? styles.syncButtonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("create")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => navigate('/projects')}
          >
            {t('goToProjects') || "Go to Projects"}
          </button>
        </div>
      ) : (
        <div style={styles.calendarWrapper}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view === "month" ? "dayGridMonth" : view === "weekGrid" ? "timeGridWeek" : "timeGridDay"}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            height="auto"
            locale={language === "English" ? "en" : "es"}
            eventBackgroundColor="#1a73e8"
            eventBorderColor="#1557b0"
            eventTextColor="white"
            dayCellClassNames="custom-day-cell"
            themeSystem="standard"
            buttonText={{
              today: 'Today',
              month: 'Month',
              week: 'Week',
              day: 'Day'
            }}
            styleProps={{
              eventContent: {
                fontSize: '12px',
                padding: '2px 4px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              },
              dayHeaderContent: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#5f6368',
                textTransform: 'uppercase'
              },
              dayNumberText: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#3c4043'
              },
              viewContainer: {
                backgroundColor: 'white'
              }
            }}
          />
        </div>
      )}

      <div style={styles.footer}>
        <p style={styles.footerText}>{t('calendarFooter')}</p>
        <button
          style={{
            ...styles.syncButton,
            ...(hoveredButton === "sync" ? styles.syncButtonHover : {})
          }}
          onMouseEnter={() => setHoveredButton("sync")}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={handleSyncButtonClick}
        >
          <i className="fas fa-sync-alt"></i> {t('syncWithGoogle') || "Sync with Google Calendar"}
        </button>
      </div>
    </div>
  );
}

export default ProjectCalendar;