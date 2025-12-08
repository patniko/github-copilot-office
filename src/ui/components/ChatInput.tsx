import * as React from "react";
import { useRef, useEffect } from "react";
import { Textarea, Button, Tooltip, makeStyles } from "@fluentui/react-components";
import { Send24Regular, Dismiss24Regular } from "@fluentui/react-icons";

export interface ImageAttachment {
  id: string;
  dataUrl: string;
  name: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSent?: () => void;
  disabled?: boolean;
  images?: ImageAttachment[];
  onImagesChange?: (images: ImageAttachment[]) => void;
}

const useStyles = makeStyles({
  inputContainer: {
    margin: "16px",
    padding: "4px 6px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderRadius: "6px",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  input: {
    flex: 1,
    padding: "4px",
    borderRadius: "0",
    border: "none !important",
    backgroundColor: "transparent !important",
    outline: "none !important",
    boxShadow: "none !important",
    "::after": {
      display: "none !important",
    },
  },
  sendButton: {
    width: "40px",
    height: "40px",
    minWidth: "40px",
    padding: "0",
    alignSelf: "flex-end",
    backgroundColor: "transparent",
    border: "none",
  },
  imagePreviewContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "4px",
  },
  imagePreview: {
    position: "relative",
    width: "80px",
    height: "80px",
    borderRadius: "4px",
    overflow: "hidden",
    border: "1px solid var(--colorNeutralStroke1)",
  },
  imagePreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imageRemoveButton: {
    position: "absolute",
    top: "4px",
    right: "4px",
    minWidth: "20px",
    width: "20px",
    height: "20px",
    padding: "0",
    backgroundColor: "var(--colorNeutralBackground1)",
    border: "1px solid var(--colorNeutralStroke1)",
    borderRadius: "50%",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
  },
});

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  images = [],
  onImagesChange,
}) => {
  const styles = useStyles();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Refocus when value becomes empty (after sending)
    if (value === "") {
      inputRef.current?.focus();
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !onImagesChange) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const newImage: ImageAttachment = {
              id: crypto.randomUUID(),
              dataUrl,
              name: `pasted-image-${Date.now()}.png`,
            };
            onImagesChange([...images, newImage]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    if (onImagesChange) {
      onImagesChange(images.filter(img => img.id !== id));
    }
  };

  return (
    <div className={styles.inputContainer}>
      {images.length > 0 && (
        <div className={styles.imagePreviewContainer}>
          {images.map(image => (
            <div key={image.id} className={styles.imagePreview}>
              <img src={image.dataUrl} alt="Preview" className={styles.imagePreviewImg} />
              <button
                className={styles.imageRemoveButton}
                onClick={() => handleRemoveImage(image.id)}
                title="Remove image"
              >
                <Dismiss24Regular style={{ fontSize: '12px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <Textarea
        ref={inputRef}
        className={styles.input}
        value={value}
        onChange={(e, data) => onChange(data.value)}
        onKeyDown={handleKeyPress}
        onPaste={handlePaste}
        placeholder="Type a message... (paste images with Ctrl+V)"
        rows={2}
      />
      <Tooltip content="Send message" relationship="label">
        <Button
          appearance="primary"
          icon={<Send24Regular />}
          onClick={onSend}
          disabled={!value.trim() && images.length === 0}
          className={styles.sendButton}
        />
      </Tooltip>
    </div>
  );
};
