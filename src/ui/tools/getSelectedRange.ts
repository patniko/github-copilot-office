import { Tool } from "../../../copilot-sdk-nodejs/types";

export const getSelectedRange: Tool = {
  name: "get_selected_range",
  description: "Get the content of the currently selected range in Excel, including cell values and formulas.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    try {
      return await Excel.run(async (context) => {
        const selectedRange = context.workbook.getSelectedRange();
        selectedRange.load(["values", "formulas", "address"]);

        const worksheet = selectedRange.worksheet;
        worksheet.load("name");

        await context.sync();

        const values = selectedRange.values;
        const formulas = selectedRange.formulas;
        const address = selectedRange.address;

        if (values.length === 0 || (values.length === 1 && values[0].length === 0)) {
          return "(no selection)";
        }

        let output = `Selected Range: ${address}\n`;
        output += `Worksheet: ${worksheet.name}\n\n`;

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
