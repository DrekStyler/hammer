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
import "./ProjectCalendar.css";

function ProjectCalendar() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("month");

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
            backgroundColor: data.backgroundColor,
            borderColor: data.borderColor,
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

  return (
    <div className="project-calendar-container">
      <div className="calendar-header">
        <h2>{t('projectCalendar')}</h2>
        <div className="view-buttons">
          <button
            className={view === "month" ? "active" : ""}
            onClick={() => handleViewChange("month")}
          >
            {t('monthView')}
          </button>
          <button
            className={view === "week" ? "active" : ""}
            onClick={() => handleViewChange("weekGrid")}
          >
            {t('weekView')}
          </button>
          <button
            className={view === "day" ? "active" : ""}
            onClick={() => handleViewChange("dayGrid")}
          >
            {t('dayView')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-indicator">
          <p>{t('loadingCalendar')}...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{t('calendarError')}: {error}</p>
        </div>
      ) : (
        <div className="calendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view === "month" ? "dayGridMonth" : view === "week" ? "timeGridWeek" : "timeGridDay"}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            eventClick={handleEventClick}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: 'short'
            }}
            height="auto"
            locale={language === "English" ? "en" : "es"}
          />
        </div>
      )}

      <div className="calendar-footer">
        <p>{t('calendarFooter')}</p>
        <button
          className="sync-button"
          onClick={handleSyncButtonClick}
        >
          <i className="fas fa-sync-alt"></i> {t('syncWithGoogle') || "Sync with Google Calendar"}
        </button>
      </div>
    </div>
  );
}

export default ProjectCalendar;