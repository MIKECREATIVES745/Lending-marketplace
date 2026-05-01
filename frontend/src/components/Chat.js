import React, { useState, useEffect } from 'react';
import { chatAPI } from '../utils/api';
import '../styles/chat.css';

const Chat = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [currentUser?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const res = await chatAPI.getConversations(currentUser?.id);
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await chatAPI.getMessages(selectedConversation._id);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await chatAPI.sendMessage({
        conversationId: selectedConversation._id,
        senderId: currentUser?.id,
        recipientId: selectedConversation.participantIds.find(id => id._id !== currentUser?.id)?._id,
        message: newMessage
      });
      
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>Messages</h3>
        <div className="conversations-list">
          {conversations.map(conv => (
            <div 
              key={conv._id}
              className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="conversation-avatar">
                {conv.participantIds[0].firstName?.charAt(0)}
              </div>
              <div className="conversation-info">
                <h4>{conv.participantIds[0].firstName} {conv.participantIds[0].lastName}</h4>
                <p className="last-message">
                  {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString() : 'No messages'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <h3>
                {selectedConversation.participantIds[0].firstName} {selectedConversation.participantIds[0].lastName}
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
