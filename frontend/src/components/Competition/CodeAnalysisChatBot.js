import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const CodeAnalysisChatBot = ({ userCode, challenge, results }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hi there! 👋 I'm your Code Analysis Assistant powered by Gemini 1.5 Flash. I can analyze your code submission and provide feedback. What would you like to know?", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Log the props for debugging
  useEffect(() => {
    console.log("CodeAnalysisChatBot props:", {
      userCodeLength: userCode ? userCode.length : 0,
      challenge: challenge ? challenge.title : null,
      results: results ? results.status : null
    });
  }, [userCode, challenge, results]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Clear chat history
  const clearChatHistory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chatbot/clear-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ chatType: 'codeAnalysis' })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear chat history: ${response.status} ${response.statusText}`);
      }
      
      // Reset messages to only the welcome message
      setMessages([{ 
        id: 1, 
        text: "Hi there! 👋 I'm your Code Analysis Assistant powered by Gemini 1.5 Flash. I can analyze your code submission and provide feedback. What would you like to know?", 
        sender: 'bot',
        timestamp: new Date()
      }]);
      
      console.log('Chat history cleared successfully');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  // Send message to the backend API
  const fetchBotResponse = async (userMessage) => {
    try {
      setIsTyping(true);
      
      // Log the data we're sending to API for debugging
      const requestData = { 
        message: userMessage,
        code: userCode,
        challenge: challenge,
        results: results
      };
      console.log("Sending to /api/chatbot/analyze-code:", requestData);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chatbot/analyze-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get chatbot response: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Response from API:", data);
      
      if (!data.response) {
        throw new Error('Empty response from chatbot API');
      }
      
      // Format bot's response
      let botText = data.response;
      // Process markdown-like formatting 
      botText = botText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      botText = botText.replace(/\*(.*?)\*/g, '<em>$1</em>');
      botText = botText.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
      botText = botText.replace(/`(.*?)`/g, '<code>$1</code>');
      botText = botText.replace(/\n/g, '<br/>');
      
      // Add bot response to messages
      const botResponse = {
        id: messages.length + 2,
        text: botText,
        sender: 'bot',
        timestamp: new Date(data.timestamp) || new Date(),
        html: true // Flag to render HTML
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Fallback response in case of error
      const fallbackResponse = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble analyzing your code right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    
    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and show typing indicator
    const messageToSend = newMessage;
    setNewMessage('');
    setIsTyping(true);
    
    // Get response from backend
    try {
      await fetchBotResponse(messageToSend);
    } catch (error) {
      console.error('Error in sendMessage:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Render message text with HTML if flag is set
  const renderMessageText = (message) => {
    if (message.html) {
      return <div dangerouslySetInnerHTML={{ __html: message.text }} />;
    }
    return <p className="text-sm whitespace-pre-line">{message.text}</p>;
  };

  return (
    <div className="z-40">
      {/* Chat toggle button */}
      <button 
        onClick={toggleChat}
        className="flex items-center justify-center w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label={isOpen ? "Close code analysis assistant" : "Open code analysis assistant"}
      >
        {isOpen ? (
          <span>Close Code Analysis Assistant</span>
        ) : (
          <span>Analyze My Code</span>
        )}
      </button>
      
      {/* Chat window */}
      {isOpen && (
        <div className="mt-4 h-96 bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-neon-blue to-neon-purple p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <div>
                  <h3 className="text-white font-bold">Code Analysis Assistant</h3>
                  <p className="text-gray-200 text-xs">Powered by Google Gemini 1.5 Flash</p>
                </div>
              </div>
              <button 
                onClick={clearChatHistory}
                className="text-white hover:text-gray-200 transition-colors"
                title="Clear chat history"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.sender === 'user' 
                      ? 'bg-neon-blue text-white rounded-tr-none' 
                      : 'bg-gray-700 text-white rounded-tl-none'
                  }`}
                >
                  {renderMessageText(message)}
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-700 text-white rounded-lg rounded-tl-none p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message input */}
          <form onSubmit={sendMessage} className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your code..."
                ref={inputRef}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-neon-blue"
                disabled={isSending}
              />
              <button
                type="submit"
                className="bg-neon-blue text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-neon-blue disabled:opacity-50"
                disabled={isSending || !newMessage.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Analyzing your competition submission
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default CodeAnalysisChatBot; 