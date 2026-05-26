import React, { useState, useEffect, useCallback, useRef } from 'react';
import { chatAPI, userAPI } from '../utils/api';
import '../styles/chat.css';

const Chat = ({ currentUser, socket }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [chatError, setChatError] = useState('');
  const selectedConvRef = useRef(null);

  const currentUserId = currentUser?.id || currentUser?._id;

  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await chatAPI.getConversations(currentUserId);
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setChatError('Unable to load conversations. Please refresh.');
    }
  }, [currentUserId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation?._id) return;
    try {
      const res = await chatAPI.getMessages(selectedConversation._id);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setChatError('Unable to load messages.');
    }
  }, [selectedConversation]);

  useEffect(() => {
    fetchConversations();

    // Ensure user joins their private room for real-time notifications
    if (socket && currentUserId) {
      socket.emit('join-user-room', currentUserId);
    }
  }, [fetchConversations, socket, currentUserId]);

  // Keep ref updated for socket listener to avoid closure staleness
  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  // Listen for new messages in real-time
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', ({ conversationId, message }) => {
      // If we are currently chatting in this specific conversation, append the message
      if (selectedConvRef.current?._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      // Always refresh conversations to update the sidebar snippet/unread count
      fetchConversations();
    });

    return () => {
      socket.off('new-message');
    };
  }, [socket, fetchConversations]);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoadingUsers(true);
      try {
        if (currentUser?.userType === 'borrower') {
          const res = await userAPI.getLenders();
          setRecommendedUsers(res.data.filter(u => String(u._id) !== String(currentUserId)));
        } else if (currentUser?.userType === 'lender') {
          const res = await userAPI.getBorrowers();
          setRecommendedUsers(res.data.filter(u => String(u._id) !== String(currentUserId)));
        } else {
          const [lenders, borrowers] = await Promise.all([userAPI.getLenders(), userAPI.getBorrowers()]);
          setRecommendedUsers([
            ...lenders.data,
            ...borrowers.data
          ].filter(u => String(u._id) !== String(currentUserId)));
        }
      } catch (error) {
        console.error('Error loading recommended users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (currentUserId) {
      loadRecommendations();
    }
  }, [currentUserId, currentUser?.userType]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation?._id) return;

    try {
      const otherParticipant = getOtherParticipant(selectedConversation);
      const recipientId = otherParticipant._id || otherParticipant.id;
      
      await chatAPI.sendMessage({
        conversationId: selectedConversation._id,
        recipientId,
        message: newMessage
      });
      
      setNewMessage('');
      await fetchMessages();
      await fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setChatError('Failed to send message.');
    }
  };

  const getOtherParticipant = (conversation) => {
    const otherParticipant = conversation.participantIds.find(
      p => String(p._id || p.id) !== String(currentUserId)
    );
    return otherParticipant || conversation.participantIds[0];
  };

  const startConversation = async (user) => {
    if (!user?._id) return;
    try {
      const res = await chatAPI.createConversation({ partnerId: user._id });
      setSelectedConversation(res.data);
      setMessages([]);
      await fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      setChatError('Unable to start conversation.');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>Messages {totalUnread > 0 && <span className="total-unread-badge">({totalUnread})</span>}</h3>
        {chatError && <div className="alert alert-error">{chatError}</div>}
        <div className="conversations-list">
          {conversations.map(conv => {
            const otherUser = getOtherParticipant(conv);
            return (
              <div
                key={conv._id}
                className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="conversation-avatar">
                  {otherUser.firstName?.charAt(0)}
                </div>
                <div className="conversation-info">
                  <h4>{otherUser.firstName} {otherUser.lastName}</h4>
                  <p className="last-message">
                    {conv.lastMessage?.message || 'No messages yet'}
                  </p>
                  <small>{conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString() : ''}</small>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="unread-indicator">{conv.unreadCount}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="chat-recommendations">
          <h4>Start a new chat</h4>
          <div className="recommendations-horizontal">
            {loadingUsers ? (
              <p>Loading...</p>
            ) : recommendedUsers.length > 0 ? (
              recommendedUsers.slice(0, 8).map(user => (
                <div
                  key={user._id}
                  className="recommended-user-chip"
                  onClick={() => startConversation(user)}
                >
                  <div className="chip-avatar">{user.firstName?.charAt(0)}</div>
                  <span>{user.firstName}</span>
                </div>
              ))
            ) : (
              <p className="text-muted">No contacts</p>
            )}
          </div>
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <h3>
                {getOtherParticipant(selectedConversation).firstName} {getOtherParticipant(selectedConversation).lastName}
              </h3>
            </div>

            <div className="messages-list">
              {messages.map(msg => (
                <div 
                  key={msg._id}
                  className={`message ${String(msg.senderId._id || msg.senderId.id) === String(currentUserId) ? 'sent' : 'received'}`}
                >
                  <div className="message-avatar">
                    {msg.senderId.firstName?.charAt(0)}
                  </div>
                  <div className="message-content">
                    <p>{msg.message}</p>
                    <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
                  </div>
                </div>
              ))}
            </div>

            <form className="message-form" onSubmit={sendMessage}>
              <input 
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <p>Select a conversation or start a new chat from the list.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
