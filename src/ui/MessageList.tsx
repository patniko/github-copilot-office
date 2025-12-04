import * as React from "react";
import { useRef, useEffect } from "react";
import { makeStyles } from "@fluentui/react-components";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

const useStyles = makeStyles({
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    fontSize: "20px",
    fontWeight: "300",
    color: "var(--colorNeutralForeground4)",
  },
  messageUser: {
    alignSelf: "flex-end",
    backgroundColor: "#0078d4",
    color: "white",
    padding: "10px 14px",
    borderRadius: "12px",
    maxWidth: "70%",
    wordWrap: "break-word",
  },
  messageAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "var(--colorNeutralBackground1Hover)",
    padding: "10px 14px",
    borderRadius: "12px",
    maxWidth: "70%",
    wordWrap: "break-word",
  },
});

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
}) => {
  const styles = useStyles();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.chatContainer}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>
          What can I do for you?
        </div>
      )}
      
      {messages.map((message) => (
        <div
          key={message.id}
          className={message.sender === "user" ? styles.messageUser : styles.messageAssistant}
        >
          {message.text}
        </div>
      ))}
      
      {isTyping && (
        <div className={styles.messageAssistant}>
          <span>Typing...</span>
        </div>
      )}
      
      <div ref={chatEndRef} />
    </div>
  );
};
