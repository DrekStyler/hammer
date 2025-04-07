import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import useTranslation from "../utils/useTranslation";
import { useNavigate } from "react-router-dom";
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

  // Fetch project events
  useEffect(() => {
    // Simulated API call to fetch project data
    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      // Sample data - in a real app, this would come from your backend/Firebase
      const sampleEvents = [
        {
          id: "1",
          title: language === "English" ? "Kitchen Renovation" : "Renovación de Cocina",
          start: new Date(new Date().setDate(new Date().getDate() + 2)),
          end: new Date(new Date().setDate(new Date().getDate() + 5)),
          color: "#4285F4", // Google blue
          description: language === "English" ? "Complete kitchen renovation including cabinets and countertops" : "Renovación completa de la cocina, incluyendo gabinetes y encimeras",
          projectId: "pdmh8KGAZd1SiKND5BHy" // Added projectId to link to actual project
        },
        {
          id: "2",
          title: language === "English" ? "Bathroom Remodel" : "Remodelación del Baño",
          start: new Date(new Date().setDate(new Date().getDate() + 8)),
          end: new Date(new Date().setDate(new Date().getDate() + 12)),
          color: "#EA4335", // Google red
          description: language === "English" ? "Full bathroom remodel with new fixtures" : "Remodelación completa del baño con nuevos accesorios",
          projectId: "K29fJ8LmNpQ7rZxS3aTy" // Added projectId to link to actual project
        },
        {
          id: "3",
          title: language === "English" ? "Deck Construction" : "Construcción de Terraza",
          start: new Date(new Date().setDate(new Date().getDate() - 3)),
          end: new Date(new Date().setDate(new Date().getDate() - 1)),
          color: "#34A853", // Google green
          description: language === "English" ? "Build new deck with composite materials" : "Construir nueva terraza con materiales compuestos",
          projectId: "R67dL9PqVs2TbXc8HgEw" // Added projectId to link to actual project
        },
        {
          id: "4",
          title: language === "English" ? "Interior Painting" : "Pintura Interior",
          start: new Date(new Date().setDate(new Date().getDate() + 15)),
          end: new Date(new Date().setDate(new Date().getDate() + 17)),
          color: "#FBBC05", // Google yellow
          description: language === "English" ? "Paint living room and bedrooms" : "Pintar sala de estar y dormitorios",
          projectId: "Z84mF3VtWx5YbJs6CrUi" // Added projectId to link to actual project
        }
      ];

      setEvents(sampleEvents);
      setIsLoading(false);
    }, 1000);
  }, [language]);

  // Handle event click - now navigate to project detail page
  const handleEventClick = (clickInfo) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event && event.projectId) {
      navigate(`/project/${event.projectId}`);
    } else {
      // Fallback if no projectId is available
      alert(`${clickInfo.event.title}\n${event.description}\n${t('dateRange')}: ${clickInfo.event.start.toLocaleDateString()} - ${clickInfo.event.end.toLocaleDateString()}`);
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