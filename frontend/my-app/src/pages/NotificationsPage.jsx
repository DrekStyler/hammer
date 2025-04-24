import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';

// Comprehensive styles object
const styles = {
  // Container and layout
  notificationsContainer: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  notificationsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '16px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#2d3748',
    margin: 0
  },
  unreadCount: {
    backgroundColor: '#4299e1',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500'
  },

  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0'
  },
  loadingSpinner: {
    color: '#4299e1',
    fontSize: '24px',
    marginBottom: '12px'
  },
  loadingText: {
    color: '#718096',
    fontSize: '16px'
  },

  // Error state
  errorMessage: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },

  // Empty state
  emptyNotifications: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    color: '#718096'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    color: '#a0aec0'
  },
  emptyText: {
    fontSize: '16px',
    margin: 0
  },

  // Notifications list
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    border: '1px solid #e2e8f0'
  },
  notificationItemUnread: {
    backgroundColor: '#ebf8ff',
    borderColor: '#90cdf4'
  },
  notificationContent: {
    display: 'flex',
    gap: '16px',
    flex: 1
  },
  notificationIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e2e8f0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#4a5568',
    fontSize: '18px'
  },
  notificationDetails: {
    flex: 1
  },
  notificationTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '4px'
  },
  notificationMessage: {
    fontSize: '14px',
    color: '#4a5568',
    marginBottom: '8px',
    lineHeight: '1.5'
  },
  notificationMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
    color: '#718096'
  },
  notificationTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  notificationSender: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },

  // Action buttons
  notificationActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '16px'
  },
  actionButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  markReadBtn: {
    color: '#48bb78',
    ':hover': {
      backgroundColor: '#f0fff4'
    }
  },
  deleteBtn: {
    color: '#e53e3e',
    ':hover': {
      backgroundColor: '#fff5f5'
    }
  }
};

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
    <div style={styles.notificationsContainer}>
      <div style={styles.notificationsHeader}>
        <h1 style={styles.headerTitle}>Project Update Notifications</h1>
        {notifications.filter(n => !n.read).length > 0 && (
          <span style={styles.unreadCount}>
            {notifications.filter(n => !n.read).length} unread
          </span>
        )}
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>
            <i className="fas fa-sync-alt fa-spin"></i>
          </div>
          <div style={styles.loadingText}>Loading notifications...</div>
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {!loading && !error && notifications.length === 0 && (
        <div style={styles.emptyNotifications}>
          <i className="fas fa-bell-slash" style={styles.emptyIcon}></i>
          <p style={styles.emptyText}>You don't have any project update notifications.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div style={styles.notificationsList}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                ...styles.notificationItem,
                ...(notification.read ? {} : styles.notificationItemUnread)
              }}
            >
              <div 
                style={styles.notificationContent}
                onClick={() => handleNotificationClick(notification)}
              >
                <div style={styles.notificationIcon}>
                  <i className="fas fa-tools"></i>
                </div>
                <div style={styles.notificationDetails}>
                  <h3 style={styles.notificationTitle}>{notification.title}</h3>
                  <p style={styles.notificationMessage}>{notification.content}</p>
                  <div style={styles.notificationMeta}>
                    <span style={styles.notificationTime}>
                      <i className="fas fa-clock"></i>
                      {formatDate(notification.createdAt)}
                    </span>
                    <span style={styles.notificationSender}>
                      <i className="fas fa-user"></i>
                      {notification.senderName}
                    </span>
                  </div>
                </div>
              </div>
              <div style={styles.notificationActions}>
                {!notification.read && (
                  <button
                    style={{...styles.actionButton, ...styles.markReadBtn}}
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    title="Mark as read"
                  >
                    <i className="fas fa-check"></i>
                  </button>
                )}
                <button
                  style={{...styles.actionButton, ...styles.deleteBtn}}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
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