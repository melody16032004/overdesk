interface Task {
  id: string;
  content: string;
  isDone: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: number; // Timestamp
  tags: string[];
}

// Dùng middleware 'persist' của Zustand để lưu vào localStorage/IndexedDB