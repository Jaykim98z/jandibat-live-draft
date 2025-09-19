// client/src/components/room/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';
import styles from './Chat.module.css';

interface ChatMessage {
  id: string;
  userId: string;
  nickname: string;
  message: string;
  timestamp: string;
  type: 'user' | 'system' | 'notification';
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId?: string;
  isConnected: boolean;
  className?: string;
}

const Chat: React.FC<ChatProps> = ({
  messages,
  onSendMessage,
  currentUserId,
  isConnected,
  className = ''
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 새 메시지가 올 때 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !isConnected) {
      return;
    }

    onSendMessage(inputMessage.trim());
    setInputMessage('');
    setIsTyping(false);
    
    // 포커스 유지
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (userId: string) => {
    return userId === currentUserId;
  };

  const getMessageTypeClass = (type: string) => {
    switch (type) {
      case 'system':
        return styles.systemMessage;
      case 'notification':
        return styles.notificationMessage;
      default:
        return styles.userMessage;
    }
  };

  return (
    <div className={`${styles.chatContainer} ${className}`}>
      {/* 채팅 헤더 */}
      <div className={styles.chatHeader}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            <i className="fas fa-comments"></i>
            채팅
          </h3>
          <div className={styles.connectionStatus}>
            <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`}></div>
            <span className={styles.statusText}>
              {isConnected ? '연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyMessage}>
            <i className="fas fa-comment-dots"></i>
            <p>아직 메시지가 없습니다.</p>
            <p>첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map((message, index) => {
              const isOwn = isMyMessage(message.userId);
              const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
              
              return (
                <div
                  key={message.id}
                  className={`
                    ${styles.messageWrapper}
                    ${getMessageTypeClass(message.type)}
                    ${isOwn ? styles.ownMessage : styles.otherMessage}
                  `}
                >
                  {message.type === 'user' && !isOwn && showAvatar && (
                    <div className={styles.messageAvatar}>
                      <div className={styles.avatarPlaceholder}>
                        {message.nickname.charAt(0)}
                      </div>
                    </div>
                  )}
                  
                  <div className={styles.messageContent}>
                    {message.type === 'user' && !isOwn && showAvatar && (
                      <div className={styles.messageNickname}>
                        {message.nickname}
                      </div>
                    )}
                    
                    <div className={styles.messageBubble}>
                      <div className={styles.messageText}>
                        {message.message}
                      </div>
                      <div className={styles.messageTime}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className={styles.inputContainer}>
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected 
                  ? "메시지를 입력하세요..." 
                  : "연결이 끊어졌습니다..."
              }
              disabled={!isConnected}
              maxLength={500}
              className={styles.messageInput}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputMessage.trim() || !isConnected}
              className={styles.sendButton}
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
          
          {/* 글자 수 표시 */}
          {isTyping && (
            <div className={styles.characterCount}>
              {inputMessage.length}/500
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chat;