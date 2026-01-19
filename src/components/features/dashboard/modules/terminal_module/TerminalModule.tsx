import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Terminal, Cpu, Wifi } from "lucide-react";

// --- TYPES ---

// --- INITIAL DATA ---
const INITIAL_FS: any = {
  "~": {
    type: "dir",
    children: {
      projects: {
        type: "dir",
        children: { overdesk: { type: "dir", children: {} } },
      },
      documents: {
        type: "dir",
        children: {
          "passwords.txt": {
            type: "file",
            content: "admin: 123456\nroot: toor",
          },
        },
      },
      "readme.md": {
        type: "file",
        content: "# Overdesk OS v2.0\nWelcome hacker!",
      },
    },
  },
};

const BOOT_LOGS = [
  "BIOS Date 01/01/99 15:22:00 Ver: 1.0.2",
  "CPU: Intel Pentium III @ 600MHz",
  "Memory Test: 64MB OK",
  "Detecting Primary Master ... QUANTUM FIREBALL",
  "Booting from C: ...",
  "Loading Kernel ... Done.",
  "Starting init process ...",
  "Mounting root filesystem ... [ OK ]",
  "Starting network interface ... [ OK ]",
  "User 'root' logged in.",
];

export const TerminalModule = () => {
  // --- STATE ---
  const [history, setHistory] = useState<
    { cmd: string; output: React.ReactNode }[]
  >([]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState<string[]>([]); // Current path stack: [] = root (~)
  const [fileSystem, setFileSystem] = useState(INITIAL_FS);
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]); // Lưu lịch sử lệnh để bấm lên/xuống
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [installedPkgs, setInstalledPkgs] = useState<string[]>([]);
  const [matrixMode, setMatrixMode] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- BOOT EFFECT ---
  useEffect(() => {
    let delay = 0;
    BOOT_LOGS.forEach((line, i) => {
      delay += Math.random() * 200 + 50;
      setTimeout(() => {
        setBootLines((prev) => [...prev, line]);
        if (i === BOOT_LOGS.length - 1)
          setTimeout(() => setIsBooting(false), 800);
      }, delay);
    });
  }, []);

  // Auto Scroll
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, bootLines, input]);

  // Focus
  const handleFocus = () => !matrixMode && inputRef.current?.focus();

  // --- HELPER: GET CURRENT DIR OBJECT ---
  const getCurrentDirObj = (pathStack: string[] = cwd) => {
    let current = fileSystem["~"];
    for (const p of pathStack) {
      if (current.children && current.children[p]) {
        current = current.children[p];
      } else {
        return null;
      }
    }
    return current;
  };

  // --- COMMAND LOGIC ---
  const execute = (cmdRaw: string) => {
    const cmd = cmdRaw.trim();
    if (!cmd) return;

    // Add to history stack
    setCmdHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);

    const [action, ...args] = cmd.split(" ");
    const arg1 = args[0];
    let output: React.ReactNode = "";

    // -- FS OPERATIONS --
    const currentDir = getCurrentDirObj();

    switch (action.toLowerCase()) {
      case "help":
        output = (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400 max-w-md">
            <span className="text-yellow-400">ls</span> <span>List files</span>
            <span className="text-yellow-400">cd [dir]</span>{" "}
            <span>Change dir</span>
            <span className="text-yellow-400">mkdir [name]</span>{" "}
            <span>Create dir</span>
            <span className="text-yellow-400">touch [name]</span>{" "}
            <span>Create file</span>
            <span className="text-yellow-400">cat [file]</span>{" "}
            <span>Read file</span>
            <span className="text-yellow-400">rm [name]</span>{" "}
            <span>Remove item</span>
            <span className="text-yellow-400">pkg install</span>{" "}
            <span>Install tools</span>
            <span className="text-yellow-400">clear</span>{" "}
            <span>Clear screen</span>
          </div>
        );
        break;

      case "clear":
        setHistory([]);
        return;

      case "ls":
        if (currentDir && currentDir.children) {
          const items = Object.keys(currentDir.children);
          output = items.length ? (
            <div className="flex flex-wrap gap-4">
              {items.map((item) => {
                const isDir = currentDir.children[item].type === "dir";
                return (
                  <span
                    key={item}
                    className={
                      isDir ? "text-indigo-400 font-bold" : "text-emerald-400"
                    }
                  >
                    {item}
                    {isDir ? "/" : ""}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-500 italic">Empty directory</span>
          );
        }
        break;

      case "cd":
        if (!arg1 || arg1 === "~") {
          setCwd([]);
        } else if (arg1 === "..") {
          setCwd((prev) => prev.slice(0, -1));
        } else {
          if (
            currentDir.children[arg1] &&
            currentDir.children[arg1].type === "dir"
          ) {
            setCwd((prev) => [...prev, arg1]);
          } else {
            output = `cd: ${arg1}: No such directory`;
          }
        }
        break;

      case "mkdir":
        if (arg1) {
          if (currentDir.children[arg1]) {
            output = `mkdir: cannot create directory '${arg1}': File exists`;
          } else {
            // Deep Clone to update state
            const newFS = JSON.parse(JSON.stringify(fileSystem));
            let target = newFS["~"];
            for (const p of cwd) target = target.children[p];
            target.children[arg1] = { type: "dir", children: {} };
            setFileSystem(newFS);
            output = `Directory '${arg1}' created.`;
          }
        } else output = "mkdir: missing operand";
        break;

      case "touch":
        if (arg1) {
          const newFS = JSON.parse(JSON.stringify(fileSystem));
          let target = newFS["~"];
          for (const p of cwd) target = target.children[p];
          target.children[arg1] = { type: "file", content: "" };
          setFileSystem(newFS);
          output = `File '${arg1}' created.`;
        } else output = "touch: missing operand";
        break;

      case "rm":
        if (arg1 && currentDir.children[arg1]) {
          const newFS = JSON.parse(JSON.stringify(fileSystem));
          let target = newFS["~"];
          for (const p of cwd) target = target.children[p];
          delete target.children[arg1];
          setFileSystem(newFS);
          output = `Removed '${arg1}'.`;
        } else output = `rm: cannot remove '${arg1}': No such file`;
        break;

      case "cat":
        if (arg1 && currentDir.children[arg1]) {
          const item = currentDir.children[arg1];
          if (item.type === "file") output = item.content || "(empty)";
          else output = `cat: ${arg1}: Is a directory`;
        } else output = `cat: ${arg1}: No such file`;
        break;

      case "pkg":
        if (args[0] === "install" && args[1]) {
          const pkgName = args[1];
          if (pkgName === "matrix") {
            output = (
              <span className="text-yellow-400">
                Installing 'matrix-screensaver' v1.0... [DONE]. Type 'matrix' to
                run.
              </span>
            );
            setInstalledPkgs((p) => [...p, "matrix"]);
          } else if (pkgName === "neofetch") {
            output = (
              <span className="text-yellow-400">
                Installing 'neofetch' v7.1... [DONE]. Type 'neofetch' to run.
              </span>
            );
            setInstalledPkgs((p) => [...p, "neofetch"]);
          } else {
            output = `E: Unable to locate package ${pkgName}`;
          }
        } else {
          output = "Usage: pkg install [package_name]";
        }
        break;

      case "matrix":
        if (installedPkgs.includes("matrix")) {
          setMatrixMode(true);
          return; // Exit normal flow
        } else {
          output = "Command 'matrix' not found. Try: pkg install matrix";
        }
        break;

      case "neofetch":
        if (installedPkgs.includes("neofetch") || true) {
          // Always avail for demo
          output = (
            <div className="flex gap-4 text-xs font-mono my-2 text-emerald-400">
              <pre className="leading-tight hidden sm:block">
                {`   _  _
  (.)(.)
 /  ()  \\
_ \\ -- / _
   |  |`}
              </pre>
              <div>
                <div>
                  <strong className="text-yellow-400">user:</strong>{" "}
                  root@dashboard
                </div>
                <div>
                  <strong className="text-yellow-400">uptime:</strong>{" "}
                  {Math.floor(performance.now() / 60000)} mins
                </div>
                <div>
                  <strong className="text-yellow-400">pkg:</strong>{" "}
                  {installedPkgs.length} (dpkg)
                </div>
                <div>
                  <strong className="text-yellow-400">cpu:</strong> Silicon
                  Virtual Core
                </div>
              </div>
            </div>
          );
        }
        break;

      default:
        output = (
          <span className="text-rose-400">Command not found: {action}</span>
        );
    }

    setHistory((prev) => [...prev, { cmd: cmdRaw, output }]);
  };

  // --- KEYBOARD HANDLERS ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      execute(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < cmdHistory.length - 1) {
        const newIdx = historyIndex + 1;
        setHistoryIndex(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(cmdHistory[newIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple Autocomplete
      const parts = input.split(" ");
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const currentDir = getCurrentDirObj();
        if (currentDir && currentDir.children) {
          const matches = Object.keys(currentDir.children).filter((k) =>
            k.startsWith(lastPart)
          );
          if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            setInput(parts.join(" "));
          }
        }
      }
    }
  };

  // --- MATRIX EFFECT RENDER ---
  if (matrixMode) {
    return (
      <div
        className="h-full bg-black relative overflow-hidden font-mono"
        onClick={() => setMatrixMode(false)}
      >
        <div className="absolute inset-0 animate-matrix-rain text-emerald-500 text-xs opacity-50 break-all p-4 leading-3">
          {Array(2000)
            .fill(0)
            .map(() => String.fromCharCode(0x30a0 + Math.random() * 96))
            .join(" ")}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-emerald-500 mb-2 animate-pulse tracking-widest">
              SYSTEM HACKED
            </h1>
            <p className="text-slate-400 text-sm">Press any key to reboot...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div
      className="h-full flex flex-col bg-[#050a0e] text-emerald-500 font-mono text-sm overflow-hidden relative shadow-[inset_0_0_50px_rgba(0,0,0,0.9)]"
      onClick={handleFocus}
      style={{ textShadow: "0 0 5px rgba(16, 185, 129, 0.5)" }} // Glow Effect
    >
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] opacity-20"></div>

      {/* HEADER */}
      <div className="flex-none px-4 py-2 bg-[#111] border-b border-emerald-900/30 flex justify-between items-center select-none z-10">
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span className="text-xs font-bold opacity-70">root@overdesk:~</span>
        </div>
        <div className="flex gap-2">
          <Wifi size={14} className="animate-pulse text-emerald-600" />
          <Cpu size={14} className="text-emerald-600" />
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-auto custom-scrollbar p-4 space-y-1 relative z-0">
        {/* Boot Sequence */}
        {bootLines.map((line, i) => (
          <div key={i} className="opacity-70">
            <span className="text-emerald-300 mr-2">➜</span>
            {line}
          </div>
        ))}

        {!isBooting && (
          <>
            <div className="text-slate-500 mb-4 text-xs">
              Overdesk OS v2.4 (tty1) - Type 'help' for commands.
            </div>

            {history.map((entry, i) => (
              <div key={i} className="mb-2">
                <div className="flex gap-2">
                  <span className="font-bold text-emerald-400">root@sys:</span>
                  <span className="text-blue-400">
                    ~{cwd.length > 0 ? "/" + cwd.join("/") : ""}$
                  </span>
                  <span className="text-slate-200">{entry.cmd}</span>
                </div>
                <div className="opacity-90 ml-1 mt-1">{entry.output}</div>
              </div>
            ))}

            <div className="flex gap-2 items-center">
              <span className="font-bold text-emerald-400">root@sys:</span>
              <span className="text-blue-400">
                ~{cwd.length > 0 ? "/" + cwd.join("/") : ""}$
              </span>
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-slate-100 caret-emerald-400"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>
          </>
        )}

        <div ref={bottomRef} className="h-4"></div>
      </div>
    </div>
  );
};
