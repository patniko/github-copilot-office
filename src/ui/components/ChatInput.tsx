import * as React from "react";
import { useRef, useEffect } from "react";
import { Textarea, Button, Tooltip, makeStyles } from "@fluentui/react-components";
import { Send24Regular, Dismiss24Regular } from "@fluentui/react-icons";

export interface ImageAttachment {
  id: string;
  dataUrl: string;
  name: string;
}

export interface FileAttachment {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
  type: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onSent?: () => void;
  disabled?: boolean;
  images?: ImageAttachment[];
  onImagesChange?: (images: ImageAttachment[]) => void;
  files?: FileAttachment[];
  onFilesChange?: (files: FileAttachment[]) => void;
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
  filePickerRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "0 4px 4px",
  },
  filePreviewContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "4px",
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid var(--colorNeutralStroke1)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  fileName: {
    fontSize: "12px",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileDetails: {
    fontSize: "11px",
    color: "var(--colorNeutralForeground3)",
  },
  fileRemoveButton: {
    minWidth: "20px",
    width: "20px",
    height: "20px",
    padding: "0",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
  },
});

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  images = [],
  onImagesChange,
  files = [],
  onFilesChange,
}) => {
  const styles = useStyles();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = "";
    if (!selected.length || !onFilesChange) return;

    const uploaded = await Promise.all(
      selected.map(async (file) => ({
        id: crypto.randomUUID(),
        dataUrl: await readFileAsDataUrl(file),
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    );

    onFilesChange([...files, ...uploaded]);
  };

  const handleRemoveImage = (id: string) => {
    if (onImagesChange) {
      onImagesChange(images.filter(img => img.id !== id));
    }
  };

  const handleRemoveFile = (id: string) => {
    if (onFilesChange) {
      onFilesChange(files.filter(file => file.id !== id));
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
      {files.length > 0 && (
        <div className={styles.filePreviewContainer}>
          {files.map(file => (
            <div key={file.id} className={styles.filePreview}>
              <div className={styles.fileMeta}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileDetails}>
                  {(file.type || "file") + " · " + Math.max(1, Math.round(file.size / 1024)) + " KB"}
                </span>
              </div>
              <button
                className={styles.fileRemoveButton}
                onClick={() => handleRemoveFile(file.id)}
                title="Remove file"
              >
                <Dismiss24Regular style={{ fontSize: '12px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={styles.filePickerRow}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={handleFileSelect}
        />
        <Button
          appearance="subtle"
          size="small"
          onClick={() => fileInputRef.current?.click()}
        >
          Attach files
        </Button>
      </div>
      <Textarea
        ref={inputRef}
        className={styles.input}
        value={value}
        onChange={(e, data) => onChange(data.value)}
        onKeyDown={handleKeyPress}
        onPaste={handlePaste}
        placeholder="Type a message... (paste images or attach files)"
        rows={2}
      />
      <Tooltip content="Send message" relationship="label">
        <Button
          appearance="primary"
          icon={<Send24Regular />}
          onClick={onSend}
          disabled={!value.trim() && images.length === 0 && files.length === 0}
          className={styles.sendButton}
        />
      </Tooltip>
    </div>
  );
};
