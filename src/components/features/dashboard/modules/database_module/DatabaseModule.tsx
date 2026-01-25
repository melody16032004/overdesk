import { useState, useEffect, useMemo } from "react";
import {
  Database,
  Table,
  Plus,
  Trash2,
  Play,
  Terminal,
  LayoutList,
  FileSpreadsheet,
  X,
  Search,
  Key,
  Menu,
  Download,
  RefreshCw,
  Type,
  Pencil,
  Wand2,
  Settings2,
  Check,
  AlertTriangle,
  Book,
  ChevronRight,
  ArrowLeftRight,
} from "lucide-react";
import { useToastStore } from "../../../../../stores/useToastStore";
import { Column, ColumnType, DBTable } from "./types/database_type";
import { SQL_TEMPLATES } from "./constants/database_const";
import { generateValueForColumn, executeQuery } from "./helper/database_helper";

export const DatabaseModule = ({
  onSwitchToDatabase,
}: {
  onSwitchToDatabase?: () => void;
}) => {
  // --- STATE & REFS ---
  const { showToast } = useToastStore();

  // Database State
  const [tables, setTables] = useState<DBTable[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<"data" | "structure" | "sql">(
    "data",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTableName, setNewTableName] = useState("");

  // Modal States
  const [showRowModal, setShowRowModal] = useState(false);
  const [showColModal, setShowColModal] = useState(false);

  // Editing Data State
  const [rowData, setRowData] = useState<any>({});
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colNameInput, setColNameInput] = useState("");
  const [colTypeInput, setColTypeInput] = useState<ColumnType>("string");

  // SQL State
  const [sqlQuery, setSqlQuery] = useState("");
  const [sqlResult, setSqlResult] = useState<{
    success: boolean;
    msg: string;
    data?: any[];
  } | null>(null);

  // --- HOOKS & EFFECTS ---

  // Load Initial Data
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_db_tables");
    if (saved) {
      setTables(JSON.parse(saved));
    } else {
      const demo: DBTable = {
        id: "users",
        name: "users",
        columns: [
          { id: "1", name: "id", type: "number", isPrimary: true },
          { id: "2", name: "username", type: "string" },
          { id: "3", name: "active", type: "boolean" },
        ],
        rows: [
          { id: 1, username: "admin", active: true },
          { id: 2, username: "mod", active: false },
        ],
      };
      setTables([demo]);
      setActiveTableId("users");
    }
  }, []);

  // Auto-save Data
  useEffect(() => {
    if (tables.length > 0)
      localStorage.setItem("dashboard_db_tables", JSON.stringify(tables));
  }, [tables]);

  // --- HELPERS & UTILS ---

  const activeTable = tables.find((t) => t.id === activeTableId);

  const filteredRows = useMemo(() => {
    if (!activeTable) return [];
    if (!searchQuery) return activeTable.rows;
    const lowerQ = searchQuery.toLowerCase();
    return activeTable.rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(lowerQ),
      ),
    );
  }, [activeTable, searchQuery]);

  const exportTable = (table: DBTable) => {
    const blob = new Blob([JSON.stringify(table.rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${table.name}_export.json`;
    a.click();
  };

  // --- TABLE ACTIONS ---

  const createTable = () => {
    if (!newTableName.trim()) return;
    const newTable: DBTable = {
      id: newTableName.toLowerCase().replace(/\s/g, "_"),
      name: newTableName.toLowerCase().replace(/\s/g, "_"),
      columns: [
        { id: String(Date.now()), name: "id", type: "string", isPrimary: true },
      ],
      rows: [],
    };
    setTables([...tables, newTable]);
    setActiveTableId(newTable.id);
    setNewTableName("");
    setShowCreateTable(false);
    setIsSidebarOpen(false);
  };

  const deleteTable = (id: string) => {
    const newTables = tables.filter((t) => t.id !== id);
    setTables(newTables);
    if (activeTableId === id) setActiveTableId(newTables[0]?.id || null);
    showToast("Table is deleted.", "success");
  };

  const truncateTable = (id: string) => {
    if (confirm(`TRUNCATE TABLE '${id}'?`)) {
      const updated = tables.map((t) => (t.id === id ? { ...t, rows: [] } : t));
      setTables(updated);
    }
  };

  // --- COLUMN ACTIONS ---

  const openAddColumn = () => {
    setEditingColId(null);
    setColNameInput("");
    setColTypeInput("string");
    setShowColModal(true);
  };

  const openEditColumn = (col: Column) => {
    setEditingColId(col.id);
    setColNameInput(col.name);
    setColTypeInput(col.type);
    setShowColModal(true);
  };

  const handleSaveColumn = () => {
    if (!colNameInput.trim() || !activeTableId) return;
    const cleanName = colNameInput.toLowerCase().replace(/\s/g, "_");

    const updated = tables.map((t) => {
      if (t.id !== activeTableId) return t;

      if (editingColId) {
        const oldCol = t.columns.find((c) => c.id === editingColId);
        if (!oldCol) return t;

        const newColumns = t.columns.map((c) =>
          c.id === editingColId ? { ...c, name: cleanName } : c,
        );

        let newRows = t.rows;
        if (oldCol.name !== cleanName) {
          newRows = t.rows.map((row) => {
            const newRow = { ...row };
            newRow[cleanName] = newRow[oldCol.name];
            delete newRow[oldCol.name];
            return newRow;
          });
        }
        showToast("Column name is updated.", "success");
        return { ...t, columns: newColumns, rows: newRows };
      } else {
        return {
          ...t,
          columns: [
            ...t.columns,
            { id: String(Date.now()), name: cleanName, type: colTypeInput },
          ],
        };
      }
    });

    setTables(updated);
    setShowColModal(false);
  };

  const deleteColumn = (colId: string) => {
    showToast("Column is deleted.", "success");
    const updated = tables.map((t) => {
      if (t.id !== activeTableId) return t;
      const colToDelete = t.columns.find((c) => c.id === colId);
      if (!colToDelete) return t;
      const newColumns = t.columns.filter((c) => c.id !== colId);
      const newRows = t.rows.map((row) => {
        const newRow = { ...row };
        delete newRow[colToDelete.name];
        return newRow;
      });
      return { ...t, columns: newColumns, rows: newRows };
    });
    setTables(updated);
  };

  // --- ROW ACTIONS ---

  const openAddRowModal = () => {
    setEditingRowIndex(null);
    setRowData({});
    setShowRowModal(true);
  };

  const openEditRowModal = (row: any, index: number) => {
    setEditingRowIndex(index);
    setRowData({ ...row });
    setShowRowModal(true);
  };

  const handleSaveRow = () => {
    if (!activeTable) return;

    let rowToSave = { ...rowData };
    if (editingRowIndex === null) {
      const idCol = activeTable.columns.find(
        (c) => c.name === "id" && c.type === "number",
      );
      if (idCol && !rowToSave.id) {
        const maxId = activeTable.rows.reduce(
          (max, r) => (Number(r.id) > max ? Number(r.id) : max),
          0,
        );
        rowToSave.id = maxId + 1;
      }
    }

    const updated = tables.map((t) => {
      if (t.id === activeTableId) {
        const newRows: any[] = [...t.rows];
        if (editingRowIndex !== null) newRows[editingRowIndex] = rowToSave;
        else newRows.push(rowToSave);
        return { ...t, rows: newRows };
      }
      return t;
    });
    setTables(updated);
    setShowRowModal(false);
  };

  const deleteRow = (rowIndex: number) => {
    const updated = tables.map((t) => {
      if (t.id === activeTableId) {
        const newRows: any[] = [...t.rows];
        newRows.splice(rowIndex, 1);
        return { ...t, rows: newRows };
      }
      return t;
    });
    setTables(updated);
  };

  const generateData = () => {
    if (!activeTable) return;
    const count = Number(prompt("Rows count:", "5") || 0);
    if (count <= 0) return;

    const newRows: any[] = [];
    let currentMaxId = activeTable.rows.reduce(
      (max, r) => (Number(r.id) > max ? Number(r.id) : max),
      0,
    );

    for (let i = 0; i < count; i++) {
      currentMaxId++;
      const row: any = {};
      activeTable.columns.forEach((col) => {
        row[col.name] = generateValueForColumn(col, currentMaxId);
      });
      newRows.push(row);
    }

    const updated = tables.map((t) =>
      t.id === activeTableId ? { ...t, rows: [...t.rows, ...newRows] } : t,
    );
    setTables(updated);
  };

  // --- SQL LOGIC ---

  const runSql = () => {
    const res = executeQuery(sqlQuery, tables);
    if (res.success && res.newTables) {
      setTables(res.newTables);
      if (activeTableId && !res.newTables.find((t) => t.id === activeTableId)) {
        setActiveTableId(res.newTables[0]?.id || null);
      }
    }
    setSqlResult(res);
  };

  const applyTemplate = (templateQuery: string) => {
    let query = templateQuery;
    if (activeTable) {
      query = query.replace(/table_name/g, activeTable.name);
    }
    setSqlQuery(query);
    if (window.innerWidth < 768) setIsLibraryOpen(false);
  };

  return (
    <div className="h-full flex bg-[#1e1e1e] text-slate-300 font-sans overflow-hidden relative">
      {/* 1. SIDEBAR */}
      <div
        className={`absolute md:relative inset-y-0 left-0 z-30 w-64 border-r border-[#3e3e42] bg-[#252526] flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-[#3e3e42] flex items-center justify-between bg-[#2d2d2d]">
          <div className="flex items-center gap-2 font-bold text-white">
            <Database size={18} className="text-orange-500" />
            <span className="tracking-tight">LocalDB</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {tables.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setActiveTableId(t.id);
                setIsSidebarOpen(false);
                setSearchQuery("");
              }}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg pointer text-xs font-medium transition-all ${
                activeTableId === t.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-[#3e3e42] text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Table size={14} /> <span className="truncate">{t.name}</span>
              </div>
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportTable(t);
                  }}
                  className="p-1 hover:text-green-300"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTable(t.id);
                  }}
                  className="p-1 hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-[#3e3e42] bg-[#1e1e1e]">
          <button
            onClick={() => setShowCreateTable(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:text-white hover:border-slate-400 hover:bg-[#3e3e42] text-xs font-bold transition-all"
          >
            <Plus size={14} /> New Table
          </button>
        </div>
      </div>
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
        <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#252526] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm z-10">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto ">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 bg-[#3e3e42] rounded-md text-slate-300"
              >
                <Menu size={16} />
              </button>

              <div className="flex flex-col">
                <div className="font-bold text-white flex items-center gap-2 text-sm md:text-base">
                  {activeTable ? (
                    <>
                      <Table size={16} className="text-blue-400" />{" "}
                      {activeTable.name}
                    </>
                  ) : (
                    <span className="text-slate-500 italic w-full">
                      No table selected
                    </span>
                  )}
                </div>
                {activeTable && (
                  <span className="text-[10px] text-slate-500">
                    {activeTable.rows.length} records
                  </span>
                )}
              </div>
            </div>
            {onSwitchToDatabase && (
              <button
                onClick={onSwitchToDatabase}
                className="flex items-center justify-center w-full gap-2 px-4 py-2 border border-[#3e3e42] rounded-lg hover:bg-[#252526] transition-colors"
              >
                <ArrowLeftRight size={16} /> Go to ERD
              </button>
            )}
          </div>

          {activeTable && (
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <div className="flex bg-[#1e1e1e] rounded-lg p-1 border border-[#3e3e42] shrink-0">
                <button
                  onClick={() => setActiveTab("data")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors ${
                    activeTab === "data"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet size={14} /> Data
                </button>
                <button
                  onClick={() => setActiveTab("structure")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors ${
                    activeTab === "structure"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutList size={14} /> Structure
                </button>
                <button
                  onClick={() => {
                    setActiveTab("sql");
                    setSqlQuery(`SELECT * FROM ${activeTable.name}`);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors ${
                    activeTab === "sql"
                      ? "bg-orange-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Terminal size={14} /> SQL
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
          {!activeTable && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
              <Database size={64} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">
                Select a table to manage data
              </p>
            </div>
          )}

          {/* TAB: BROWSE */}
          {activeTable && activeTab === "data" && (
            <div className="flex flex-col h-full">
              <div className="flex-none p-3 border-b border-[#3e3e42] bg-[#1e1e1e] flex flex-col md:flex-row gap-2 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rows..."
                    className="w-full bg-[#252526] border border-[#3e3e42] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={generateData}
                    className="px-3 py-1.5 border border-[#3e3e42] hover:bg-purple-500/10 hover:text-purple-400 text-slate-400 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Wand2 size={14} /> Gen Data
                  </button>
                  <button
                    onClick={() => truncateTable(activeTable.id)}
                    className="px-3 py-1.5 border border-[#3e3e42] hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <RefreshCw size={14} /> Clear
                  </button>
                  <button
                    onClick={openAddRowModal}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                  >
                    <Plus size={14} /> Insert
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-0 md:p-4 bg-[#1e1e1e]">
                <div className="border-y md:border border-[#3e3e42] md:rounded-lg overflow-hidden bg-[#252526] min-w-full inline-block align-middle">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-[#2d2d2d] text-slate-300 font-bold border-b border-[#3e3e42] sticky top-0 z-10">
                      <tr>
                        {activeTable.columns.map((c) => (
                          <th
                            key={c.id}
                            className="px-4 py-3 border-r border-[#3e3e42] last:border-0 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              {c.isPrimary && (
                                <Key size={12} className="text-yellow-500" />
                              )}{" "}
                              {c.name}
                              <span className="text-[9px] font-normal text-slate-500 bg-[#1e1e1e] px-1 rounded ml-1">
                                {c.type}
                              </span>
                            </div>
                          </th>
                        ))}
                        <th className="px-2 py-3 w-16 text-center sticky right-0 bg-[#2d2d2d] border-l border-[#3e3e42]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3e3e42]">
                      {filteredRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-[#323233] transition-colors group"
                        >
                          {activeTable.columns.map((c) => (
                            <td
                              key={c.id}
                              className="px-4 py-2.5 border-r border-[#3e3e42] last:border-0 text-slate-300 whitespace-nowrap max-w-[200px] truncate"
                            >
                              {String(row[c.name])}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center sticky right-0 bg-[#252526] group-hover:bg-[#323233] border-l border-[#3e3e42]">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditRowModal(row, idx)}
                                className="text-slate-500 hover:text-blue-400 p-1 rounded hover:bg-white/5"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => deleteRow(idx)}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-white/5"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: STRUCTURE */}
          {activeTable && activeTab === "structure" && (
            <div className="p-4 overflow-y-auto custom-scrollbar h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Table Schema
                </h3>
                <button
                  onClick={openAddColumn}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg"
                >
                  <Plus size={14} /> Add Column
                </button>
              </div>
              <div className="bg-[#252526] border border-[#3e3e42] rounded-xl overflow-hidden shadow-sm">
                {activeTable.columns.map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between p-4 ${
                      i !== activeTable.columns.length - 1
                        ? "border-b border-[#3e3e42]"
                        : ""
                    } hover:bg-[#2d2d2d] transition-colors group`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          c.isPrimary
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-slate-700/30 text-slate-400"
                        }`}
                      >
                        {c.isPrimary ? (
                          <Key size={16} />
                        ) : (
                          <LayoutList size={16} />
                        )}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-blue-400 font-bold">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">
                          {c.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.isPrimary && (
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded font-bold border border-yellow-500/20">
                          PK
                        </span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditColumn(c)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded"
                          title="Edit Column"
                        >
                          <Settings2 size={14} />
                        </button>
                        {!c.isPrimary && (
                          <button
                            onClick={() => deleteColumn(c.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded"
                            title="Delete Column"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SQL & LIBRARY */}
          {activeTable && activeTab === "sql" && (
            <div className="flex h-full overflow-hidden">
              {/* SQL EDITOR */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-[#3e3e42] bg-[#1e1e1e]">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">
                      Query Console
                    </div>
                    <button
                      onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                      className={`text-xs flex items-center gap-1 font-bold transition-colors ${
                        isLibraryOpen
                          ? "text-orange-500"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Book size={14} /> Library
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full bg-[#252526] border border-[#3e3e42] rounded-xl px-4 py-3 text-sm font-mono text-green-400 focus:border-green-500/50 outline-none resize-none h-24 shadow-inner"
                      placeholder="SELECT * FROM users..."
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={runSql}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center gap-2 text-xs shadow-lg"
                      >
                        <Play size={14} /> Run Query
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 bg-[#252526] overflow-hidden flex flex-col">
                  {sqlResult ? (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2">
                      <div
                        className={`p-3 mb-3 rounded-lg text-xs font-mono border ${
                          sqlResult.success
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {sqlResult.success ? (
                          <Check size={14} className="inline mr-2" />
                        ) : (
                          <X size={14} className="inline mr-2" />
                        )}
                        {sqlResult.msg}
                      </div>
                      {sqlResult.data && (
                        <div className="flex-1 overflow-auto border border-[#3e3e42] rounded-lg bg-[#1e1e1e] p-4 custom-scrollbar">
                          <pre className="text-xs font-mono text-slate-300">
                            {JSON.stringify(sqlResult.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs opacity-50">
                      <Terminal size={32} className="mb-2" />
                      <p>Results will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SQL LIBRARY DRAWER */}
              <div
                className={`border-l border-[#3e3e42] bg-[#252526] flex flex-col transition-all duration-300 ease-in-out ${
                  isLibraryOpen ? "w-64" : "w-0 overflow-hidden opacity-0"
                }`}
              >
                <div className="flex-none p-3 border-b border-[#3e3e42] flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Templates
                  </span>
                  <button onClick={() => setIsLibraryOpen(false)}>
                    <X size={16} className="text-slate-500 hover:text-white" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {SQL_TEMPLATES.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => applyTemplate(item.query)}
                      className="w-full text-left p-3 rounded-lg hover:bg-[#3e3e42] group border border-transparent hover:border-[#454545] transition-all relative"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-200 text-xs group-hover:text-orange-400">
                          {item.label}
                        </span>
                        <ChevronRight
                          size={12}
                          className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ROW */}
      {showRowModal && activeTable && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-md bg-[#252526] border border-[#3e3e42] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                {editingRowIndex !== null ? (
                  <Pencil size={16} className="text-yellow-500" />
                ) : (
                  <Plus size={16} className="text-blue-500" />
                )}{" "}
                {editingRowIndex !== null ? "Edit Row" : "Insert Row"}
              </h3>
              <button onClick={() => setShowRowModal(false)}>
                <X size={18} className="text-slate-400 hover:text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {activeTable.columns.map((c) => (
                <div key={c.id}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {c.name}{" "}
                    <span className="text-slate-600 font-normal">
                      ({c.type})
                    </span>
                  </label>
                  {c.type === "boolean" ? (
                    <select
                      value={
                        rowData[c.name] === undefined
                          ? "false"
                          : String(rowData[c.name])
                      }
                      onChange={(e) =>
                        setRowData({
                          ...rowData,
                          [c.name]: e.target.value === "true",
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 appearance-none"
                    >
                      <option value="false">False</option>
                      <option value="true">True</option>
                    </select>
                  ) : (
                    <input
                      type={c.type === "number" ? "number" : "text"}
                      value={rowData[c.name] || ""}
                      placeholder={
                        c.isPrimary &&
                        c.type === "number" &&
                        editingRowIndex === null
                          ? "(Auto Increment)"
                          : ""
                      }
                      disabled={
                        c.isPrimary &&
                        c.type === "number" &&
                        editingRowIndex === null
                      }
                      onChange={(e) =>
                        setRowData({
                          ...rowData,
                          [c.name]:
                            c.type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-blue-500 outline-none disabled:opacity-50 placeholder:text-slate-600"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#3e3e42] flex gap-2">
              <button
                onClick={() => setShowRowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3e3e42] hover:bg-[#4e4e52] text-sm font-bold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRow}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COLUMN */}
      {showColModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d2d] flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                {editingColId ? (
                  <Settings2 size={16} className="text-purple-500" />
                ) : (
                  <Plus size={16} className="text-purple-500" />
                )}{" "}
                {editingColId ? "Edit Column" : "Add Column"}
              </h3>
              <button onClick={() => setShowColModal(false)}>
                <X size={18} className="text-slate-400 hover:text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                  Column Name
                </label>
                <input
                  value={colNameInput}
                  onChange={(e) => setColNameInput(e.target.value)}
                  placeholder="e.g. email"
                  className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex justify-between">
                  Data Type{" "}
                  {editingColId && (
                    <span className="text-red-400 flex items-center gap-1 text-[9px]">
                      <AlertTriangle size={10} /> Locked
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={colTypeInput}
                    onChange={(e) =>
                      setColTypeInput(e.target.value as ColumnType)
                    }
                    disabled={!!editingColId}
                    className={`w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-3 py-2.5 text-sm text-white focus:border-purple-500 outline-none appearance-none ${
                      !!editingColId
                        ? "opacity-50 cursor-not-allowed text-slate-400"
                        : "pointer"
                    }`}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                  <Type
                    size={14}
                    className="absolute right-3 top-3 pointer-events-none text-slate-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#3e3e42] flex gap-2">
              <button
                onClick={() => setShowColModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3e3e42] hover:bg-[#4e4e52] text-sm font-bold text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveColumn}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-bold text-white shadow-lg"
              >
                Save Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TABLE */}
      {showCreateTable && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in-95">
          <div className="w-full max-w-sm bg-[#252526] border border-[#3e3e42] rounded-2xl shadow-2xl p-5">
            <h3 className="text-lg font-bold text-white mb-4">
              Create New Table
            </h3>
            <input
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="e.g. products"
              className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded-xl px-4 py-3 text-sm text-white mb-4 outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateTable(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3e3e42] text-white text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={createTable}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
