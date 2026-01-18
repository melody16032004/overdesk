import { useState, useEffect, useMemo, useRef } from "react";
import {
  Book,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  Tag,
  Hash,
  Menu,
  Download,
  Bold,
  Italic,
  Code,
  Link as LinkIcon,
  List,
  AlertTriangle,
  Image as ImageIcon,
  Layout,
  Type,
  Palette,
  CheckCircle2,
  X,
  Table as TableIcon,
  CheckSquare,
  Minus,
  Strikethrough,
  ListOrdered,
} from "lucide-react";

// --- 1. TYPES & INITIAL DATA ---
interface WikiPage {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
}

const INITIAL_PAGE: WikiPage = {
  id: "intro",
  title: "Full Markdown Demo",
  content:
    "# Heading 1\n## Heading 2\n### Heading 3\n\n**In đậm**, *In nghiêng*, và ~~Gạch ngang~~.\n\n--- \n\n### 1. Danh sách công việc:\n- [x] Viết code\n- [ ] Fix bug\n- [ ] Deploy\n\n### 2. Bảng dữ liệu:\n| Tên | Vai trò | Trạng thái |\n|---|---|---|\n| React | Frontend | Active |\n| Node | Backend | Active |\n| SQL | DB | Pending |\n\n### 3. Code Block:\n```javascript\nfunction hello() {\n  console.log('Wiki Pro v4');\n}\n```\n\n> Đây là trích dẫn (Blockquote).\n",
  tags: ["demo", "features"],
  updatedAt: Date.now(),
};

