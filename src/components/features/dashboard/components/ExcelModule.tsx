import { useState, useEffect, useRef } from "react";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
import {
  Save,
  FileSpreadsheet,
  CheckCircle2,
  FileUp,
  Plus,
  AlertTriangle,
} from "lucide-react";
import ExcelJS from "exceljs";
// --- TAURI IMPORTS ---
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";

// --- DỮ LIỆU MẪU ---
const TEMPLATE_BLANK = [{ name: "Sheet1", celldata: [] }];

// --- 1. TOAST NOTIFICATION ---
const Toast = ({ msg }: { msg: string }) => {
  if (!msg) return null;
  return (
    <div className="fixed bottom-5 right-5 bg-slate-800 text-white px-4 py-3 rounded shadow-lg z-[9999] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
      <CheckCircle2 size={16} className="text-green-400" /> {msg}
    </div>
  );
};

// --- 2. CUSTOM MODAL (Thay thế Confirm) ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full shrink-0 bg-amber-100 text-amber-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            Đồng ý tạo mới
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExcelModule = () => {
  // --- STATE ---
  const [renderKey, setRenderKey] = useState(0);
  const [sheetData, setSheetData] = useState<any>(TEMPLATE_BLANK);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState("Untitled");
  const [isDirty, setIsDirty] = useState(false);

  // UI State
  const [statusMsg, setStatusMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Modal State
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false });

  const workbookRef = useRef<any>(null);

  // --- HELPERS ---
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // --- LOGIC IMPORT ---
  const extractCellValue = (cell: any) => {
    let val = cell.value;
    let formula = null;
    if (val && typeof val === "object") {
      if ("formula" in val) {
        formula = `=${(val as any).formula}`;
        val = (val as any).result;
      } else if ("richText" in val) {
        val = (val as any).richText.map((t: any) => t.text).join("");
      } else if ("hyperlink" in val) {
        val = (val as any).text || (val as any).hyperlink;
      }
      if (val && typeof val === "object" && "error" in val) val = "";
    }
    if (val instanceof Date) val = val.toLocaleDateString();
    return { val, formula };
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Excel Files", extensions: ["xlsx", "xls"] }],
      });
      if (selected && typeof selected === "string") {
        setStatusMsg("Loading...");
        const fileData = await readFile(selected);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileData.buffer);

        const newSheets: any[] = [];
        workbook.eachSheet((worksheet) => {
          const celldata: any[] = [];
          const config: any = { columnlen: {}, rowlen: {} };
          worksheet.columns?.forEach((col, idx) => {
            if (col.width) config.columnlen[idx] = col.width * 7;
          });
          worksheet.eachRow((row, rowIndex) => {
            if (row.height) config.rowlen[rowIndex - 1] = row.height;
            row.eachCell((cell, colIndex) => {
              const { val, formula } = extractCellValue(cell);
              const cellData: any = {
                r: rowIndex - 1,
                c: colIndex - 1,
                v: { v: val, m: String(val ?? ""), f: formula },
              };
              if (cell.font?.bold) cellData.v.bl = 1;
              if (cell.font?.italic) cellData.v.it = 1;
              if (cell.font?.color?.argb) {
                let c = cell.font.color.argb;
                if (c.length > 6) c = c.slice(2);
                const isWhite = c.toLowerCase() === "ffffff";
                const hasBg = !!(
                  cell.fill?.type === "pattern" && cell.fill.fgColor?.argb
                );
                if (!isWhite || hasBg) cellData.v.fc = `#${c}`;
              }
              if (cell.fill?.type === "pattern" && cell.fill.fgColor?.argb) {
                let c = cell.fill.fgColor.argb;
                if (c.length > 6) c = c.slice(2);
                cellData.v.bg = `#${c}`;
              }
              celldata.push(cellData);
            });
          });
          newSheets.push({ name: worksheet.name, celldata, config });
        });

        if (newSheets.length > 0) {
          setSheetData(newSheets);
          setFilePath(selected);
          setFileName(
            selected
              .split(/[\\/]/)
              .pop()
              ?.replace(/\.xlsx$/i, "") || "Untitled"
          );
          setIsDirty(false);
          setRenderKey((prev) => prev + 1);
          setStatusMsg("Loaded");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi đọc file: " + e);
      setStatusMsg("Error");
    }
  };

  // --- LOGIC SAVE ---
  const generateExcelBuffer = async () => {
    if (!workbookRef.current) return null;
    const sheets = workbookRef.current.getAllSheets();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Overdesk";
    workbook.created = new Date();

    sheets.forEach((sheet: any) => {
      const ws = workbook.addWorksheet(sheet.name || "Sheet1");
      const cells = sheet.celldata || [];
      if (sheet.data && sheet.data.length > 0) {
        sheet.data.forEach((row: any[], r: number) => {
          row?.forEach((cell: any, c: number) => {
            if (cell) cells.push({ r, c, v: cell });
          });
        });
      }
      cells.forEach((item: any) => {
        if (!item || !item.v) return;
        const { r, c, v } = item;
        const row = ws.getRow(r + 1);
        const cell = row.getCell(c + 1);
        cell.value = v.v !== undefined ? v.v : v.m || "";
        cell.font = {
          name: v.ff || "Arial",
          size: v.fs || 11,
          bold: !!v.bl,
          italic: !!v.it,
          strike: !!v.cl,
          color: { argb: v.fc ? v.fc.replace("#", "") : "FF000000" },
        };
        if (v.bg)
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: v.bg.replace("#", "") },
          };
      });
      if (sheet.config?.columnlen) {
        Object.keys(sheet.config.columnlen).forEach((k) => {
          ws.getColumn(parseInt(k) + 1).width = sheet.config.columnlen[k] / 7;
        });
      }
    });
    return await workbook.xlsx.writeBuffer();
  };

  const executeSave = async () => {
    try {
      const buffer = await generateExcelBuffer();
      if (!buffer) {
        alert("Lỗi: Không lấy được dữ liệu!");
        return;
      }
      const data = new Uint8Array(buffer);

      let targetPath = filePath;
      if (filePath) {
        const currentNameInPath = filePath
          .split(/[\\/]/)
          .pop()
          ?.replace(/\.xlsx$/i, "");
        if (currentNameInPath !== fileName) targetPath = null;
      }

      if (!targetPath) {
        targetPath = await save({
          filters: [{ name: "Excel", extensions: ["xlsx"] }],
          defaultPath: `${fileName}.xlsx`,
        });
      }

      if (targetPath) {
        await writeFile(targetPath, data);
        setFilePath(targetPath);
        setFileName(
          targetPath
            .split(/[\\/]/)
            .pop()
            ?.replace(/\.xlsx$/i, "") || "Untitled"
        );
        setIsDirty(false);
        showToast("Đã lưu file thành công!");
        setStatusMsg("Saved");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu: " + e);
    }
  };

  // --- HANDLE OPS & SHORTCUT ---
  const handleOp = () => {
    if (!isDirty) setIsDirty(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopImmediatePropagation();
        document.getElementById("btn-hidden-save")?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  // --- LOAD TEMPLATE (DÙNG MODAL) ---
  const initiateLoadTemplate = (tpl: any) => {
    if (isDirty) {
      setModalConfig({
        isOpen: true,
        title: "Tạo mới?",
        message:
          "Dữ liệu hiện tại chưa được lưu và sẽ bị mất. Bạn có chắc chắn muốn tạo bảng tính mới không?",
        onConfirm: () => {
          loadTemplateNow(tpl);
          setModalConfig({ isOpen: false });
        },
        onCancel: () => setModalConfig({ isOpen: false }),
      });
    } else {
      loadTemplateNow(tpl);
    }
  };

  const loadTemplateNow = (tpl: any) => {
    setSheetData(tpl);
    setFilePath(null);
    setFileName("Untitled");
    setRenderKey((k) => k + 1);
    setIsDirty(false);
    showToast("Đã tạo bảng tính mới");
  };

  return (
    <div className="h-full flex flex-col bg-white text-slate-900 relative">
      <Toast msg={toastMsg} />
      <ConfirmModal {...modalConfig} />

      {/* Hidden button for shortcut */}
      <button
        id="btn-hidden-save"
        className="hidden"
        onClick={executeSave}
      ></button>

      {/* TOOLBAR */}
      <div className="h-14 border-b border-slate-200 flex items-center px-4 justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded text-white shadow">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="font-bold text-sm bg-transparent outline-none w-20 border-b border-transparent focus:border-green-500 hover:bg-slate-200/50 rounded px-1 transition-all"
            />
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              {isDirty ? (
                <span className="text-amber-500">● Unsaved</span>
              ) : (
                <span className="text-green-600">● Saved</span>
              )}
              {statusMsg && (
                <span className="text-slate-400">- {statusMsg}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => initiateLoadTemplate(TEMPLATE_BLANK)}
            className="p-2 hover:bg-slate-200 rounded text-slate-600"
            title="New Blank"
          >
            <Plus size={16} />
          </button>
          <div className="h-4 w-[1px] bg-slate-300 mx-1"></div>

          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-50 shadow-sm active:scale-95"
          >
            <FileUp size={14} /> Open
          </button>
          <button
            onClick={executeSave}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500 shadow-sm active:scale-95"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      {/* CONTAINER */}
      <div className="flex-1 w-full relative overflow-hidden bg-white">
        <Workbook
          key={renderKey}
          ref={workbookRef}
          data={sheetData}
          onOp={handleOp}
          defaultColWidth={100}
          defaultRowHeight={25}
          row={100}
          column={50}
        />
      </div>
    </div>
  );
};
