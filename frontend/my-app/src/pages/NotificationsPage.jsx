import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        // Query messages specific to project updates
        const notificationsQuery = query(
          collection(db, 'messages'),
          where('recipientId', '==', currentUser.uid),
          where('type', '==', 'project_update'),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(notificationsQuery);
        const fetchedNotifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setNotifications(fetchedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';

    const now = new Date();
    const notificationDate = new Date(date);

    // If today, show time
    if (notificationDate.toDateString() === now.toDateString()) {
      return `Today at ${notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // If within last 7 days, show day name
    const diffDays = Math.floor((now - notificationDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return `${notificationDate.toLocaleDateString([], { weekday: 'long' })} at ${notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Otherwise show full date
    return notificationDate.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'messages', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: Timestamp.now()
      });

      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Function to delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'messages', notificationId);
      await deleteDoc(notificationRef);

      // Remove from local state
      setNotifications(notifications.filter(notification => notification.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Function to handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate to project detail page if projectId exists
    if (notification.projectId) {
      navigate(`/project/${notification.projectId}`);
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Project Update Notifications</h1>
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="unread-count">
            {notifications.filter(n => !n.read).length} unread
          </span>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-sync-alt fa-spin"></i>
          </div>
          <div className="loading-text">Loading notifications...</div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty-notifications">
          <i className="fas fa-bell-slash"></i>
          <p>You don't have any project update notifications.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
            >
              <div className="notification-content" onClick={() => handleNotificationClick(notification)}>
                <div className="notification-icon">
                  <i className="fas fa-tools"></i>
                </div>
                <div className="notification-details">
                  <h3 className="notification-title">{notification.title}</h3>
                  <p className="notification-message">{notification.content}</p>
                  <div className="notification-meta">
                    <span className="notification-time">{formatDate(notification.createdAt)}</span>
                    <span className="notification-sender">
                      <i className="fas fa-user"></i> {notification.senderName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="notification-actions">
                {!notification.read && (
                  <button
                    className="mark-read-btn"
                    onClick={() => markAsRead(notification.id)}
                    title="Mark as read"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                )}
                <button
                  className="delete-notification-btn"
                  onClick={() => deleteNotification(notification.id)}
                  title="Delete notification"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;