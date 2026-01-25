import { useState, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";

// --- LIBRARIES ---
// @ts-ignore
import { asBlob } from "html-docx-js-typescript";

// Icons
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Undo,
  Redo,
  Save,
  FileUp,
  FilePlus,
  Minus,
  Highlighter,
  FileText,
  Plus,
  Trash2,
  SplitSquareHorizontal,
  Merge,
  Columns,
  Rows,
} from "lucide-react";

// Tauri
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import { MenuButton } from "./components/MenuButton";
import { TableButton } from "./components/TableButton";
import { ToolbarSection } from "./components/ToolbarSection";
import {
  EDITOR_CLASSES,
  EDITOR_STYLE,
  FONT_FAMILIES,
} from "./constants/word_const";
import { parseDocxContent } from "./helper/word_helper";

// --- MAIN MODULE ---
export const WordModule = () => {
  // --- A. STATE ---
  // File Info
  const [fileName, setFileName] = useState("TaiLieu.docx");
  const [filePath, setFilePath] = useState<string | null>(null);
  // Editor Status
  const [isDirty, setIsDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [isTableActive, setIsTableActive] = useState(false);

  // --- B. EDITOR CONFIG ---
  const extensions = useMemo(
    () => [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Link,
      Image,
      CharacterCount,
      Placeholder.configure({ placeholder: "Nhập nội dung văn bản..." }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: `<h1>Word Editor Pro</h1><p>Bắt đầu soạn thảo...</p>`,
    editorProps: {
      attributes: {
        class: EDITOR_CLASSES,
        style: EDITOR_STYLE,
        spellcheck: "false",
      },
    },
    // Logic cập nhật trạng thái bảng và dirty state
    onUpdate: ({ editor }) => {
      if (!isDirty) setIsDirty(true);
      setIsTableActive(editor.isActive("table"));
    },
    onSelectionUpdate: ({ editor }) => {
      setIsTableActive(editor.isActive("table"));
    },
  });

  // --- C. HANDLERS (ACTIONS) ---

  const handleNew = () => {
    if (isDirty && !confirm("File chưa lưu. Bạn có chắc muốn tạo mới?")) return;
    editor?.commands.setContent("");
    setFileName("Untitled.docx");
    setFilePath(null);
    setIsDirty(false);
    setStatus("New File");
  };

  const handleSave = async () => {
    if (!editor) return;
    try {
      // 1. Prepare Content
      const fullHtml = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"></head><body>${editor.getHTML()}</body></html>`;
      const docxBlob = (await asBlob(fullHtml, {
        orientation: "portrait",
        margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      })) as Blob;

      // 2. Determine Path
      let targetPath = filePath;
      if (!targetPath) {
        targetPath = await save({
          filters: [{ name: "Word Document", extensions: ["docx"] }],
          defaultPath: fileName,
        });
      }

      // 3. Write File
      if (targetPath) {
        const arrayBuffer = await docxBlob.arrayBuffer();
        await writeFile(targetPath, new Uint8Array(arrayBuffer));

        // 4. Update State
        setFilePath(targetPath);
        setFileName(targetPath.split(/[\\/]/).pop() || "Untitled.docx");
        setIsDirty(false);
        setStatus("Đã lưu!");
        setTimeout(() => setStatus(""), 2000);
      }
    } catch (e) {
      alert("Lỗi lưu file: " + e);
    }
  };

  const handleOpen = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Documents", extensions: ["docx", "html", "txt"] }],
      });

      if (selected && typeof selected === "string") {
        setStatus("Đang đọc...");
        const fileContent = await readFile(selected);
        let htmlResult = "";

        // Xử lý dựa trên loại file
        if (selected.endsWith(".docx")) {
          const blob = new Blob([fileContent]);
          htmlResult = await parseDocxContent(await blob.arrayBuffer());
        } else {
          htmlResult = new TextDecoder().decode(fileContent);
        }

        // Clean HTML artifacts
        if (!htmlResult || htmlResult.trim() === "") htmlResult = "<p></p>";
        htmlResult = htmlResult
          .replace(/Content-Type:.*$/gim, "")
          .replace(/MIME-Version:.*$/gim, "");

        // Update Editor
        if (editor) {
          editor.commands.setContent(htmlResult);
          editor.commands.focus();
          setFilePath(selected);
          setFileName(selected.split(/[\\/]/).pop() || "Untitled.docx");
          setIsDirty(false);
          setStatus("Đã mở");
        }
      }
    } catch (e) {
      alert("Lỗi mở file: " + e);
      setStatus("Lỗi");
    }
  };

  // --- D. EFFECTS ---

  // Shortcut: Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editor, filePath]); // Dependency quan trọng: filePath để biết Save hay Save As

  if (!editor) return null;

  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-900 relative overflow-hidden">
      {/* --- 1. HEADER BAR --- */}
      <div className="bg-[#2b579a] text-white flex items-center justify-between px-3 py-1.5 text-xs shrink-0 shadow-md z-30 relative">
        <div className="flex items-center gap-4">
          <div className="font-bold flex items-center gap-2 text-sm">
            <FileText size={18} /> Word
          </div>
          <div className="h-5 w-[1px] bg-blue-400"></div>
          <input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="bg-transparent border-none outline-none font-medium placeholder-blue-300 w-48 truncate hover:bg-blue-600/50 px-1 rounded transition-colors"
          />
          <span className="opacity-80 italic text-[10px]">
            {status || (isDirty ? "(Chưa lưu*)" : "")}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNew}
            className="hover:bg-blue-600 px-3 py-1 rounded transition-colors flex items-center gap-1"
          >
            <FilePlus size={14} /> Mới
          </button>
          <button
            onClick={handleOpen}
            className="hover:bg-blue-600 px-3 py-1 rounded transition-colors flex items-center gap-1"
          >
            <FileUp size={14} /> Mở
          </button>
          <button
            onClick={handleSave}
            className="bg-white text-[#2b579a] hover:bg-slate-100 px-3 py-1 rounded transition-colors font-bold shadow-sm flex items-center gap-1"
          >
            <Save size={14} /> Lưu
          </button>
        </div>
      </div>

      {/* --- 2. RIBBON TOOLBAR --- */}
      <div className="bg-white border-b border-slate-300 shadow-sm shrink-0 z-20 relative">
        <div className="flex items-center h-[90px] overflow-x-auto overflow-y-hidden w-full scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent px-1">
          <ToolbarSection title="Undo">
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Hoàn tác"
            >
              <Undo size={20} />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Làm lại"
            >
              <Redo size={20} />
            </MenuButton>
          </ToolbarSection>

          <ToolbarSection title="Font">
            <div className="flex flex-col gap-1 items-center justify-center">
              <div className="flex gap-1 items-center">
                <select
                  className="text-[11px] border border-slate-300 rounded px-1 h-[24px] w-36 outline-none focus:border-blue-500 pointer"
                  onChange={(e) =>
                    editor.chain().focus().setFontFamily(e.target.value).run()
                  }
                  value={editor.getAttributes("textStyle").fontFamily || ""}
                >
                  <option value="">Default Font</option>
                  {FONT_FAMILIES.map((font) => (
                    <option
                      key={font.value}
                      value={font.value}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  className="w-6 h-[24px] p-0 border border-slate-300 rounded pointer"
                  title="Màu chữ"
                  onInput={(e: any) =>
                    editor.chain().focus().setColor(e.target.value).run()
                  }
                  value={editor.getAttributes("textStyle").color || "#000000"}
                />
              </div>
              <div className="flex">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded ${
                    editor.isActive("bold")
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded ${
                    editor.isActive("italic")
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded ${
                    editor.isActive("underline")
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <UnderlineIcon size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1.5 rounded ${
                    editor.isActive("strike")
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <Strikethrough size={16} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className={`p-1.5 rounded ${
                    editor.isActive("highlight")
                      ? "bg-yellow-200 text-orange-600"
                      : "hover:bg-slate-100"
                  }`}
                >
                  <Highlighter size={16} />
                </button>
              </div>
            </div>
          </ToolbarSection>

          <ToolbarSection title="Paragraph">
            <div className="flex flex-col gap-1">
              <div className="flex gap-0.5">
                <MenuButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  isActive={editor.isActive({ textAlign: "left" })}
                >
                  <AlignLeft size={18} />
                </MenuButton>
                <MenuButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  isActive={editor.isActive({ textAlign: "center" })}
                >
                  <AlignCenter size={18} />
                </MenuButton>
                <MenuButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  isActive={editor.isActive({ textAlign: "right" })}
                >
                  <AlignRight size={18} />
                </MenuButton>
                <MenuButton
                  onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                  }
                  isActive={editor.isActive({ textAlign: "justify" })}
                >
                  <AlignJustify size={18} />
                </MenuButton>
              </div>
            </div>
          </ToolbarSection>

          <ToolbarSection title="List">
            <div className="flex gap-0.5">
              <MenuButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive("bulletList")}
                label="Bullets"
              >
                <List size={20} />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive("orderedList")}
                label="Number"
              >
                <ListOrdered size={20} />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive("taskList")}
                label="Task"
              >
                <CheckSquare size={20} />
              </MenuButton>
            </div>
          </ToolbarSection>

          <ToolbarSection title="Insert">
            <MenuButton
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
              label="Table"
            >
              <TableIcon size={22} />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              label="Line"
            >
              <Minus size={22} />
            </MenuButton>
          </ToolbarSection>

          {/* --- TABLE LAYOUT: LUÔN HIỂN THỊ (NHƯNG DISABLED NẾU KHÔNG CHỌN BẢNG) --- */}
          <ToolbarSection
            title="Table Layout"
            className="bg-amber-50 border-l-2 border-amber-300"
          >
            <div className="grid grid-flow-col grid-rows-2 gap-x-2 gap-y-1">
              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Thêm cột phải"
              >
                <Columns size={12} />
                <Plus size={10} /> Col
              </TableButton>
              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Thêm dòng dưới"
              >
                <Rows size={12} />
                <Plus size={10} /> Row
              </TableButton>

              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Xóa cột"
                danger
              >
                <Columns size={12} />
                <Trash2 size={10} /> Col
              </TableButton>
              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Xóa dòng"
                danger
              >
                <Rows size={12} />
                <Trash2 size={10} /> Row
              </TableButton>

              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().mergeCells().run()}
                title="Gộp ô"
              >
                <Merge size={12} /> Merge
              </TableButton>
              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().splitCell().run()}
                title="Tách ô"
              >
                <SplitSquareHorizontal size={12} /> Split
              </TableButton>

              <TableButton
                disabled={!isTableActive}
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Xóa bảng"
                danger
              >
                <Trash2 size={12} /> Table
              </TableButton>
            </div>
          </ToolbarSection>
        </div>
      </div>

      {/* --- 3. EDITOR AREA --- */}
      <div className="flex-1 overflow-auto bg-[#e5e5e5] cursor-text relative w-full flex justify-center">
        <style>{`
            .ProseMirror { outline: none; }
            .ProseMirror p { margin-bottom: 0.5em; line-height: 1.6; }
            .ProseMirror h1 { font-size: 24pt; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; color: #2b579a; }
            .ProseMirror h2 { font-size: 18pt; font-weight: bold; margin-top: 1em; margin-bottom: 0.5em; color: #2e74b5; }
            .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; }
            .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; }
            
            ul[data-type="taskList"] { list-style: none; padding: 0; }
            li[data-type="taskItem"] { display: flex; align-items: flex-start; margin-bottom: 0.5rem; }
            li[data-type="taskItem"] label { margin-right: 0.5rem; user-select: none; }
            
            .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; overflow: hidden; table-layout: fixed; }
            .ProseMirror td, .ProseMirror th { 
                min-width: 1em; border: 1px solid #a0a0a0; padding: 6px; 
                vertical-align: top; position: relative; 
            }
            .ProseMirror th { background-color: #f3f4f6; font-weight: bold; text-align: left; }
            .ProseMirror .selectedCell:after { 
                z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; 
                background: rgba(200, 200, 255, 0.4); pointer-events: none; 
            }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* --- 4. STATUS BAR --- */}
      <div className="h-6 bg-[#f3f4f6] border-t border-slate-300 text-slate-600 text-[11px] flex items-center px-4 justify-between shrink-0 select-none z-30">
        <div className="flex gap-4">
          <span className="font-medium">Page 1 of 1</span>
          <span>{editor.storage.characterCount.words()} words</span>
          <span>{editor.storage.characterCount.characters()} characters</span>
        </div>
        <div className="flex gap-4">
          <span className="uppercase">Vietnamese</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
