import { getDocumentContent } from "./getDocumentContent";
import { setDocumentContent } from "./setDocumentContent";
import { getSelection } from "./getSelection";
import { getPresentationContent } from "./getPresentationContent";
import { getPresentationOverview } from "./getPresentationOverview";
import { getSlideImage } from "./getSlideImage";
import { setPresentationContent } from "./setPresentationContent";
import { addSlideFromCode } from "./addSlideFromCode";
import { clearSlide } from "./clearSlide";
import { updateSlideShape } from "./updateSlideShape";
import { getWorkbookContent } from "./getWorkbookContent";
import { setWorkbookContent } from "./setWorkbookContent";
import { getSelectedRange } from "./getSelectedRange";
import { setSelectedRange } from "./setSelectedRange";
import { getWorkbookInfo } from "./getWorkbookInfo";

// New Word tools
import { getDocumentOverview } from "./getDocumentOverview";
import { getSelectionText } from "./getSelectionText";
import { insertContentAtSelection } from "./insertContentAtSelection";
import { findAndReplace } from "./findAndReplace";
import { getDocumentSection } from "./getDocumentSection";
import { insertTable } from "./insertTable";
import { applyStyleToSelection } from "./applyStyleToSelection";

// New PowerPoint tools
import { getSlideNotes } from "./getSlideNotes";
import { setSlideNotes } from "./setSlideNotes";
import { duplicateSlide } from "./duplicateSlide";

// File system tools (shared across all hosts)
import { readFile } from "./readFile";
import { listDirectory } from "./listDirectory";

// New Excel tools
import { getWorkbookOverview } from "./getWorkbookOverview";
import { findAndReplaceCells } from "./findAndReplaceCells";
import { insertChart } from "./insertChart";
import { applyCellFormatting } from "./applyCellFormatting";
import { createNamedRange } from "./createNamedRange";

// File system tools available to all hosts
const fileSystemTools = [readFile, listDirectory];

export const wordTools = [
  getDocumentOverview,
  getDocumentContent,
  getDocumentSection,
  setDocumentContent,
  getSelection,
  getSelectionText,
  insertContentAtSelection,
  findAndReplace,
  insertTable,
  applyStyleToSelection,
  ...fileSystemTools,
];

export const powerpointTools = [
  getPresentationOverview,
  getPresentationContent,
  getSlideImage,
  getSlideNotes,
  setPresentationContent,
  addSlideFromCode,
  clearSlide,
  updateSlideShape,
  setSlideNotes,
  duplicateSlide,
  ...fileSystemTools,
];

export const excelTools = [
  getWorkbookOverview,
  getWorkbookInfo,
  getWorkbookContent,
  setWorkbookContent,
  getSelectedRange,
  setSelectedRange,
  findAndReplaceCells,
  insertChart,
  applyCellFormatting,
  createNamedRange,
  ...fileSystemTools,
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
