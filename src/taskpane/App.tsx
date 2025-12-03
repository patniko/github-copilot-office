import * as React from "react";
import { useState } from "react";

export const App: React.FC = () => {
  const [result, setResult] = useState<string>("");

  const insertText = async () => {
    try {
      await Word.run(async (context) => {
        const paragraph = context.document.body.insertParagraph(
          "Hello from React in your Word add-in!",
          Word.InsertLocation.end
        );
        paragraph.font.color = "blue";

        await context.sync();
        setResult("Text inserted successfully!");
      });
    } catch (error) {
      console.error("Error:", error);
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Segoe UI, sans-serif" }}>
      <h1>Word Ribbon Add-in</h1>
      <p>Built with React and TypeScript</p>
      <button
        onClick={insertText}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#0078d4",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Insert Text
      </button>
      {result && (
        <div style={{ marginTop: "20px", color: "#107c10" }}>{result}</div>
      )}
    </div>
  );
};
