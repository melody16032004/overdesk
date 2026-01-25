export type TestStatus = "draft" | "passed" | "failed" | "blocked";
export type Priority = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
}

export interface TestCase {
  id: string;
  code: string;
  projectId: string;
  title: string;
  precondition: string;
  steps: string;
  expected: string;
  actual: string;
  status: TestStatus;
  priority: Priority;
}

export interface ModalState {
  isOpen: boolean;
  type:
    | "delete_case"
    | "add_project"
    | "delete_project"
    | "rename_project"
    | "move_copy"
    | null;
  targetId: string | null;
  inputValue?: string;
  actionType?: "move" | "copy";
}
