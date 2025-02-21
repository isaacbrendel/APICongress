// src/components/LLMChatBubble.js
import React from 'react';
import './LLMChatBubble.css';

const LLMChatBubble = ({ model, message }) => {
  return (
    <div className="chat-bubble">
      <div className="chat-message">{message}</div>
      <div className="chat-model">{model}</div>
    </div>
  );
};

export default LLMChatBubble;
