/// <reference types="@types/office-js" />

import * as React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const container = document.getElementById("root");
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
    console.log("Add-in loaded successfully");
  }
});
