// src/stores/useDataStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  isPinned?: boolean;
}

export interface NoteViewSettings {
  mode: "list" | "grid";
  gridColumns: number;
  sortBy: "updated" | "created" | "alpha"; // New: Tùy chọn sắp xếp
}

export interface Task {
  id: number;
  text: string;
  done: boolean;
  dueDate?: string; // ISO Date String
  priority?: "low" | "medium" | "high";
}

interface DataState {
  // State
  tasks: Task[];
  noteContent: string;
  timerSettings: { work: number; break: number };

  // --- NOTES STATE ---
  notes: Note[];
  noteViewSettings: NoteViewSettings;
  // -------------------

  // Actions
  addTask: (task: {
    text: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
  }) => void;
  updateTask: (id: number, updates: Partial<Omit<Task, "id">>) => void;
  toggleTask: (id: number) => void;
  deleteTask: (id: number) => void;
  reorderTasks: (newOrder: Task[]) => void;

  // --- NOTES ACTIONS ---
  addNote: () => string; // Trả về ID của note mới tạo
  updateNote: (
    id: string,
    updates: { title?: string; content?: string }
  ) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  setNoteViewMode: (mode: "list" | "grid") => void;
  setGridColumns: (cols: number) => void;
  setSortBy: (sortBy: "updated" | "created" | "alpha") => void;
  setNoteContent: (content: string) => void;
  // ---------------------

  resetData: () => void;
  updateTimerSettings: (work: number, breakTime: number) => void;
  importData: (data: any) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      tasks: [],
      noteContent: "# Ý tưởng hôm nay\n- ",
      timerSettings: { work: 25, break: 5 },

      // --- INITIAL NOTES STATE ---
      notes: [
        {
          id: "default",
          title: "Chào mừng!",
          content:
            "# Chào mừng đến với Notes Pro\n- Hãy thử ghim ghi chú này!\n- Tìm kiếm siêu nhanh.",
          updatedAt: Date.now(),
          isPinned: true,
        },
      ],
      noteViewSettings: { mode: "list", gridColumns: 2, sortBy: "updated" },
      // ---------------------------

      addTask: (newTask) =>
        set((state) => ({
          tasks: [
            {
              id: Date.now(),
              text: newTask.text,
              done: false,
              dueDate: newTask.dueDate,
              priority: newTask.priority,
            },
            ...state.tasks,
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      setNoteContent: (content) => set({ noteContent: content }),

      reorderTasks: (newOrder) => set({ tasks: newOrder }),

      // --- NOTES ACTIONS IMPLEMENTATION ---
      addNote: () => {
        const id = crypto.randomUUID();
        const newNote: Note = {
          id,
          title: "Ghi chú mới",
          content: "",
          updatedAt: Date.now(),
          isPinned: false,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        return id;
      },

      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) => {
            if (n.id !== id) return n;

            return {
              ...n,
              ...updates, // Áp dụng các thay đổi (title hoặc content)
              updatedAt: Date.now(),
            };
          }),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      togglePinNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n
          ),
        })),

      setNoteViewMode: (mode) =>
        set((state) => ({
          noteViewSettings: { ...state.noteViewSettings, mode },
        })),

      setGridColumns: (cols) =>
        set((state) => ({
          noteViewSettings: { ...state.noteViewSettings, gridColumns: cols },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          noteViewSettings: { ...state.noteViewSettings, sortBy },
        })),
      // ------------------------------------

      resetData: () =>
        set({
          tasks: [],
          noteContent: "# Today's Notes\n- ",
        }),

      updateTimerSettings: (work, breakTime) =>
        set({ timerSettings: { work, break: breakTime } }),

      importData: (data) =>
        set({
          tasks: data.tasks || [],
          noteContent: data.noteContent || "",
          timerSettings: data.timerSettings || { work: 25, break: 5 },
        }),
    }),
    {
      name: "overdesk-data", // Tên key trong LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
