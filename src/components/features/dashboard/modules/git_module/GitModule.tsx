import { useState, useEffect } from "react";
import {
  GitBranch,
  Terminal,
  Copy,
  Check,
  Search,
  Github,
  Book,
  Star,
  Folder,
  History,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { COMMIT_TYPES, CHEATSHEET } from "./constants/git_const";
import { Tab, GitHubProfile, GitHubRepo } from "./types/git_type";

export const GitModule = () => {
  // --- 1. STATE MANAGEMENT ---

  // A. UI State
  const [activeTab, setActiveTab] = useState<Tab>("generator");
  const [copied, setCopied] = useState(false);

  // B. Generator State
  const [genAction, setGenAction] = useState("smart_commit");
  const [genInput1, setGenInput1] = useState("");
  const [genInput2, setGenInput2] = useState("");
  const [commitType, setCommitType] = useState("feat"); // Smart Commit Specifics
  const [commitScope, setCommitScope] = useState("");
  const [generatedCmd, setGeneratedCmd] = useState("");

  // C. GitHub Explorer State
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [history, setHistory] = useState<{ login: string; avatar: string }[]>(
    [],
  );

  // --- 2. EFFECTS (LIFECYCLE & REACTION) ---

  // Effect 1: Load GitHub History on Mount
  useEffect(() => {
    const saved = localStorage.getItem("git_explorer_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Effect 2: Auto-generate Command (Reactive Logic)
  useEffect(() => {
    let cmd = "";
    switch (genAction) {
      case "smart_commit":
        const scope = commitScope ? `(${commitScope})` : "";
        cmd = `git add .\ngit commit -m "${commitType}${scope}: ${genInput1 || "description"}"`;
        break;
      case "config":
        cmd = `git config --global user.name "${genInput1 || "Your Name"}"\ngit config --global user.email "${genInput2 || "email@example.com"}"`;
        break;
      case "branch":
        cmd = `git checkout -b ${genInput1 || "feature/new-branch"}`;
        break;
      case "push":
        cmd = `git push -u origin ${genInput1 || "main"}`;
        break;
      case "force_push":
        cmd = `git push origin ${genInput1 || "main"} --force`;
        break;
      case "tag":
        cmd = `git tag -a v${genInput1 || "1.0.0"} -m "${genInput2 || "Release version 1.0"}"\ngit push origin --tags`;
        break;
      case "log":
        cmd = `git log --graph --oneline --all --decorate`;
        break;
    }
    setGeneratedCmd(cmd);
  }, [genAction, genInput1, genInput2, commitType, commitScope]);

  // --- 3. HELPER FUNCTIONS (LOGIC) ---

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- 4. GITHUB LOGIC HANDLERS ---

  const addToHistory = (user: GitHubProfile) => {
    setHistory((prev) => {
      // Lọc bỏ trùng lặp và giữ lại 5 người gần nhất
      const filtered = prev.filter((h) => h.login !== user.login);
      const newHistory = [
        { login: user.login, avatar: user.avatar_url },
        ...filtered,
      ].slice(0, 5);
      localStorage.setItem("git_explorer_history", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const removeHistory = (e: React.MouseEvent, login: string) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h.login !== login);
    setHistory(newHistory);
    localStorage.setItem("git_explorer_history", JSON.stringify(newHistory));
  };

  const fetchGitHub = async (targetUser = username) => {
    if (!targetUser) return;
    setLoading(true);
    setUsername(targetUser); // Sync input UI

    try {
      // 1. Fetch Profile
      const resProfile = await fetch(
        `https://api.github.com/users/${targetUser}`,
      );
      if (!resProfile.ok) throw new Error("User not found");
      const dataProfile = await resProfile.json();

      setProfile(dataProfile);
      addToHistory(dataProfile);

      // 2. Fetch Repos
      const resRepos = await fetch(
        `https://api.github.com/users/${targetUser}/repos?sort=updated&per_page=5`,
      );
      const dataRepos = await resRepos.json();
      setRepos(dataRepos);
    } catch (error) {
      alert("User not found or API limit reached");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-slate-300 font-sans relative overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex-none p-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
        <div className="flex items-center gap-2">
          <div className="text-[#f78166]">
            <GitBranch size={20} />
          </div>
          <h2 className="font-bold text-white tracking-tight">Git Center</h2>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#0d1117] rounded-lg p-1 border border-[#30363d]">
          <button
            onClick={() => setActiveTab("generator")}
            className={`p-1.5 rounded-md transition-all ${
              activeTab === "generator"
                ? "bg-[#238636] text-white"
                : "hover:text-white"
            }`}
          >
            <Terminal size={16} />
          </button>
          <button
            onClick={() => setActiveTab("github")}
            className={`p-1.5 rounded-md transition-all ${
              activeTab === "github"
                ? "bg-[#1f6feb] text-white"
                : "hover:text-white"
            }`}
          >
            <Github size={16} />
          </button>
          <button
            onClick={() => setActiveTab("cheatsheet")}
            className={`p-1.5 rounded-md transition-all ${
              activeTab === "cheatsheet"
                ? "bg-[#a371f7] text-white"
                : "hover:text-white"
            }`}
          >
            <Book size={16} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {/* --- TAB 1: SMART COMMAND GENERATOR --- */}
        {activeTab === "generator" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {/* Actions Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setGenAction("smart_commit")}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  genAction === "smart_commit"
                    ? "border-[#238636] text-[#238636] bg-[#238636]/10"
                    : "border-[#30363d] hover:border-slate-500"
                }`}
              >
                Smart Commit
              </button>
              <button
                onClick={() => setGenAction("branch")}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  genAction === "branch"
                    ? "border-[#f78166] text-[#f78166] bg-[#f78166]/10"
                    : "border-[#30363d] hover:border-slate-500"
                }`}
              >
                Branch
              </button>
              <button
                onClick={() => setGenAction("push")}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  genAction === "push"
                    ? "border-[#1f6feb] text-[#1f6feb] bg-[#1f6feb]/10"
                    : "border-[#30363d] hover:border-slate-500"
                }`}
              >
                Push
              </button>
              <button
                onClick={() => setGenAction("config")}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  genAction === "config"
                    ? "border-[#a371f7] text-[#a371f7] bg-[#a371f7]/10"
                    : "border-[#30363d] hover:border-slate-500"
                }`}
              >
                Config
              </button>
              <button
                onClick={() => setGenAction("tag")}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  genAction === "tag"
                    ? "border-[#f78166] text-[#f78166] bg-[#f78166]/10"
                    : "border-[#30363d] hover:border-slate-500"
                }`}
              >
                Tag
              </button>
              <button
                onClick={() => setGenAction("force_push")}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  genAction === "force_push"
                    ? "border-red-500 text-red-500 bg-red-500/10"
                    : "border-[#30363d] hover:border-red-500 hover:text-red-500"
                }`}
              >
                Force Push
              </button>
            </div>

            {/* Dynamic Inputs */}
            <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d] space-y-3">
              {genAction === "smart_commit" ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <Sparkles size={12} className="text-yellow-400" />{" "}
                    Conventional Commit Builder
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={commitType}
                      onChange={(e) => setCommitType(e.target.value)}
                      className="bg-[#010409] border border-[#30363d] rounded px-2 py-2 text-xs text-white focus:border-[#238636] outline-none pointer"
                    >
                      {COMMIT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={commitScope}
                      onChange={(e) => setCommitScope(e.target.value)}
                      placeholder="Scope (e.g. auth, ui)..."
                      className="flex-1 bg-[#010409] border border-[#30363d] rounded px-3 py-2 text-xs focus:border-[#238636] outline-none"
                    />
                  </div>
                  <input
                    value={genInput1}
                    onChange={(e) => setGenInput1(e.target.value)}
                    placeholder="Short description (e.g. add login button)"
                    className="w-full bg-[#010409] border border-[#30363d] rounded px-3 py-2 text-xs focus:border-[#238636] outline-none"
                  />
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    value={genInput1}
                    onChange={(e) => setGenInput1(e.target.value)}
                    placeholder={
                      genAction === "branch"
                        ? "Branch name"
                        : genAction === "push" || genAction === "force_push"
                          ? "Branch (main)"
                          : genAction === "config"
                            ? "User Name"
                            : "Value 1"
                    }
                    className="w-full bg-[#010409] border border-[#30363d] rounded px-3 py-2 text-xs focus:border-[#f78166] outline-none"
                  />
                  {(genAction === "config" || genAction === "tag") && (
                    <input
                      value={genInput2}
                      onChange={(e) => setGenInput2(e.target.value)}
                      placeholder={
                        genAction === "config" ? "User Email" : "Tag Message"
                      }
                      className="w-full bg-[#010409] border border-[#30363d] rounded px-3 py-2 text-xs focus:border-[#f78166] outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Terminal Output */}
            <div
              className={`relative bg-black rounded-lg p-3 border group ${
                genAction === "force_push"
                  ? "border-red-500/50"
                  : "border-[#30363d]"
              }`}
            >
              <div className="flex gap-1.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
              {genAction === "force_push" && (
                <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mb-1">
                  <AlertTriangle size={10} /> DANGEROUS COMMAND
                </div>
              )}
              <pre className="font-mono text-sm text-[#7ee787] whitespace-pre-wrap">
                {generatedCmd}
              </pre>
              <button
                onClick={() => handleCopy(generatedCmd)}
                className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-white rounded transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: GITHUB EXPLORER --- */}
        {activeTab === "github" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
            {/* Search Bar */}
            <div className="flex gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchGitHub()}
                placeholder="GitHub Username..."
                className="flex-1 bg-[#010409] border border-[#30363d] rounded-md px-3 py-2 text-sm focus:border-[#1f6feb] outline-none text-white placeholder:text-slate-600"
              />
              <button
                onClick={() => fetchGitHub()}
                disabled={loading}
                className="bg-[#238636] hover:bg-[#2ea043] text-white px-3 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "..." : <Search size={16} />}
              </button>
            </div>

            {/* 👇 HISTORY BAR (NEW) */}
            {history.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  <History size={12} /> Recent:
                </div>
                {history.map((h) => (
                  <div
                    key={h.login}
                    onClick={() => fetchGitHub(h.login)}
                    className="flex items-center gap-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-full pl-1 pr-2 py-0.5 pointer transition-colors group shrink-0"
                  >
                    <img src={h.avatar} className="w-4 h-4 rounded-full" />
                    <span className="text-xs text-slate-300">{h.login}</span>
                    <button
                      onClick={(e) => removeHistory(e, h.login)}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Profile Result */}
            {profile && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-4 flex gap-4 items-center bg-[#21262d]">
                  <img
                    src={profile.avatar_url}
                    alt="Avt"
                    className="w-12 h-12 rounded-full border border-[#30363d]"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {profile.name || profile.login}
                    </h3>
                    <a
                      href={profile.html_url}
                      target="_blank"
                      className="text-xs text-[#58a6ff] hover:underline"
                    >
                      @{profile.login}
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 border-b border-[#30363d]">
                  <div className="p-3 text-center border-r border-[#30363d]">
                    <div className="font-bold text-white">
                      {profile.public_repos}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Repos
                    </div>
                  </div>
                  <div className="p-3 text-center border-r border-[#30363d]">
                    <div className="font-bold text-white">
                      {profile.followers}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Followers
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="font-bold text-white">
                      {profile.following}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Following
                    </div>
                  </div>
                </div>

                {/* Recent Repos */}
                <div className="p-3 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Folder size={12} /> Recent Activity
                  </div>
                  {repos.map((repo) => (
                    <a
                      href={repo.html_url}
                      target="_blank"
                      key={repo.id}
                      className="block p-2 rounded-md hover:bg-[#21262d] transition-colors group border border-transparent hover:border-[#30363d]"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-[#58a6ff] group-hover:underline truncate flex items-center gap-1.5">
                          {repo.name}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          {repo.stargazers_count}{" "}
                          <Star size={10} className="text-yellow-500" />
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        {repo.description || "No description"}
                      </div>
                      {repo.language && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                          <div className="w-2 h-2 rounded-full bg-[#f78166]"></div>{" "}
                          {repo.language}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: CHEATSHEET --- */}
        {activeTab === "cheatsheet" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
            <div className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">
              Quick Reference
            </div>
            {CHEATSHEET.map((item, idx) => (
              <div
                key={idx}
                className="group flex justify-between items-center p-2 rounded-md hover:bg-[#161b22] border border-transparent hover:border-[#30363d] transition-colors pointer"
                onClick={() => handleCopy(item.cmd)}
              >
                <div>
                  <div className="font-mono text-sm text-[#f78166]">
                    {item.cmd}
                  </div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
                <Copy
                  size={14}
                  className="opacity-0 group-hover:opacity-100 text-slate-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
