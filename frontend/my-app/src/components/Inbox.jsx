import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import useTranslation from '../utils/useTranslation';
import './Inbox.css';

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

  return (
    <div className="inbox-container">
      <div className="inbox-header">
        <h1>{t('inbox')}</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder={t('searchMessages')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="inbox-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {t('all')}
        </button>
        <button
          className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          {t('unread')}
          {messages.filter(m => !m.read).length > 0 && (
            <span className="badge">{messages.filter(m => !m.read).length}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('invitations')}
        >
          {t('invitations')}
          {messages.filter(m => m.type === 'invitation' && !m.read).length > 0 && (
            <span className="badge">{messages.filter(m => m.type === 'invitation' && !m.read).length}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'bids' ? 'active' : ''}`}
          onClick={() => setActiveTab('bids')}
        >
          {t('bids')}
          {messages.filter(m => m.type === 'bid' && !m.read).length > 0 && (
            <span className="badge">{messages.filter(m => m.type === 'bid' && !m.read).length}</span>
          )}
        </button>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-wrench"></i>
          </div>
          <div className="loading-text">{t('loading')}</div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && filteredMessages.length === 0 && (
        <div className="empty-inbox">
          <p>{t('noMessages')}</p>
        </div>
      )}

      {!loading && !error && filteredMessages.length > 0 && (
        <div className="messages-list">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${!message.read ? 'unread' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-icon">
                {message.type === 'bid' ? (
                  <i className="fas fa-comment-dollar"></i>
                ) : message.type === 'invitation' ? (
                  <i className="fas fa-user-plus"></i>
                ) : (
                  <i className="fas fa-envelope"></i>
                )}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <h3 className="message-title">{message.title}</h3>
                  <span className="message-date">{formatDate(message.createdAt)}</span>
                </div>
                <p className="message-text">{message.content}</p>
                <div className="message-footer">
                  <span className="sender-name">
                    <i className="fas fa-user"></i> {message.senderName}
                  </span>
                  {message.type === 'bid' && (
                    <span className="message-type bid">
                      <i className="fas fa-gavel"></i> {t('bidNotification')}
                    </span>
                  )}
                  {message.type === 'invitation' && (
                    <span className="message-type invitation">
                      <i className="fas fa-project-diagram"></i> {t('projectInvitation')}
                    </span>
                  )}
                </div>
              </div>
              {!message.read && <div className="unread-indicator"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;