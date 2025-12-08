import { Tool } from "../../../copilot-sdk-nodejs/types";

export const getWorkbookContent: Tool = {
  name: "get_workbook_content",
  description: "Get the content of a specific worksheet in the Excel workbook. If no sheet name is provided, gets content from the active sheet. Returns cell values and formulas in a structured format.",
  parameters: {
    type: "object",
    properties: {
      sheetName: {
        type: "string",
        description: "Optional name of the worksheet to read. If not provided, reads the active sheet.",
      },
      range: {
        type: "string",
        description: "Optional cell range to read (e.g., 'A1:D10'). If not provided, reads the used range of the sheet.",
      },
    },
  },
  handler: async ({ arguments: args }) => {
    const { sheetName, range } = (args as { sheetName?: string; range?: string }) || {};

    try {
      return await Excel.run(async (context) => {
        let worksheet: Excel.Worksheet;

        if (sheetName) {
          worksheet = context.workbook.worksheets.getItem(sheetName);
        } else {
          worksheet = context.workbook.worksheets.getActiveWorksheet();
        }

        worksheet.load("name");

        let targetRange: Excel.Range;
        if (range) {
          targetRange = worksheet.getRange(range);
        } else {
          targetRange = worksheet.getUsedRange();
        }

        targetRange.load(["values", "formulas", "address"]);
        await context.sync();

        const values = targetRange.values;
        const formulas = targetRange.formulas;
        const address = targetRange.address;

        // Format the output
        let output = `Worksheet: ${worksheet.name}\n`;
        output += `Range: ${address}\n\n`;

        if (values.length === 0 || (values.length === 1 && values[0].length === 0)) {
          return output + "(empty range)";
        }

        // Convert to a readable format
        const rows: string[] = [];
        for (let i = 0; i < values.length; i++) {
          const rowData: string[] = [];
          for (let j = 0; j < values[i].length; j++) {
            const value = values[i][j];
            const formula = formulas[i][j];

            // If there's a formula, show it; otherwise show the value
            if (formula && formula !== value) {
              rowData.push(`${formula} (=${value})`);
            } else {
              rowData.push(String(value));
            }
          }
          rows.push(rowData.join(" | "));
        }

        return output + rows.join("\n");
      });
    } catch (e: any) {
      return { textResultForLlm: e.message, resultType: "failure", error: e.message, toolTelemetry: {} };
    }
  },
};
