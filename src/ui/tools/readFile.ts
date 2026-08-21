import type { Tool } from "@github/copilot-sdk";

export const readFile: Tool = {
  name: "read_file",
  // Deliberately shadows the runtime's built-in read_file: the task pane runs in the
  // Office sandbox with no filesystem access, so reads must route through the add-in's
  // local server instead. Protocol v3 requires this opt-in for built-in name collisions.
  overridesBuiltInTool: true,
  description:
    "Read the text content of a file from the local file system. Returns the file content as a string. Use this when the user asks you to read or reference a local file for context. Max file size is 1 MB.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Absolute or relative path to the file to read.",
      },
    },
    required: ["path"],
  },
  handler: async (args) => {
    const { path } = args as { path: string };

    try {
      const response = await fetch(
        `/api/read-file?path=${encodeURIComponent(path)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        return data.error || `HTTP ${response.status}`;
      }

      const header = `File: ${data.path} (${(data.size / 1024).toFixed(1)} KB)\n---\n`;
      return header + data.content;
    } catch (e: any) {
      return {
        textResultForLlm: e.message,
        resultType: "failure",
        error: e.message,
        toolTelemetry: {},
      };
    }
  },
};