// --- 2. MAIN COMPONENT ---
export const WikiModule = () => {
  // --- STATE ---
  const [pages, setPages] = useState<WikiPage[]>(() => {
    try {
      const saved = localStorage.getItem("wiki_data_v4"); // Version 4 storage
      return saved ? JSON.parse(saved) : [INITIAL_PAGE];
    } catch {
      return [INITIAL_PAGE];
    }
  });

  const [selectedId, setSelectedId] = useState<string>(pages[0]?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Editor State
  const [editorMode, setEditorMode] = useState<"code" | "visual">("code");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem("wiki_data_v4", JSON.stringify(pages));
  }, [pages]);

  // --- ACTIONS ---
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsEditing(false);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const handleCreate = () => {
    const newPage: WikiPage = {
      id: crypto.randomUUID(),
      title: "Trang mới",
      content: "",
      tags: [],
      updatedAt: Date.now(),
    };
    setPages([newPage, ...pages]);
    setSelectedId(newPage.id);
    prepareEdit(newPage);
  };

  const prepareEdit = (page: WikiPage) => {
    setEditTitle(page.title);
    setEditContent(page.content);
    setEditTags(page.tags.join(", "));
    setIsEditing(true);
    setEditorMode("code");
  };

  const handleSave = () => {
    const updatedTags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              title: editTitle,
              content: editContent,
              tags: updatedTags,
              updatedAt: Date.now(),
            }
          : p
      )
    );
    setIsEditing(false);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    const newPages = pages.filter((p) => p.id !== deletingId);
    setPages(newPages);
    if (selectedId === deletingId && newPages.length > 0)
      setSelectedId(newPages[0].id);
    setDeletingId(null);
  };

  const handleExport = (page: WikiPage) => {
    const element = document.createElement("a");
    const file = new Blob([page.content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${page.title.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(element);
    element.click();
  };

  // Helper cho Code Mode
  const insertMarkdown = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = editContent;
    const newText =
      text.substring(0, start) +
      prefix +
      text.substring(start, end) +
      suffix +
      text.substring(end);
    setEditContent(newText);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const appendContent = (text: string) => {
    const prefix =
      editContent.endsWith("\n") || editContent === "" ? "" : "\n\n";
    setEditContent((prev) => prev + prefix + text);
  };

  const filteredPages = useMemo(() => {
    if (!search) return pages;
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [pages, search]);

  const activePage = pages.find((p) => p.id === selectedId);

  // --- RENDER ---
  return (
    <div className="h-full flex bg-[#0f172a] text-slate-300 font-sans overflow-hidden relative">
      {showSidebar && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        ></div>
      )}

      {/* DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-sm rounded-xl p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa?</h3>
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div
        className={`absolute md:static inset-y-0 left-0 z-30 w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-700 space-y-3 bg-[#1e293b]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Book size={18} className="text-indigo-400" /> Wiki V4
            </h3>
            <button
              onClick={handleCreate}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg active:scale-95"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="relative group">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              onClick={() => handleSelect(page.id)}
              className={`group relative flex flex-col gap-1 p-3 rounded-xl cursor-pointer border ${
                selectedId === page.id
                  ? "bg-indigo-900/20 border-indigo-500/50"
                  : "border-transparent hover:bg-slate-800/50"
              }`}
            >
              <div
                className={`text-sm font-bold truncate ${
                  selectedId === page.id ? "text-indigo-300" : "text-slate-300"
                }`}
              >
                {page.title || "Untitled"}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>
                  {new Date(page.updatedAt).toLocaleDateString("vi-VN")}
                </span>
                {page.tags[0] && (
                  <span className="bg-slate-800 px-1.5 rounded text-slate-400 max-w-[80px] truncate">
                    #{page.tags[0]}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingId(page.id);
                }}
                className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-500 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full bg-[#0f172a] overflow-hidden relative">
        <div className="flex-none h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-[#0f172a]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3 overflow-hidden w-full mr-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 text-slate-400 bg-slate-800 rounded-lg"
            >
              <Menu size={18} />
            </button>
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-transparent text-lg font-bold text-white outline-none w-full placeholder:text-slate-600"
                placeholder="Tiêu đề..."
                autoFocus
              />
            ) : (
              <h2 className="text-lg font-bold text-white truncate">
                {activePage?.title || "Chọn trang"}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {activePage &&
              (isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2 shadow-lg"
                  >
                    <Save size={14} /> Lưu
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleExport(activePage)}
                    className="p-2 text-slate-400 hover:text-indigo-400 rounded-lg"
                    title="Export"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => prepareEdit(activePage)}
                    className="px-4 py-1.5 text-xs font-bold bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-700 flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Sửa
                  </button>
                </>
              ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activePage ? (
            isEditing ? (
              <div className="h-full flex flex-col">
                <div className="flex border-b border-slate-800 bg-slate-900/50">
                  <button
                    onClick={() => setEditorMode("code")}
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 border-b-2 ${
                      editorMode === "code"
                        ? "border-indigo-500 text-white bg-slate-800"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    <Code size={14} /> Code
                  </button>
                  <button
                    onClick={() => setEditorMode("visual")}
                    className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-2 border-b-2 ${
                      editorMode === "visual"
                        ? "border-indigo-500 text-white bg-slate-800"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    <Layout size={14} /> Visual
                  </button>
                </div>
                <div className="p-4 pb-0">
                  <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <Tag size={14} className="text-slate-500 ml-1" />
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tags..."
                      className="flex-1 bg-transparent text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden relative mt-2">
                  {editorMode === "code" ? (
                    <div className="h-full flex flex-col p-4 pt-0">
                      <div className="flex gap-1 mb-2 overflow-x-auto pb-1 custom-scrollbar">
                        <ToolBtn
                          icon={Bold}
                          onClick={() => insertMarkdown("**", "**")}
                          label="Bold"
                        />
                        <ToolBtn
                          icon={Italic}
                          onClick={() => insertMarkdown("*", "*")}
                          label="Italic"
                        />
                        <ToolBtn
                          icon={Strikethrough}
                          onClick={() => insertMarkdown("~~", "~~")}
                          label="Strike"
                        />
                        <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
                        <ToolBtn
                          icon={Code}
                          onClick={() => insertMarkdown("```\n", "\n```")}
                          label="Code"
                        />
                        <ToolBtn
                          icon={LinkIcon}
                          onClick={() => insertMarkdown("[", "](url)")}
                          label="Link"
                        />
                        <ToolBtn
                          icon={List}
                          onClick={() => insertMarkdown("- ")}
                          label="UL"
                        />
                        <ToolBtn
                          icon={ListOrdered}
                          onClick={() => insertMarkdown("1. ")}
                          label="OL"
                        />
                        <ToolBtn
                          icon={CheckSquare}
                          onClick={() => insertMarkdown("- [ ] ")}
                          label="Task"
                        />
                        <div className="w-px h-4 bg-slate-700 mx-1 self-center"></div>
                        <ToolBtn
                          icon={Hash}
                          onClick={() => insertMarkdown("## ")}
                          label="H2"
                        />
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 w-full bg-transparent text-sm font-mono text-slate-300 outline-none resize-none p-2 border border-slate-800 rounded-lg focus:border-slate-600 custom-scrollbar"
                        placeholder="Markdown..."
                        spellCheck={false}
                      />
                    </div>
                  ) : (
                    <VisualBuilder
                      onInsert={appendContent}
                      previewContent={editContent}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10 pb-20 max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-8">
                  {activePage.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded border border-indigo-500/20 uppercase"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="markdown-body space-y-6 text-slate-300">
                  <SimpleMarkdownViewer content={activePage.content} />
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <Book size={64} className="opacity-20 mb-6" />
              <p className="text-sm">Chọn trang để xem.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 3. SUB COMPONENT: VISUAL BUILDER (ENHANCED) ---
const VisualBuilder = ({
  onInsert,
  previewContent,
}: {
  onInsert: (txt: string) => void;
  previewContent: string;
}) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [headingText, setHeadingText] = useState("");
  const [headingLevel, setHeadingLevel] = useState(2);
  const [listItems, setListItems] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [codeLang, setCodeLang] = useState("javascript");
  const [codeBody, setCodeBody] = useState("");
  // Table State
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const insertHeading = () => {
    onInsert(`${"#".repeat(headingLevel)} ${headingText}`);
    setHeadingText("");
    setActiveTool(null);
  };
  const insertList = (ordered: boolean, task: boolean) => {
    const items = listItems.split("\n").filter((i) => i.trim());
    const md = items
      .map((i, idx) =>
        task ? `- [ ] ${i}` : ordered ? `${idx + 1}. ${i}` : `- ${i}`
      )
      .join("\n");
    onInsert(md);
    setListItems("");
    setActiveTool(null);
  };
  const insertImage = () => {
    onInsert(`![${imgAlt}](${imgUrl})`);
    setImgUrl("");
    setImgAlt("");
    setActiveTool(null);
  };
  const insertCode = () => {
    onInsert(`\`\`\`${codeLang}\n${codeBody}\n\`\`\``);
    setCodeBody("");
    setActiveTool(null);
  };
  const insertTable = () => {
    let md = `\n| ${Array(tableCols).fill("Header").join(" | ")} |\n| ${Array(
      tableCols
    )
      .fill("---")
      .join(" | ")} |\n`;
    for (let i = 0; i < tableRows; i++)
      md += `| ${Array(tableCols).fill("Data").join(" | ")} |\n`;
    onInsert(md);
    setActiveTool(null);
  };

  return (
    <div className="h-full flex flex-col sm:flex-row bg-[#0f172a]">
      <div className="w-full sm:w-72 bg-[#161b22] border-r border-slate-800 p-4 overflow-y-auto custom-scrollbar">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4">
          Công cụ
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 mb-6">
          <ToolButton
            icon={Type}
            label="Tiêu đề"
            onClick={() => setActiveTool("heading")}
            active={activeTool === "heading"}
          />
          <ToolButton
            icon={List}
            label="Danh sách"
            onClick={() => setActiveTool("list")}
            active={activeTool === "list"}
          />
          <ToolButton
            icon={CheckSquare}
            label="Task List"
            onClick={() => {
              setActiveTool("list");
            }}
          />
          <ToolButton
            icon={TableIcon}
            label="Bảng (Table)"
            onClick={() => setActiveTool("table")}
            active={activeTool === "table"}
          />
          <ToolButton
            icon={ImageIcon}
            label="Hình ảnh"
            onClick={() => setActiveTool("image")}
            active={activeTool === "image"}
          />
          <ToolButton
            icon={Code}
            label="Code Block"
            onClick={() => setActiveTool("code")}
            active={activeTool === "code"}
          />
          <ToolButton
            icon={Minus}
            label="Kẻ ngang (HR)"
            onClick={() => onInsert(`\n---\n`)}
          />
          <ToolButton
            icon={Palette}
            label="Callout"
            onClick={() => onInsert(`> `)}
          />
        </div>

        {activeTool && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 animate-in slide-in-from-left-2 fade-in">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
              <span className="text-xs font-bold text-indigo-400 uppercase">
                {activeTool}
              </span>
              <button onClick={() => setActiveTool(null)}>
                <X size={14} className="text-slate-500 hover:text-white" />
              </button>
            </div>
            {activeTool === "heading" && (
              <div className="space-y-3">
                <div className="flex gap-1 bg-slate-900 rounded p-1">
                  {[1, 2, 3, 4, 5, 6].map((L) => (
                    <button
                      key={L}
                      onClick={() => setHeadingLevel(L)}
                      className={`flex-1 text-xs font-bold py-1.5 rounded ${
                        headingLevel === L
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      H{L}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none"
                  placeholder="Tiêu đề..."
                  value={headingText}
                  onChange={(e) => setHeadingText(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={insertHeading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded"
                >
                  Chèn
                </button>
              </div>
            )}
            {activeTool === "list" && (
              <div className="space-y-3">
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none h-24"
                  placeholder="Nhập các dòng..."
                  value={listItems}
                  onChange={(e) => setListItems(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => insertList(false, false)}
                    className="flex-1 bg-indigo-600 text-white text-[10px] font-bold py-2 rounded"
                  >
                    Bullet
                  </button>
                  <button
                    onClick={() => insertList(true, false)}
                    className="flex-1 bg-slate-700 text-white text-[10px] font-bold py-2 rounded"
                  >
                    1. 2. 3.
                  </button>
                  <button
                    onClick={() => insertList(false, true)}
                    className="flex-1 bg-slate-700 text-white text-[10px] font-bold py-2 rounded"
                  >
                    Check
                  </button>
                </div>
              </div>
            )}
            {activeTool === "table" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500">Hàng</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      value={tableRows}
                      onChange={(e) => setTableRows(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500">Cột</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      value={tableCols}
                      onChange={(e) => setTableCols(Number(e.target.value))}
                    />
                  </div>
                </div>
                <button
                  onClick={insertTable}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded"
                >
                  Tạo bảng mẫu
                </button>
              </div>
            )}
            {activeTool === "image" && (
              <div className="space-y-3">
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none"
                  placeholder="URL..."
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  autoFocus
                />
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none"
                  placeholder="Alt text..."
                  value={imgAlt}
                  onChange={(e) => setImgAlt(e.target.value)}
                />
                <button
                  onClick={insertImage}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded"
                >
                  Chèn ảnh
                </button>
              </div>
            )}
            {activeTool === "code" && (
              <div className="space-y-3">
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none"
                  placeholder="Lang (js, py)..."
                  value={codeLang}
                  onChange={(e) => setCodeLang(e.target.value)}
                />
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white outline-none h-24"
                  placeholder="Code..."
                  value={codeBody}
                  onChange={(e) => setCodeBody(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={insertCode}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded"
                >
                  Chèn Code
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 bg-[#0f172a] p-6 overflow-y-auto custom-scrollbar border-l border-slate-800">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <CheckCircle2 size={12} className="text-emerald-500" /> Live Preview
        </div>
        <div className="markdown-body space-y-4 text-slate-300 opacity-90 select-none pointer-events-none">
          {previewContent ? (
            <SimpleMarkdownViewer content={previewContent} />
          ) : (
            <span className="italic opacity-50">Chưa có nội dung...</span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 4. HELPERS & MARKDOWN PARSER ---
const ToolBtn = ({ icon: Icon, onClick, label }: any) => (
  <button
    onClick={onClick}
    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
    title={label}
  >
    <Icon size={16} />
  </button>
);
const ToolButton = ({ icon: Icon, label, onClick, active }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border ${
      active
        ? "bg-indigo-600 text-white border-indigo-500 shadow-lg"
        : "bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700"
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

const SimpleMarkdownViewer = ({ content }: { content: string }) => {
  if (!content) return null;
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  const renderTable = (rows: string[], key: number) => {
    const data = rows.map((r) =>
      r
        .split("|")
        .filter((c) => c.trim() !== "")
        .map((c) => c.trim())
    );
    if (data.length < 2) return null;
    const [header, ...body] = data;
    return (
      <div
        key={`tbl-${key}`}
        className="my-4 overflow-x-auto rounded-lg border border-slate-700"
      >
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-800 text-xs uppercase text-slate-400">
            <tr>
              {header.map((h, i) => (
                <th key={i} className="px-6 py-3">
                  {parseInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-800 hover:bg-slate-800/50"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-4">
                    {parseInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, idx) => {
    // 1. Code Block
    if (line.trim().startsWith("```")) {
      if (inTable) {
        elements.push(renderTable(tableBuffer, idx));
        tableBuffer = [];
        inTable = false;
      }
      if (inCodeBlock) {
        elements.push(
          <div
            key={`code-${idx}`}
            className="relative group my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#0d1117]"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">CODE</span>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400 leading-5">
              {codeBuffer.join("\n")}
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // 2. Table
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(line);
      return;
    } else if (inTable) {
      elements.push(renderTable(tableBuffer, idx));
      tableBuffer = [];
      inTable = false;
    }

    // 3. Regular Markdown
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={idx}
          className="text-3xl font-bold text-white mb-4 mt-8 pb-2 border-b border-slate-800"
        >
          {parseInline(line.slice(2))}
        </h1>
      );
      return;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={idx} className="text-2xl font-bold text-white mb-3 mt-6">
          {parseInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={idx} className="text-xl font-bold text-indigo-300 mb-2 mt-4">
          {parseInline(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith("#### ")) {
      elements.push(
        <h4 key={idx} className="text-lg font-bold text-slate-200 mb-2 mt-3">
          {parseInline(line.slice(5))}
        </h4>
      );
      return;
    }

    // Lists
    if (line.trim().startsWith("- [ ] ")) {
      elements.push(
        <div key={idx} className="flex gap-3 ml-2 mb-1 items-start">
          <span className="w-4 h-4 rounded border border-slate-600 mt-1 shrink-0"></span>
          <span className="text-slate-400">{parseInline(line.slice(6))}</span>
        </div>
      );
      return;
    }
    if (line.trim().startsWith("- [x] ")) {
      elements.push(
        <div key={idx} className="flex gap-3 ml-2 mb-1 items-start">
          <span className="w-4 h-4 rounded bg-emerald-600 border border-emerald-600 mt-1 shrink-0 flex items-center justify-center">
            <CheckCircle2 size={10} className="text-white" />
          </span>
          <span className="text-slate-500 line-through">
            {parseInline(line.slice(6))}
          </span>
        </div>
      );
      return;
    }
    if (line.trim().startsWith("- ")) {
      elements.push(
        <div key={idx} className="flex gap-3 ml-2 mb-1">
          <span className="text-indigo-500 font-bold">•</span>
          <span>{parseInline(line.slice(2))}</span>
        </div>
      );
      return;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      elements.push(
        <div key={idx} className="flex gap-3 ml-2 mb-1">
          <span className="text-indigo-400 font-mono text-xs mt-1">
            {line.split(".")[0]}.
          </span>
          <span>{parseInline(line.replace(/^\d+\.\s/, ""))}</span>
        </div>
      );
      return;
    }

    if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={idx}
          className="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-slate-800/30 text-slate-400 italic rounded-r-lg"
        >
          {parseInline(line.slice(2))}
        </blockquote>
      );
      return;
    }
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<div key={idx} className="h-px bg-slate-700 my-6"></div>);
      return;
    }
    if (line.trim() === "") {
      elements.push(<div key={idx} className="h-4"></div>);
      return;
    }

    elements.push(
      <p key={idx} className="leading-7 text-slate-300">
        {parseInline(line)}
      </p>
    );
  });

  if (inTable) elements.push(renderTable(tableBuffer, 9999));
  return <>{elements}</>;
};

const parseInline = (text: string) => {
  const parts = text.split(
    /(\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|\[.*?\]\(.*?\)|!\[.*?\]\(.*?\))/g
  );
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("*") && part.endsWith("*"))
      return (
        <em key={i} className="text-indigo-300">
          {part.slice(1, -1)}
        </em>
      );
    if (part.startsWith("~~") && part.endsWith("~~"))
      return (
        <s key={i} className="text-slate-500">
          {part.slice(2, -2)}
        </s>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 text-xs font-mono border border-slate-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith("![") && part.endsWith(")")) {
      const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match)
        return (
          <img
            key={i}
            src={match[2]}
            alt={match[1]}
            className="max-w-full h-auto rounded-lg my-2 border border-slate-700 shadow-lg"
          />
        );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch)
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-400 hover:underline hover:text-indigo-300 pointer-events-auto"
        >
          {linkMatch[1]}
        </a>
      );
    return part;
  });
};
