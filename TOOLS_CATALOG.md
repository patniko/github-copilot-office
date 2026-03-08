# Tools Catalog

This document lists all available tools that GitHub Copilot can use when working with your Office documents.

## Word Tools

| Tool | Description |
|------|-------------|
| `get_document_overview` | Get a structural overview of the document including word count, heading hierarchy, table count, and list count. Use this first to understand the document structure. |
| `get_document_content` | Get the full HTML content of the Word document. |
| `get_document_section` | Read content of a specific section by heading name. More efficient than reading the entire document. |
| `set_document_content` | Replace the entire document body with new HTML content. |
| `get_selection` | Get the currently selected content as OOXML. |
| `get_selection_text` | Get the currently selected text as plain readable text. |
| `insert_content_at_selection` | Insert HTML content at the cursor position (before, after, or replace selection). |
| `find_and_replace` | Search and replace text with options for case sensitivity and whole word matching. |
| `insert_table` | Insert a formatted table at the cursor with header styling and grid/striped options. |
| `apply_style_to_selection` | Apply formatting to selected text (bold, italic, underline, font size, colors, highlighting). |
| `web_fetch` | Fetch content from a URL and convert to markdown. |

## PowerPoint Tools

| Tool | Description |
|------|-------------|
| `get_presentation_overview` | Get a quick overview of the presentation with slide count and content previews. Use this first. |
| `get_presentation_content` | Read text content from slides with support for chunked reading of large presentations. |
| `get_slide_image` | Capture a slide as a PNG image for visual inspection before making changes. |
| `get_slide_notes` | Read speaker notes from slides. |
| `set_presentation_content` | Add a text box to an existing slide or create a new slide with text. |
| `add_slide_from_code` | Programmatically create slides using PptxGenJS API. Supports text, bullets, tables, shapes, and images with full formatting control. |
| `clear_slide` | Remove all shapes from a slide. |
| `update_slide_shape` | Update the text content of an existing shape on a slide. |
| `set_slide_notes` | Add or update speaker notes for a slide. |
| `duplicate_slide` | Copy an existing slide to a new position in the presentation. |
| `web_fetch` | Fetch content from a URL and convert to markdown. |

## Excel Tools

| Tool | Description |
|------|-------------|
| `get_workbook_overview` | Get a structural overview of the workbook including sheets, used ranges, named ranges, and chart counts. Use this first. |
| `get_workbook_info` | List all worksheet names and the active sheet. |
| `get_workbook_content` | Read cell values and formulas from a worksheet or specific range. |
| `set_workbook_content` | Write a 2D array of values to cells starting at a specific position. |
| `get_selected_range` | Read the currently selected cells including values and formulas. |
| `set_selected_range` | Write values to the currently selected range. |
| `find_and_replace_cells` | Search and replace text in cells with case and whole-cell matching options. |
| `insert_chart` | Create charts (column, bar, line, pie, area, scatter, doughnut) from a data range. |
| `apply_cell_formatting` | Format cells with bold, colors, borders, number formats, and alignment. |
| `create_named_range` | Define named ranges for easier reference in formulas and AI interactions. |
| `web_fetch` | Fetch content from a URL and convert to markdown. |

## File System Tools (All Hosts)

| Tool | Description |
|------|-------------|
| `read_file` | Read the text content of a local file (up to 1 MB). Use when the user asks to reference a file for context. |
| `list_directory` | List files and subdirectories in a local directory. Hidden files are excluded. |

---

## Tool Usage Patterns

### Start with Overview Tools
Always begin by using the overview tool for your application:
- Word: `get_document_overview`
- PowerPoint: `get_presentation_overview`  
- Excel: `get_workbook_overview`

This helps Copilot understand your document structure before making targeted reads or edits.

### Surgical Edits vs Full Replacement
- **Surgical**: Use `insert_content_at_selection`, `find_and_replace`, `update_slide_shape` for targeted changes
- **Full replacement**: Use `set_document_content`, `add_slide_from_code` when rebuilding content

### PowerPoint: Code-Based Slide Creation
The `add_slide_from_code` tool is the most powerful way to create slides. It accepts JavaScript code using the PptxGenJS API:

```javascript
// Example: Create a title slide
slide.addText("Quarterly Report", { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 32, bold: true });
slide.addText("Q3 2024", { x: 0.5, y: 1, w: 9, h: 0.5, fontSize: 18, color: "666666" });
slide.addText([
  { text: "Revenue up 25%", options: { bullet: true } },
  { text: "10,000 customers", options: { bullet: true } }
], { x: 0.5, y: 1.8, w: 9, h: 2.5, fontSize: 16 });
```

### Excel: Formatting After Data
When working with Excel data:
1. Use `set_workbook_content` to write data
2. Use `apply_cell_formatting` to style headers and cells
3. Use `insert_chart` to visualize the data
4. Use `create_named_range` for important data regions
