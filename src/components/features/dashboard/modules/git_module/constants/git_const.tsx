export const COMMIT_TYPES = [
  { value: "feat", label: "Feature", desc: "A new feature" },
  { value: "fix", label: "Fix", desc: "A bug fix" },
  { value: "docs", label: "Docs", desc: "Documentation only" },
  {
    value: "style",
    label: "Style",
    desc: "Formatting, missing semi colons, etc",
  },
  {
    value: "refactor",
    label: "Refactor",
    desc: "Code change that neither fixes a bug nor adds a feature",
  },
  { value: "perf", label: "Perf", desc: "Improve performance" },
  { value: "test", label: "Test", desc: "Adding tests" },
  { value: "chore", label: "Chore", desc: "Build process or aux tools" },
];

export const CHEATSHEET = [
  { cmd: "git init", desc: "Initialize a new repository" },
  { cmd: "git clone [url]", desc: "Clone a repository" },
  { cmd: "git status", desc: "Check file status" },
  { cmd: "git add .", desc: "Stage all changes" },
  { cmd: "git commit -m 'msg'", desc: "Commit with message" },
  { cmd: "git push origin main", desc: "Push to remote" },
  { cmd: "git pull", desc: "Pull latest changes" },
  { cmd: "git branch", desc: "List branches" },
  { cmd: "git checkout -b [name]", desc: "Create & switch branch" },
  { cmd: "git merge [branch]", desc: "Merge branch" },
  { cmd: "git log --oneline", desc: "View compact history" },
  { cmd: "git stash", desc: "Save changes temporarily" },
  { cmd: "git reset --soft HEAD~1", desc: "Undo commit, keep changes" },
];
