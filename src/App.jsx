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
  const [documentName, setDocumentName] = useState('No Document Set');
  const [documents, setDocuments] = useState([]);
  const [showDocumentList, setShowDocumentList] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  // Ref to scroll to bottom of messages
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const FLASK_API_URL = 'http://127.0.0.1:5000';

  const fetchDocuments = async () => {
    setLoadingDocuments(true);
    try {
		      const response = await axios.get(`${FLASK_API_URL}/api/documents`, 
			      {
				      timeout: 30000
			      }
		      );
      setDocuments(response.data.documents || []);
      setShowDocumentList(true);
    } catch (error) {
      console.error('Error fetching documents:', error);
      
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: 'Unable to fetch documents. Please ensure Watson Discovery is configured correctly.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const selectDocument = (doc) => {
    setDocumentName(doc.document_id); //|| doc.title || doc.name);
    setShowDocumentList(false);
    
    const confirmMessage = {
      id: Date.now(),
      type: 'bot',
      content: `Now chatting about: ${doc.title || doc.name}. What would you like to know?`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  // Send message to Flask backend
  const sendMessageToFlask = async (userMessage) => {
    try {
      const response = await axios.post(`${FLASK_API_URL}/api/chat`, {
        message: userMessage,
        document_name: documentName
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      return response.data.response || response.data.message || 'Sorry, I received an empty response.';
    } catch (error) {
      console.error('Error calling Flask API:', error);
      
      // Handling different types of errors
      if (error.code === 'ECONNABORTED') {
        return 'Request timed out. Please try again.';
      } else if (error.response) {
        // If the Server responded with error status
        return `Server error: ${error.response.data.error || 'Unknown error occurred'}`;
      } else if (error.request) {
        // If there is a Network error
        return 'Unable to connect to server. Please check if the Flask app is running.';
      } else {
        return 'An unexpected error occurred. Please try again.';
      }
    }
  };

  // Function to handle sending a message
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
      // Send message to Flask backend
      const response = await sendMessageToFlask(inputValue);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Sorry, I encountered an error while processing your request. Please try again.",
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
            <h1 className="header-title">Document Assistant</h1>
            <p className="header-subtitle">{documentName}</p>
          </div>
        </div>
        <button 
          onClick={fetchDocuments}
          disabled={loadingDocuments}
          className="documents-button"
        >
          {loadingDocuments ? 'Loading...' : ((documents.length > 0) ? `Documents (${documents.length})` : 'Documents')}
        </button>
      </div>

      {/* Document List Modal */}
      {showDocumentList && (
        <div className="modal-overlay" onClick={() => setShowDocumentList(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Available Documents</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDocumentList(false)}
              >
                ✕
              </button>
            </div>
            <div className="documents-list">
              {documents.length === 0 ? (
                <p className="no-documents">No documents found</p>
              ) : (
                documents.map((doc, index) => (
                  <div 
                    key={doc.document_id || index}
                    className="document-item"
                    onClick={() => selectDocument(doc)}
                  >
                    <FileText className="document-icon" />
                    <div className="document-info">
                      <h3 className="document-title">{doc.document_id || doc.title || doc.name || 'Untitled'}</h3>
                      {doc.metadata && (
                        <p className="document-meta">
                          {doc.metadata.file_type && `Type: ${doc.metadata.file_type}`}
                          {doc.metadata.size && ` • Size: ${doc.metadata.size}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
                maxHeight: '120px',
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