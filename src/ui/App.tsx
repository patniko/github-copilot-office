import * as React from "react";
import { useState, useEffect } from "react";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
} from "@fluentui/react-components";
import { ChatInput } from "./ChatInput";
import { Message, MessageList } from "./MessageList";
import { HeaderBar } from "./HeaderBar";
import { useIsDarkMode } from "./useIsDarkMode";
import { apiClient } from "./copilotService";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--colorNeutralBackground3)",
  },
});

export const App: React.FC = () => {
  const styles = useStyles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDarkMode = useIsDarkMode();

  useEffect(() => {
    // Test backend connection on mount
    apiClient.testConnection()
      .then((data) => {
        console.log('Backend connected:', data);
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to connect to backend:', error);
        setMessages([{
          id: "error-init",
          text: `Failed to connect to backend: ${error.message}`,
          sender: "assistant",
          timestamp: new Date(),
        }]);
      });
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || !isInitialized) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // Call backend API
      const response = await apiClient.testConnection();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Backend says: ${response.message} (You said: ${userInput})`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <div className={styles.container}>
        <HeaderBar onNewChat={handleClearChat} />

        <MessageList
          messages={messages}
          isTyping={isTyping}
        />

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isTyping || !isInitialized}
        />
      </div>
    </FluentProvider>
  );
};
