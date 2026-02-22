/**
 * CHATBOT COMPONENT
 * ==================
 * Interactive medical information chatbot
 */

import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, getChatbotInfo } from '../services/api';

const Chatbot = ({ analysisResult }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I\'m your AI Medical Assistant powered by Google Gemini. Ask me anything about pulmonary nodules, CT scans, symptoms, treatments, or your analysis results!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasShownResultsHelp, setHasShownResultsHelp] = useState(false);
  const [aiEngine, setAiEngine] = useState('gemini');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  /**
   * Focus input when chatbot opens
   */
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  /**
   * Handle send message
   */
  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();

    if (!trimmedMessage) {
      return;
    }

    // Add user message to chat
    const userMessage = {
      type: 'user',
      text: trimmedMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Pass full conversation history for context-aware Gemini responses
      const response = await sendChatMessage(trimmedMessage, messages);

      if (response.engine) setAiEngine(response.engine);

      const botMessage = {
        type: 'bot',
        text: response.reply,
        timestamp: new Date(),
        engine: response.engine,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

    } catch (error) {
      console.error('Chatbot error:', error);

      const isApiKeyError = error.message?.includes('API') || error.message?.includes('key');
      const errorMessage = {
        type: 'bot',
        text: isApiKeyError
          ? '⚠️ AI service not configured. Please add your GEMINI_API_KEY to backend/.env (get a free key at aistudio.google.com). The system is using basic rule-based responses.'
          : "I'm sorry, I'm having trouble processing your request. Please try again.",
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Medical AI Assistant"
      >
        {isOpen ? (
          <span className="toggle-icon close-icon">✕</span>
        ) : (
          <span className="toggle-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="chatbot-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="chatbot-header-text">
                <h4>PulmoAI Assistant</h4>
                <p className="chatbot-status">
                  <span className="status-dot pulsing"></span>
                  {aiEngine === 'gemini' ? 'Gemini AI Online' : 'Basic Model Selected'}
                </p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.type} ${message.isError ? 'error' : ''} ${message.isHighlight ? 'highlight' : ''}`}
              >
                <div className="message-content">
                  <p style={{ whiteSpace: 'pre-line' }}>{message.text}</p>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="message bot typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <textarea
              ref={inputRef}
              className="chat-textarea"
              placeholder="Ask a question about lung nodules..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              disabled={isTyping}
            />
            <button
              className="chat-send-btn"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
