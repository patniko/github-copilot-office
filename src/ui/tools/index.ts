import { getDocumentContent } from "./getDocumentContent";
import { setDocumentContent } from "./setDocumentContent";
import { getSelection } from "./getSelection";
import { webFetch } from "./webFetch";
import { getPresentationContent } from "./getPresentationContent";
import { setPresentationContent } from "./setPresentationContent";
import { addSlideFromCode } from "./addSlideFromCode";
import { getWorkbookContent } from "./getWorkbookContent";
import { setWorkbookContent } from "./setWorkbookContent";
import { getSelectedRange } from "./getSelectedRange";

export const wordTools = [
  getDocumentContent,
  setDocumentContent,
  getSelection,
  webFetch,
];

export const powerpointTools = [
  getPresentationContent,
  setPresentationContent,
  addSlideFromCode,
  webFetch,
];

export const excelTools = [
  getWorkbookContent,
  setWorkbookContent,
  getSelectedRange,
  webFetch,
];

export function getToolsForHost(host: typeof Office.HostType[keyof typeof Office.HostType]) {
  switch (host) {
    case Office.HostType.Word:
      return wordTools;
    case Office.HostType.PowerPoint:
      return powerpointTools;
    case Office.HostType.Excel:
      return excelTools;
    default:
      return [];
  }
}
