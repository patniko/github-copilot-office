import { Tool } from "../../../copilot-sdk-nodejs/types";

export const setWorkbookContent: Tool = {
  name: "set_workbook_content",
  description: "Write data to a specific range in an Excel worksheet. The data should be provided as a 2D array where each inner array represents a row. If no sheet name is provided, writes to the active sheet.",
  parameters: {
    type: "object",
    properties: {
      sheetName: {
        type: "string",
        description: "Optional name of the worksheet to write to. If not provided, writes to the active sheet.",
      },
      startCell: {
        type: "string",
        description: "The starting cell address (e.g., 'A1', 'B5'). Data will be written starting from this cell.",
      },
      data: {
        type: "array",
        description: "2D array of values to write. Each inner array represents a row. Example: [['Name', 'Age'], ['John', 30], ['Jane', 25]]",
        items: {
          type: "array",
          items: {
            type: ["string", "number", "boolean"],
          },
        },
      },
    },
    required: ["startCell", "data"],
  },
  handler: async ({ arguments: args }) => {
    const { sheetName, startCell, data } = args as {
      sheetName?: string;
      startCell: string;
      data: any[][];
    };

    try {
      return await Excel.run(async (context) => {
        let worksheet: Excel.Worksheet;

        if (sheetName) {
          worksheet = context.workbook.worksheets.getItem(sheetName);
        } else {
          worksheet = context.workbook.worksheets.getActiveWorksheet();
        }

        worksheet.load("name");

        // Calculate the range size based on the data
        const rowCount = data.length;
        const colCount = data[0]?.length || 0;

        if (rowCount === 0 || colCount === 0) {
          return {
            textResultForLlm: "No data provided to write",
            resultType: "failure",
            error: "Empty data array",
            toolTelemetry: {}
          };
        }

        // Get the range starting from startCell
        const startRange = worksheet.getRange(startCell);
        const targetRange = startRange.getResizedRange(rowCount - 1, colCount - 1);

        targetRange.values = data;
        await context.sync();

        return `Successfully wrote ${rowCount} rows and ${colCount} columns to ${worksheet.name} starting at ${startCell}`;
      });
    } catch (e: any) {
      return { textResultForLlm: e.message, resultType: "failure", error: e.message, toolTelemetry: {} };
    }
  },
};
