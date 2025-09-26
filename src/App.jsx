import { useState, useRef, useEffect } from 'react';
import { Send, FileText, User, Bot, Loader } from 'lucide-react';
import axios from 'axios'
import './App.css';

function App() {
  // State management - these track the current state of the app
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hi! I'm here to help you with questions about your document. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref to scroll to bottom of messages
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const REACT_API_URL = 'http://127.0.0.1:5000';

  // Simulate bot response (this will be replaced with the actual API call- just here as a placeholder)
  const simulateBotResponse = async (userInput) => {
    // Simulate thinking time
    try {
      const response = await axios.post(process.env.REACT_APP_API_URL || `${REACT_API_URL}/api/process`, {message: userInput}, {headers: {'Content-Type': 'application/json'}, timeout: 5000});
      return response.data.response || response.data.message || 'Sorry, I received an empty response.';
    }
    catch (error) {
      console.error('Error sending message to Flask: ', error);
      return 'Error communicating with Flask.';
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get bot response
      const botResponse = await simulateBotResponse(inputValue);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"></link>
      <div className="chatbot-container font-fam">
        
      {/* Header */}
      <div className="chatbot-header">
        <div className="header-content">
          <FileText className="header-icon" />
          <div>
            <h1 className="header-title">iHelp</h1>
            <p className="header-subtitle">Maximo Assistant to Help with Analyzing, Summarizing and Advising</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-wrapper ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.type === 'bot' && (
              <div className="avatar">
                <div className="avatar-bot">
                  <Bot className="avatar-icon" />
                </div>
              </div>
            )}
            
            <div className={`message-bubble ${message.type === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
              <p className="message-content">{message.content}</p>
              <p className={`message-time ${message.type === 'user' ? 'user-time' : 'bot-time'}`}>
                {formatTime(message.timestamp)}
              </p>
            </div>

            {message.type === 'user' && (
              <div className="avatar">
                <div className="avatar-user">
                  <User className="avatar-icon" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="message-wrapper bot-message">
            <div className="avatar">
              <div className="avatar-bot">
                <Bot className="avatar-icon" />
              </div>
            </div>
            <div className="message-bubble bot-bubble loading-bubble">
              <div className="loading-content">
                <Loader className="loading-spinner" />
                <p className="loading-text">Thinking...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-wrapper">
          <div className="textarea-container">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your document..."
              className="message-input"
              rows="1"
              style={{
                minHeight: '44px',
                maxHeight: '110px',
                overflowY: inputValue.length > 100 ? 'auto' : 'hidden'
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`send-button ${inputValue.trim() && !isLoading ? 'send-button-active' : 'send-button-disabled'}`}
          >
            <Send className="send-icon" />
          </button>
        </div>
        
        {/* Quick suggestion chips */}
        <div className="suggestions-container">
          {['Summarize the document', 'Key findings?', 'Main conclusions?'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="suggestion-chip"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;