import React, { useState, useEffect, useRef } from 'react';

/**
 * OceanViewChatbot Component
 * A premium, floating chatbot widget matching the "Ocean View AI" design.
 * 
 * Props:
 * - apiUrl: The backend endpoint URL (defaults to http://localhost:8000/chat/query)
 * - authToken: JWT bearer token for FastAPI authentication
 * - initialOpen: Whether the chatbot starts open (defaults to true)
 * - userRole: User's role metadata shown in the greeting or panel (defaults to "Regional Manager")
 */
export default function OceanViewChatbot({
  apiUrl = 'http://localhost:8000/chat/query',
  authToken = '',
  initialOpen = true,
  userRole = 'Regional Manager'
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hi there! 👋 I am your Ocean View Assistant. How can I help you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionId, setSessionId] = useState(() => `sess_${Math.random().toString(36).substr(2, 9)}`);

  const messagesEndRef = useRef(null);

  // Suggestions for the user (as chips above input)
  const suggestions = [
    "Show today's revenue.",
    "Which district has the highest profit?",
    "Top 5 stores.",
    "Average order value."
  ];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // If chat is closed and new messages were added, increment unread count
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    // Append user message
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          query: text,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      // Append assistant answer
      const assistantMsg = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sql: data.sql
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      // Append error message
      const errorMsg = {
        id: `error_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an error. Please make sure the backend is running and you are authenticated.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // Inline premium styling variables
  const styles = {
    floatingButton: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      backgroundColor: '#FF7A00',
      boxShadow: '0 4px 15px rgba(255, 122, 0, 0.4)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      outline: 'none',
      zIndex: 1000,
      transition: 'transform 0.2s ease, background-color 0.2s',
      transform: 'scale(1)',
    },
    badge: {
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      backgroundColor: '#E53E3E',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    chatWindow: {
      position: 'fixed',
      bottom: '92px',
      right: '24px',
      width: '380px',
      height: '580px',
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      display: isOpen ? 'flex' : 'none',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    header: {
      backgroundColor: '#FF7A00',
      padding: '16px 20px',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopLeftRadius: '20px',
      borderTopRightRadius: '20px',
    },
    headerInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    avatarCircle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      boxShadow: 'inset 0 0 5px rgba(255,255,255,0.3)'
    },
    titleContainer: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontWeight: 'bold',
      fontSize: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      margin: 0,
    },
    subtitle: {
      fontSize: '11px',
      opacity: 0.9,
      margin: 0,
      marginTop: '2px',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: '#FFFFFF',
      fontSize: '20px',
      cursor: 'pointer',
      opacity: 0.8,
      transition: 'opacity 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
    },
    messageArea: {
      flex: 1,
      backgroundColor: '#F8F9FA',
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    messageRow: {
      display: 'flex',
      gap: '8px',
      maxWidth: '85%',
    },
    assistantRow: {
      alignSelf: 'flex-start',
    },
    userRow: {
      alignSelf: 'flex-end',
      flexDirection: 'row-reverse',
    },
    msgAvatar: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 122, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      flexShrink: 0,
    },
    bubbleContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    },
    bubble: {
      padding: '12px 16px',
      borderRadius: '16px',
      fontSize: '14px',
      lineHeight: '1.45',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      wordBreak: 'break-word',
    },
    assistantBubble: {
      backgroundColor: '#FFFFFF',
      color: '#2D3748',
      borderTopLeftRadius: '4px',
      border: '1px solid #E2E8F0',
    },
    userBubble: {
      backgroundColor: '#FF7A00',
      color: '#FFFFFF',
      borderTopRightRadius: '4px',
    },
    msgTime: {
      fontSize: '10px',
      color: '#A0AEC0',
      alignSelf: 'flex-start',
      marginTop: '2px',
    },
    userTime: {
      alignSelf: 'flex-end',
    },
    suggestionsContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#F8F9FA',
      borderTop: '1px solid #EDF2F7',
    },
    suggestionLabel: {
      fontSize: '11px',
      color: '#718096',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    suggestionList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    suggestionChip: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      color: '#4A5568',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: '500',
      outline: 'none',
    },
    inputArea: {
      padding: '16px',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #EDF2F7',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    inputWrapper: {
      flex: 1,
      position: 'relative',
    },
    input: {
      width: '100%',
      padding: '12px 18px',
      backgroundColor: '#F7FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: '24px',
      fontSize: '14px',
      color: '#2D3748',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s, background-color 0.2s',
    },
    sendButton: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#FF7A00',
      border: 'none',
      outline: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'transform 0.2s, background-color 0.2s',
    },
    loaderContainer: {
      alignSelf: 'flex-start',
      display: 'flex',
      gap: '4px',
      padding: '12px 16px',
      backgroundColor: '#E2E8F0',
      borderRadius: '16px',
      borderTopLeftRadius: '4px',
    },
    loaderDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: '#718096',
      animation: 'bounce 1.4s infinite ease-in-out both'
    }
  };

  return (
    <>
      {/* 1. Floating Action Toggle Button */}
      <button 
        style={styles.floatingButton} 
        onClick={toggleChat}
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          // Close Icon (X)
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          // Robot Chat Icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {/* 2. Floating Chat Window */}
      <div style={styles.chatWindow}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <div style={styles.avatarCircle}>🤖</div>
            <div style={styles.titleContainer}>
              <h3 style={styles.title}>
                Ocean View AI 
                <span style={{color: '#FFD700', fontSize: '12px'}}>✨</span>
              </h3>
              <p style={styles.subtitle}>Online Assistant • {userRole}</p>
            </div>
          </div>
          <button style={styles.closeButton} onClick={toggleChat} aria-label="Close Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Message scroll area */}
        <div style={styles.messageArea}>
          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';
            return (
              <div 
                key={msg.id} 
                style={{
                  ...styles.messageRow,
                  ...(isAssistant ? styles.assistantRow : styles.userRow)
                }}
              >
                {isAssistant && <div style={styles.msgAvatar}>🤖</div>}
                <div style={styles.bubbleContainer}>
                  <div 
                    style={{
                      ...styles.bubble,
                      ...(isAssistant ? styles.assistantBubble : styles.userBubble),
                      ...(msg.isError ? { borderLeft: '4px solid #E53E3E', backgroundColor: '#FFF5F5' } : {})
                    }}
                  >
                    {msg.text}
                  </div>
                  <span 
                    style={{
                      ...styles.msgTime,
                      ...(!isAssistant ? styles.userTime : {})
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div style={{ ...styles.messageRow, ...styles.assistantRow }}>
              <div style={styles.msgAvatar}>🤖</div>
              <div style={styles.loaderContainer}>
                <span style={{...styles.loaderDot, animationDelay: '-0.32s'}}></span>
                <span style={{...styles.loaderDot, animationDelay: '-0.16s'}}></span>
                <span style={styles.loaderDot}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested queries chips */}
        <div style={styles.suggestionsContainer}>
          <span style={styles.suggestionLabel}>Suggested questions</span>
          <div style={styles.suggestionList}>
            {suggestions.map((text, i) => (
              <button 
                key={i} 
                style={styles.suggestionChip}
                onClick={() => handleSendMessage(text)}
                disabled={isLoading}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Input inputArea */}
        <div style={styles.inputArea}>
          <div style={styles.inputWrapper}>
            <input
              type="text"
              style={styles.input}
              placeholder="Ask a question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
            />
          </div>
          <button 
            style={{
              ...styles.sendButton,
              opacity: inputValue.trim() === '' || isLoading ? 0.6 : 1
            }} 
            onClick={() => handleSendMessage()}
            disabled={inputValue.trim() === '' || isLoading}
            title="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Embedded CSS for keyframe animations (Typing dots) */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </>
  );
}
