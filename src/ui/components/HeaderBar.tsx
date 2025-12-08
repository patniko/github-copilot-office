import * as React from "react";
import { Button, Tooltip, makeStyles, Dropdown, Option } from "@fluentui/react-components";
import { Compose24Regular } from "@fluentui/react-icons";

export type ModelType = "gpt-5" | "claude-sonnet-4" | "claude-sonnet-4.5" | "claude-opus-4.5" | "claude-haiku-4.5";

const MODELS: { key: ModelType; label: string }[] = [
  { key: "claude-opus-4.5", label: "Claude Opus 4.5" },
  { key: "claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
  { key: "claude-sonnet-4", label: "Claude Sonnet 4" },
  { key: "claude-haiku-4.5", label: "Claude Haiku 4.5" },
  { key: "gpt-5", label: "GPT 5" },
];

interface HeaderBarProps {
  onNewChat: () => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    gap: "8px",
    minHeight: "40px",
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
  dropdown: {
    minWidth: "120px",
    opacity: 0.6,
    fontSize: "12px",
    borderBottom: "none",
    ":hover": {
      opacity: 1,
    },
  },
});

export const HeaderBar: React.FC<HeaderBarProps> = ({ onNewChat, selectedModel, onModelChange }) => {
  const styles = useStyles();
  const selectedLabel = MODELS.find(m => m.key === selectedModel)?.label || selectedModel;

  return (
    <div className={styles.header}>
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
        {MODELS.map((model) => (
          <Option key={model.key} value={model.key}>
            {model.label}
          </Option>
        ))}
      </Dropdown>
      <Tooltip content="New chat" relationship="label">
        <Button
          icon={<Compose24Regular />}
          onClick={onNewChat}
          aria-label="New chat"
          className={styles.clearButton}
        />
      </Tooltip>
    </div>
  );
};
