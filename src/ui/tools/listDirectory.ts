import type { Tool } from "@github/copilot-sdk";

export const listDirectory: Tool = {
  name: "list_directory",
  description:
    "List files and subdirectories in a local directory. Returns names and types (file or directory). Hidden files (starting with '.') are excluded. If no path is provided, lists the user's home directory.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Absolute or relative path to the directory to list. Defaults to the user's home directory.",
      },
    },
    required: [],
  },
  handler: async (args) => {
    const { path } = args as { path?: string };

    try {
      const url = path
        ? `/api/list-directory?path=${encodeURIComponent(path)}`
        : `/api/list-directory`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return data.error || `HTTP ${response.status}`;
      }

      const lines = data.entries.map(
        (e: { name: string; type: string }) =>
          `${e.type === "directory" ? "📁" : "📄"} ${e.name}`,
      );
      return `Directory: ${data.path}\n\n${lines.join("\n")}`;
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
