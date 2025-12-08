import { useState, useEffect } from "react";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
} from "@fluentui/react-components";
import { ChatInput } from "./components/ChatInput";
import { Message, MessageList } from "./components/MessageList";
import { HeaderBar, ModelType } from "./components/HeaderBar";
import { useIsDarkMode } from "./useIsDarkMode";
import { useLocalStorage } from "./useLocalStorage";
import { createWebSocketClient } from "../../copilot-sdk-nodejs/websocket-client";
import { getToolsForHost } from "./tools";
import React from "react";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--colorNeutralBackground3)",
  },
});

const DEFAULT_MODEL: ModelType = "claude-sonnet-4.5";

export const App: React.FC = () => {
  const styles = useStyles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useLocalStorage<ModelType>("word-addin-selected-model", DEFAULT_MODEL);
  const isDarkMode = useIsDarkMode();

  const startNewSession = async (model: ModelType) => {
    setMessages([]);
    setInputValue("");
    setIsTyping(false);
    setError("");
    
    try {
      if (client) {
        await client.stop();
      }
      const host = Office.context.host;
      const tools = getToolsForHost(host);
      const newClient = await createWebSocketClient(`wss://${location.host}/api/copilot`);
      setClient(newClient);
      setSession(await newClient.createSession({ model, tools }));
    } catch (e: any) {
      setError(`Failed to create session: ${e.message}`);
    }
  };

  useEffect(() => {
    startNewSession(selectedModel);
  }, []);

  const handleModelChange = (newModel: ModelType) => {
    setSelectedModel(newModel);
    startNewSession(newModel);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !session) return;

    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }]);
    const userInput = inputValue;
    setInputValue("");
    setIsTyping(true);
    setError("");

    try {
      for await (const event of session.query({ prompt: userInput })) {
        console.log('[event]', event.type, event);
        if (event.type === 'assistant.message' && (event.data as any).content) {
          setMessages((prev) => [...prev, {
            id: event.id,
            text: (event.data as any).content,
            sender: "assistant",
            timestamp: new Date(event.timestamp),
          }]);
        } else if (event.type === 'tool.execution_start') {
          setMessages((prev) => [...prev, {
            id: event.id,
            text: JSON.stringify((event.data as any).arguments, null, 2),
            sender: "tool",
            toolName: (event.data as any).toolName,
            timestamp: new Date(event.timestamp),
          }]);
        } else if (event.type === 'assistant.turn_end') {
          // Log what stopReason we got
          console.log('[turn_end]', (event.data as any).stopReason);
        }
      }
      console.log('[query complete]');
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
      <div className={styles.container}>
        <HeaderBar 
          onNewChat={() => startNewSession(selectedModel)} 
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />

        <MessageList
          messages={messages}
          isTyping={isTyping}
          isConnecting={!session && !error}
        />

        {error && <div style={{ color: 'red', padding: '8px' }}>{error}</div>}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
        />
      </div>
    </FluentProvider>
  );
};
