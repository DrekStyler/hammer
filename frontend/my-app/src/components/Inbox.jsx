import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import useTranslation from '../utils/useTranslation';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { currentUser } = useAuth();
  const { isPrime } = useRole();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = window.location;

  // Check URL parameters for tab selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['all', 'unread', 'bids', 'invitations'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);

      try {
        // Query messages for the current user
        const messagesQuery = query(
          collection(db, 'messages'),
          where('recipientId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(messagesQuery);
        const fetchedMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setMessages(fetchedMessages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUser]);

  // Function to filter messages based on tab and search
  const getFilteredMessages = () => {
    let filtered = [...messages];

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(message => !message.read);
    } else if (activeTab === 'bids') {
      filtered = filtered.filter(message => message.type === 'bid');
    } else if (activeTab === 'invitations') {
      filtered = filtered.filter(message => message.type === 'invitation');
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        message =>
          message.title?.toLowerCase().includes(term) ||
          message.content?.toLowerCase().includes(term) ||
          message.senderName?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // Function to mark a message as read
  const markAsRead = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true,
        updatedAt: Timestamp.now()
      });

      // Update local state
      setMessages(messages.map(message =>
        message.id === messageId
          ? { ...message, read: true }
          : message
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Function to handle message click
  const handleMessageClick = async (message) => {
    // Mark as read if not already
    if (!message.read) {
      await markAsRead(message.id);
    }

    // Navigate based on message type
    if (message.type === 'bid' && message.projectId) {
      navigate(`/project/${message.projectId}`);
    } else if (message.type === 'invitation' && message.projectId) {
      navigate(`/project/${message.projectId}`);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';

    const now = new Date();
    const messageDate = new Date(date);

    // If today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If within last 7 days, show day name
    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'long' });
    }

    // Otherwise show date
    return messageDate.toLocaleDateString();
  };

  const filteredMessages = getFilteredMessages();

  const styles = {
    inboxContainer: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    },
    inboxHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      padding: "0 0 15px 0",
      borderBottom: "1px solid #e0e0e0",
    },
    title: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#202124",
      margin: "0",
    },
    searchContainer: {
      width: "300px",
    },
    searchInput: {
      width: "100%",
      padding: "10px 12px",
      fontSize: "14px",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      outline: "none",
      transition: "border-color 0.2s",
    },
    inboxTabs: {
      display: "flex",
      marginBottom: "20px",
      borderBottom: "1px solid #e0e0e0",
    },
    tabButton: {
      padding: "10px 15px",
      margin: "0 5px 0 0",
      border: "none",
      backgroundColor: "transparent",
      color: "#5f6368",
      fontWeight: "500",
      fontSize: "14px",
      cursor: "pointer",
      position: "relative",
      transition: "color 0.2s",
    },
    activeTab: {
      color: "#1a73e8",
      borderBottom: "3px solid #1a73e8",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1a73e8",
      color: "#ffffff",
      fontSize: "11px",
      fontWeight: "bold",
      height: "18px",
      minWidth: "18px",
      borderRadius: "9px",
      padding: "0 6px",
      marginLeft: "5px",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 0",
    },
    loadingSpinner: {
      fontSize: "30px",
      color: "#1a73e8",
      animation: "spin 1s linear infinite",
      marginBottom: "10px",
    },
    loadingText: {
      color: "#5f6368",
      fontSize: "16px",
    },
    errorMessage: {
      backgroundColor: "#ffebee",
      color: "#d32f2f",
      padding: "12px",
      borderRadius: "4px",
      fontSize: "14px",
      marginBottom: "20px",
    },
    emptyInbox: {
      textAlign: "center",
      padding: "40px 0",
      color: "#5f6368",
      fontSize: "16px",
    },
    messagesList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    messageItem: {
      display: "flex",
      padding: "15px",
      borderRadius: "8px",
      border: "1px solid #e0e0e0",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      transition: "box-shadow 0.2s",
      position: "relative",
    },
    unreadMessage: {
      backgroundColor: "#f5f8ff",
      borderLeft: "4px solid #1a73e8",
    },
    messageIcon: {
      fontSize: "20px",
      color: "#5f6368",
      marginRight: "15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
    },
    messageContent: {
      flex: 1,
    },
    messageHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "5px",
    },
    messageTitle: {
      margin: "0",
      fontSize: "16px",
      fontWeight: "600",
      color: "#202124",
    },
    messageDate: {
      fontSize: "12px",
      color: "#5f6368",
    },
    messageText: {
      margin: "0 0 10px 0",
      fontSize: "14px",
      color: "#5f6368",
      lineHeight: "1.5",
    },
    messageFooter: {
      display: "flex",
      alignItems: "center",
      fontSize: "12px",
      color: "#5f6368",
    },
    senderName: {
      display: "flex",
      alignItems: "center",
      marginRight: "15px",
    },
    messageType: {
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: "500",
    },
    bidType: {
      backgroundColor: "#e8f5e9",
      color: "#2e7d32",
    },
    invitationType: {
      backgroundColor: "#e3f2fd",
      color: "#1565c0",
    },
    unreadIndicator: {
      position: "absolute",
      right: "15px",
      top: "15px",
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      backgroundColor: "#1a73e8",
    },
  };

  return (
    <div style={styles.inboxContainer}>
      <div style={styles.inboxHeader}>
        <h1 style={styles.title}>{t('inbox')}</h1>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder={t('searchMessages')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      <div style={styles.inboxTabs}>
        <button
          style={activeTab === 'all' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('all')}
        >
          {t('all')}
        </button>
        <button
          style={activeTab === 'unread' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('unread')}
        >
          {t('unread')}
          {messages.filter(m => !m.read).length > 0 && (
            <span style={styles.badge}>{messages.filter(m => !m.read).length}</span>
          )}
        </button>
        <button
          style={activeTab === 'invitations' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('invitations')}
        >
          {t('invitations')}
          {messages.filter(m => m.type === 'invitation' && !m.read).length > 0 && (
            <span style={styles.badge}>{messages.filter(m => m.type === 'invitation' && !m.read).length}</span>
          )}
        </button>
        <button
          style={activeTab === 'bids' ? {...styles.tabButton, ...styles.activeTab} : styles.tabButton}
          onClick={() => setActiveTab('bids')}
        >
          {t('bids')}
          {messages.filter(m => m.type === 'bid' && !m.read).length > 0 && (
            <span style={styles.badge}>{messages.filter(m => m.type === 'bid' && !m.read).length}</span>
          )}
        </button>
      </div>

      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>
            <i className="fas fa-wrench"></i>
          </div>
          <div style={styles.loadingText}>{t('loading')}</div>
        </div>
      )}

      {error && <div style={styles.errorMessage}>{error}</div>}

      {!loading && !error && filteredMessages.length === 0 && (
        <div style={styles.emptyInbox}>
          <p>{t('noMessages')}</p>
        </div>
      )}

      {!loading && !error && filteredMessages.length > 0 && (
        <div style={styles.messagesList}>
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              style={!message.read ? {...styles.messageItem, ...styles.unreadMessage} : styles.messageItem}
              onClick={() => handleMessageClick(message)}
            >
              <div style={styles.messageIcon}>
                {message.type === 'bid' ? (
                  <i className="fas fa-comment-dollar"></i>
                ) : message.type === 'invitation' ? (
                  <i className="fas fa-user-plus"></i>
                ) : (
                  <i className="fas fa-envelope"></i>
                )}
              </div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <h3 style={styles.messageTitle}>{message.title}</h3>
                  <span style={styles.messageDate}>{formatDate(message.createdAt)}</span>
                </div>
                <p style={styles.messageText}>{message.content}</p>
                <div style={styles.messageFooter}>
                  <span style={styles.senderName}>
                    <i className="fas fa-user"></i> {message.senderName}
                  </span>
                  {message.type === 'bid' && (
                    <span style={{...styles.messageType, ...styles.bidType}}>
                      <i className="fas fa-gavel"></i> {t('bidNotification')}
                    </span>
                  )}
                  {message.type === 'invitation' && (
                    <span style={{...styles.messageType, ...styles.invitationType}}>
                      <i className="fas fa-project-diagram"></i> {t('projectInvitation')}
                    </span>
                  )}
                </div>
              </div>
              {!message.read && <div style={styles.unreadIndicator}></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;