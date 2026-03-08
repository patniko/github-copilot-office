import * as React from "react";
import { Button, Tooltip, Switch, makeStyles, Dropdown, Option, tokens } from "@fluentui/react-components";
import { Compose24Regular, History24Regular, PlugConnected24Regular, PlugDisconnected24Regular } from "@fluentui/react-icons";

export type ModelType = string;

export interface ConnectionConfig {
  mode: 'local' | 'remote';
  host: string;
  port: number;
}

interface HeaderBarProps {
  onNewChat: () => void;
  onShowHistory: () => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  models: { key: string; label: string }[];
  debugEnabled: boolean;
  onDebugChange: (v: boolean) => void;
  connectionConfig: ConnectionConfig;
  onConnectionChange: (config: ConnectionConfig) => void;
  isConnecting?: boolean;
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    paddingRight: "40px",
    gap: "8px",
    minHeight: "40px",
  },
  leftSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
    flex: 1,
  },
  debugRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
  },
  connectionRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
    marginTop: "2px",
  },
  connectionInput: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: "3px",
    padding: "1px 4px",
    fontSize: "11px",
    width: "60px",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  connectedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    fontSize: "10px",
    fontWeight: 600 as const,
    color: tokens.colorPaletteGreenForeground1,
  },
  dropdown: {
    minWidth: "120px",
    opacity: 0.6,
    fontSize: "12px",
    borderBottom: "none",
    ":hover": {
      opacity: 1,
    },
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexShrink: 0,
  },
  iconButton: {
    minWidth: "28px",
    width: "28px",
    height: "28px",
    padding: "0",
  },
  clearButton: {
    backgroundColor: "#0078d4",
    color: "white",
    borderRadius: "4px",
    padding: "4px",
    width: "28px",
    height: "28px",
    minWidth: "28px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      backgroundColor: "#106ebe",
    },
  },
});

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onNewChat,
  onShowHistory,
  selectedModel,
  onModelChange,
  models,
  debugEnabled,
  onDebugChange,
  connectionConfig,
  onConnectionChange,
  isConnecting,
}) => {
  const styles = useStyles();
  const selectedLabel = models.find(m => m.key === selectedModel)?.label || selectedModel;
  const isRemote = connectionConfig.mode === 'remote';

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <Dropdown
          className={styles.dropdown}
          appearance="underline"
          value={selectedLabel}
          selectedOptions={[selectedModel]}
          onOptionSelect={(_, data) => {
            if (data.optionValue && data.optionValue !== selectedModel) {
              onModelChange(data.optionValue as ModelType);
            }
          }}
        >
          {models.map((model) => (
            <Option key={model.key} value={model.key}>
              {model.label}
            </Option>
          ))}
        </Dropdown>
        {/* Connection mode toggle */}
        <div className={styles.connectionRow}>
          <Tooltip content={isRemote ? 'Connected to GitHub Tokens runtime' : 'Using local Copilot CLI'} relationship="label">
            <Switch
              checked={isRemote}
              onChange={(_, data) => {
                onConnectionChange({
                  ...connectionConfig,
                  mode: data.checked ? 'remote' : 'local',
                });
              }}
              label={isConnecting ? '…' : isRemote ? '' : 'Local'}
              style={{ fontSize: "11px" }}
              disabled={isConnecting}
            />
          </Tooltip>
          {isRemote && (
            <>
              <span className={styles.connectedBadge}>
                <PlugConnected24Regular style={{ width: 12, height: 12 }} />
                :{connectionConfig.port}
              </span>
              <input
                className={styles.connectionInput}
                type="number"
                value={connectionConfig.port}
                onChange={(e) => {
                  const port = parseInt(e.target.value, 10);
                  if (port > 0 && port <= 65535) {
                    onConnectionChange({ ...connectionConfig, port });
                  }
                }}
                title="Runtime TCP port"
              />
            </>
          )}
        </div>
        {/* Debug toggle — hidden by default, enable via localStorage: copilot-debug-visible=true */}
        {localStorage.getItem("copilot-debug-visible") === "true" && (
          <div className={styles.debugRow}>
            <Switch
              checked={debugEnabled}
              onChange={(_, data) => onDebugChange(data.checked)}
              label="Debug"
              style={{ fontSize: "11px" }}
            />
          </div>
        )}
      </div>
      <div className={styles.buttonGroup}>
        <Tooltip content="History" relationship="label">
          <Button
            icon={<History24Regular />}
            appearance="subtle"
            onClick={onShowHistory}
            aria-label="History"
            className={styles.iconButton}
          />
        </Tooltip>
        <Tooltip content="New chat" relationship="label">
          <Button
            icon={<Compose24Regular />}
            onClick={onNewChat}
            aria-label="New chat"
            className={styles.clearButton}
          />
        </Tooltip>
      </div>
    </div>
  );
};
