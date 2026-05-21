import React, { useState, useEffect, useCallback } from 'react';
import { chatAPI } from '../utils/api';
import '../styles/chat.css';

const Chat = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatAPI.getConversations(currentUser?.id);
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [currentUser?.id]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await chatAPI.getMessages(selectedConversation._id);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [selectedConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const otherParticipant = getOtherParticipant(selectedConversation);
      const recipientId = otherParticipant._id || otherParticipant.id;
      
      await chatAPI.sendMessage({
        conversationId: selectedConversation._id,
        senderId: currentUser?.id || currentUser?._id,
        recipientId: recipientId,
        message: newMessage
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherParticipant = (conversation) => {
    const currentUserId = currentUser?.id || currentUser?._id;
    // Find participant that is not the current user
    const otherParticipant = conversation.participantIds.find(
      p => (p._id || p.id) !== currentUserId
    );
    // If no other participant found (shouldn't happen), return first participant
    return otherParticipant || conversation.participantIds[0];
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>Messages</h3>
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
                    {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString() : 'No messages'}
                  </p>
                </div>
              </div>
            );
          })}
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
                  className={`message ${msg.senderId._id === currentUser?.id ? 'sent' : 'received'}`}
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
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
