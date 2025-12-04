import * as React from "react";
import { Button, Tooltip, makeStyles } from "@fluentui/react-components";
import { Compose24Regular } from "@fluentui/react-icons";

interface HeaderBarProps {
  onNewChat: () => void;
}

const useStyles = makeStyles({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
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
});

export const HeaderBar: React.FC<HeaderBarProps> = ({ onNewChat }) => {
  const styles = useStyles();

  return (
    <div className={styles.header}>
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
