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
import { gapi } from 'gapi-script';

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
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

  // Initialize Google Calendar API
  useEffect(() => {
    const initGoogleCalendar = async () => {
      try {
        await gapi.load('client:auth2', () => {
          gapi.client.init({
            apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar.readonly'
          });
        });
      } catch (err) {
        console.error('Error initializing Google Calendar:', err);
      }
    };

    initGoogleCalendar();
  }, []);

  // Fetch project events from Firestore
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        setError(null);

        // Query projects for the current user
        const projectsRef = collection(db, "projects");
        const q = query(
          projectsRef,
          where("createdBy", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const projectEvents = [];

        querySnapshot.docs.forEach(doc => {
          const project = doc.data();
          
          // Add project start date as an event
          if (project.startDate) {
            projectEvents.push({
              id: `${doc.id}-start`,
              title: `Start: ${project.title}`,
              start: project.startDate.toDate(),
              backgroundColor: '#4285F4',
              borderColor: '#4285F4',
              extendedProps: {
                type: 'project_start',
                projectId: doc.id,
                description: project.description,
                client: project.clientName
              }
            });
          }

          // Add project end date as an event
          if (project.endDate) {
            projectEvents.push({
              id: `${doc.id}-end`,
              title: `End: ${project.title}`,
              start: project.endDate.toDate(),
              backgroundColor: '#34A853',
              borderColor: '#34A853',
              extendedProps: {
                type: 'project_end',
                projectId: doc.id,
                description: project.description,
                client: project.clientName
              }
            });
          }

          // Add milestones as events
          if (project.milestones && Array.isArray(project.milestones)) {
            project.milestones.forEach((milestone, index) => {
              if (milestone.date) {
                projectEvents.push({
                  id: `${doc.id}-milestone-${index}`,
                  title: `${project.title}: ${milestone.title}`,
                  start: milestone.date.toDate(),
                  backgroundColor: '#FBBC05',
                  borderColor: '#FBBC05',
                  extendedProps: {
                    type: 'milestone',
                    projectId: doc.id,
                    description: milestone.description,
                    client: project.clientName
                  }
                });
              }
            });
          }
        });

        setEvents(projectEvents);
      } catch (err) {
        console.error("Error fetching calendar events:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarEvents();
  }, [currentUser]);

  // Handle Google Calendar sync
  const handleSyncCalendar = async () => {
    try {
      if (!gapi.auth2) {
        throw new Error('Google API not initialized');
      }

      const googleAuth = gapi.auth2.getAuthInstance();
      const googleUser = await googleAuth.signIn();
      const token = googleUser.getAuthResponse().access_token;

      // Fetch events from Google Calendar
      const response = await gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 100,
        'orderBy': 'startTime'
      });

      const googleEvents = response.result.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        backgroundColor: '#9AA0A6',
        borderColor: '#9AA0A6',
        extendedProps: {
          type: 'google_calendar',
          description: event.description,
          location: event.location
        }
      }));

      // Combine project events with Google Calendar events
      setEvents(prevEvents => [...prevEvents, ...googleEvents]);
      setIsGoogleCalendarConnected(true);
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      setError('Failed to sync with Google Calendar. Please try again.');
    }
  };

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
            initialView="dayGridMonth"
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
          />
        </div>
      )}
    </div>
  );
}

export default ProjectCalendar;