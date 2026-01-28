import { useState, useEffect, useRef } from "react";
import {
  History,
  FlaskConical,
  TrendingUp,
  Sigma,
  HelpCircle,
  Box,
} from "lucide-react";
import { evaluate, format } from "mathjs";
// @ts-ignore
import nerdamer from "nerdamer/all.min";
import functionPlot from "function-plot";
import { EqnType, GeoType } from "./types/calc_type";
import {
  formatForMathJS,
  formatForNerdamer,
  formatResult,
  formatForGraph,
} from "./helper/calc_helper";
import { EqnMode } from "./components/EqnMode";
import { GeometryMode } from "./components/GeometryMode";
import { GraphMode } from "./components/GraphMode";
import { GuideMode } from "./components/GuideMode";
import { HistoryMode } from "./components/HistoryMode";
import { Keypad } from "./components/Keypad";
import { BasicMode } from "./components/BasicMode";

export const CalcModule = () => {
  // --- STATES ---
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [isScientific, setIsScientific] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "calc" | "history" | "graph" | "eqn" | "geo" | "guide"
  >("calc");
  const [historyList, setHistoryList] = useState<string[]>([]);

  // EQN Mode State
  const [eqnType, setEqnType] = useState<EqnType>(null);
  const [coeffs, setCoeffs] = useState<Record<string, string>>({});
  const [eqnResult, setEqnResult] = useState<string[]>([]);

  // GEO Mode State
  const [geoType, setGeoType] = useState<GeoType>(null);
  const [geoInputs, setGeoInputs] = useState<Record<string, string>>({});
  const [geoResult, setGeoResult] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  // --- 1. AUTO LOGIC (Calc & Graph & Geo) ---
  useEffect(() => {
    // Graphing
    if (activeTab === "graph" && input && graphRef.current) {
      drawGraph();
    }

    // Geometry Auto-Calc
    if (activeTab === "geo" && geoType) {
      calculateGeometry();
    }

    // Live Preview (Calculator)
    if (activeTab === "calc" && input && !input.match(/[x=<>!∫dlimPQC]/)) {
      try {
        if (/[\d)]$/.test(input)) {
          if (input.replace(/\s/g, "") === "0^0") {
            setResult("Undefined");
            return;
          }
          const formatted = formatForMathJS(input);
          const res = evaluate(formatted);
          const display = input.includes(".")
            ? String(Math.round(res * 1000000000) / 1000000000)
            : format(res, { fraction: "ratio" });
          setResult(display);
        }
      } catch (e) {
        /* Ignore */
      }
    }
  }, [input, activeTab, geoInputs, geoType]);

  // --- 2. FORMATTERS ---

  // --- 3. INPUT HELPERS ---
  const insertAtCursor = (val: string, offsetCursor = 0) => {
    const el = inputRef.current;
    if (!el) {
      setInput((prev) => prev + val);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newText = input.substring(0, start) + val + input.substring(end);
    setInput(newText);
    setTimeout(() => {
      el.focus();
      const newPos = start + val.length + offsetCursor;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  };
  const deleteAtCursor = () => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    if (start !== end) {
      setInput(input.substring(0, start) + input.substring(end));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start, start);
      }, 0);
    } else if (start > 0) {
      setInput(input.substring(0, start - 1) + input.substring(start));
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
      }, 0);
    }
  };

  // --- 4. CALCULATION LOGIC ---
  const handleCalculate = () => {
    if (input.replace(/\s/g, "") === "0^0") {
      setResult("Undefined");
      saveHistory(`${input} = Undefined`);
      return;
    }
    if (input.match(/[=<>]/)) {
      // Solve EQN
      try {
        const sol = nerdamer.solve(input, "x");
        const resText = sol
          .toString()
          .replace(/^\[|\]$/g, "")
          .split(",")
          .join(", ");
        const prefix = input.match(/[<>]/) ? "Roots: " : "x = ";
        setResult(`${prefix}${resText}`);
        saveHistory(`${input} → ${resText}`);
      } catch (e) {
        setResult("No solution");
      }
      return;
    }
    if (input.includes("x") && !input.match(/diff|integrate|limit/)) {
      // Simplify
      try {
        const res = nerdamer(formatForNerdamer(input)).simplify().toString();
        setResult(res);
        saveHistory(`${input} = ${res}`);
      } catch (e) {
        setResult("Error");
      }
      return;
    }
    if (input.match(/diff|integrate|limit/)) {
      // Calculus
      try {
        const res = nerdamer(formatForNerdamer(input)).toString();
        setResult(res);
        saveHistory(`${input} = ${res}`);
      } catch (e) {
        setResult("Error");
      }
      return;
    }
    try {
      // Arithmetic
      const expr = formatForMathJS(input);
      const res = evaluate(expr);
      const finalRes = input.includes(".")
        ? String(Math.round(res * 1000000000) / 1000000000)
        : format(res, { fraction: "ratio" });
      saveHistory(`${input} = ${finalRes}`);
      setInput(finalRes);
    } catch (e) {
      try {
        const resNerd = nerdamer(formatForNerdamer(input)).evaluate().text();
        saveHistory(`${input} = ${resNerd}`);
        setInput(resNerd);
      } catch (err) {
        setResult("Error");
      }
    }
  };

  // --- 5. SOLVE EQUATION MODE ---
  const solveEQN = () => {
    try {
      let resArray: string[] = [];
      if (eqnType === "quad") {
        const eq = `${coeffs.a}*x^2 + ${coeffs.b || 0}*x + ${coeffs.c || 0} = 0`;
        resArray = nerdamer
          .solve(eq, "x")
          .toString()
          .replace(/^\[|\]$/g, "")
          .split(",");
      } else if (eqnType === "cubic") {
        const eq = `${coeffs.a}*x^3 + ${coeffs.b || 0}*x^2 + ${coeffs.c || 0}*x + ${coeffs.d || 0} = 0`;
        resArray = nerdamer
          .solve(eq, "x")
          .toString()
          .replace(/^\[|\]$/g, "")
          .split(",");
      } else if (eqnType === "sys2") {
        const sol = nerdamer.solveEquations([
          `${coeffs.a1 || 0}x + ${coeffs.b1 || 0}y = ${coeffs.c1 || 0}`,
          `${coeffs.a2 || 0}x + ${coeffs.b2 || 0}y = ${coeffs.c2 || 0}`,
        ]);
        resArray = [
          `x=${formatResult(sol[0][1])}`,
          `y=${formatResult(sol[1][1])}`,
        ];
      } else if (eqnType === "sys3") {
        const sol = nerdamer.solveEquations([
          `${coeffs.a1 || 0}x + ${coeffs.b1 || 0}y + ${coeffs.c1 || 0}z = ${coeffs.d1 || 0}`,
          `${coeffs.a2 || 0}x + ${coeffs.b2 || 0}y + ${coeffs.c2 || 0}z = ${coeffs.d2 || 0}`,
          `${coeffs.a3 || 0}x + ${coeffs.b3 || 0}y + ${coeffs.c3 || 0}z = ${coeffs.d3 || 0}`,
        ]);
        resArray = [
          `x=${formatResult(sol[0][1])}`,
          `y=${formatResult(sol[1][1])}`,
          `z=${formatResult(sol[2][1])}`,
        ];
      }
      setEqnResult(resArray);
    } catch (e) {
      setEqnResult(["No Solution"]);
    }
  };

  // --- 6. GEOMETRY MODE ---
  const calculateGeometry = () => {
    const v = geoInputs;
    let res: string[] = [];
    try {
      if (geoType === "square") {
        const a = parseFloat(v.a || "0");
        res = [`Area: ${a * a}`, `Perimeter: ${4 * a}`];
      } else if (geoType === "rect") {
        const l = parseFloat(v.l || "0"),
          w = parseFloat(v.w || "0");
        res = [`Area: ${l * w}`, `Perimeter: ${2 * (l + w)}`];
      } else if (geoType === "triangle") {
        if (v.a && v.b && v.c) {
          const a = parseFloat(v.a),
            b = parseFloat(v.b),
            c = parseFloat(v.c);
          const s = (a + b + c) / 2;
          const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
          res = [`Area: ${formatResult(area)}`, `Perimeter: ${a + b + c}`];
        } else if (v.b && v.h) {
          const b = parseFloat(v.b),
            h = parseFloat(v.h);
          res = [`Area: ${0.5 * b * h}`];
        }
      } else if (geoType === "circle") {
        const r = parseFloat(v.r || "0");
        res = [
          `Area: ${formatResult(Math.PI * r * r)}`,
          `Circumference: ${formatResult(2 * Math.PI * r)}`,
        ];
      } else if (geoType === "sphere") {
        const r = parseFloat(v.r || "0");
        res = [
          `Volume: ${formatResult((4 / 3) * Math.PI * Math.pow(r, 3))}`,
          `Surface Area: ${formatResult(4 * Math.PI * r * r)}`,
        ];
      } else if (geoType === "cylinder") {
        const r = parseFloat(v.r || "0"),
          h = parseFloat(v.h || "0");
        res = [
          `Volume: ${formatResult(Math.PI * r * r * h)}`,
          `Surface Area: ${formatResult(2 * Math.PI * r * h + 2 * Math.PI * r * r)}`,
        ];
      }
      setGeoResult(res);
    } catch (e) {
      setGeoResult(["Error"]);
    }
  };

  // --- 7. GRAPHING ---
  const drawGraph = () => {
    try {
      if (graphRef.current) graphRef.current.innerHTML = "";
      const width = graphRef.current?.offsetWidth || 350;
      const height = graphRef.current?.offsetHeight || 250;
      let fn = formatForGraph(input);
      functionPlot({
        target: graphRef.current as HTMLElement,
        width,
        height,
        yAxis: { domain: [-10, 10] },
        xAxis: { domain: [-10, 10] },
        grid: true,
        data: [
          { fn: fn, color: "#6366f1", graphType: "polyline", closed: true },
        ],
      });
    } catch (e) {}
  };

  // --- 8. UI HANDLERS ---
  const handleBtnClick = (val: string) => {
    inputRef.current?.focus();
    if (val === "AC") {
      setInput("");
      setResult("");
      return;
    }
    if (val === "DEL") {
      deleteAtCursor();
      return;
    }
    if (val === "=") {
      handleCalculate();
      return;
    }

    switch (val) {
      case "sin":
      case "cos":
      case "tan":
      case "log":
      case "√":
      case "abs":
        insertAtCursor(val + "(", 0);
        break;
      case "nPr":
      case "nCr":
        insertAtCursor(val + "(", 0);
        break;
      case "diff":
        insertAtCursor("diff(", 0);
        break;
      case "int":
        insertAtCursor("integrate(", 0);
        break;
      case "lim":
        insertAtCursor("limit(", 0);
        break;
      case "root":
        insertAtCursor("sqroot(", 0);
        break;
      default:
        insertAtCursor(val);
    }
  };

  const saveHistory = (text: string) =>
    setHistoryList((prev) => [text, ...prev].slice(0, 15));

  const restoreHistoryItem = (item: string) => {
    let expression = item.split(/[=→]/)[0].trim();
    setInput(expression);
    setActiveTab("calc");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex flex-col h-full p-2 gap-2 relative">
      <div className="flex-1 bg-slate-100 dark:bg-black/20 rounded-2xl p-3 flex flex-col overflow-hidden relative border border-slate-200 dark:border-white/5 min-h-[160px]">
        {/* HEADER CONTROLS */}
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          <button
            onClick={() => setIsScientific(!isScientific)}
            className={`p-1.5 rounded-lg transition-colors ${isScientific ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-white/50"}`}
          >
            <FlaskConical size={14} />
          </button>
          <button
            onClick={() =>
              setActiveTab(activeTab === "graph" ? "calc" : "graph")
            }
            className={`p-1.5 rounded-lg transition-colors ${activeTab === "graph" ? "bg-emerald-500 text-white" : "text-slate-400 hover:bg-white/50"}`}
          >
            <TrendingUp size={14} />
          </button>
          <button
            onClick={() => setActiveTab(activeTab === "eqn" ? "calc" : "eqn")}
            className={`p-1.5 rounded-lg transition-colors ${activeTab === "eqn" ? "bg-violet-500 text-white" : "text-slate-400 hover:bg-white/50"}`}
          >
            <Sigma size={14} />
          </button>
          <button
            onClick={() => setActiveTab(activeTab === "geo" ? "calc" : "geo")}
            className={`p-1.5 rounded-lg transition-colors ${activeTab === "geo" ? "bg-pink-500 text-white" : "text-slate-400 hover:bg-white/50"}`}
          >
            <Box size={14} />
          </button>
          <button
            onClick={() =>
              setActiveTab(activeTab === "history" ? "calc" : "history")
            }
            className={`p-1.5 rounded-lg transition-colors ${activeTab === "history" ? "bg-amber-500 text-white" : "text-slate-400 hover:bg-white/50"}`}
          >
            <History size={14} />
          </button>
          <button
            onClick={() =>
              setActiveTab(activeTab === "guide" ? "calc" : "guide")
            }
            className={`p-1.5 rounded-lg transition-colors ${activeTab === "guide" ? "bg-blue-500 text-white" : "text-slate-400 hover:bg-white/50"}`}
          >
            <HelpCircle size={14} />
          </button>
        </div>

        {/* --- 1. GUIDE MODE --- */}
        {activeTab === "guide" && <GuideMode setActiveTab={setActiveTab} />}

        {/* --- 2. GEOMETRY MODE --- */}
        {activeTab === "geo" && (
          <GeometryMode
            geoType={geoType}
            geoInputs={geoInputs}
            geoResult={geoResult}
            setGeoType={setGeoType}
            setGeoInputs={setGeoInputs}
            setGeoResult={setGeoResult}
          />
        )}

        {/* --- 3. EQN MODE --- */}
        {activeTab === "eqn" ? (
          <EqnMode
            eqnType={eqnType}
            coeffs={coeffs}
            eqnResult={eqnResult}
            setEqnType={setEqnType}
            setCoeffs={setCoeffs}
            setEqnResult={setEqnResult}
            solveEQN={solveEQN}
          />
        ) : (
          // --- 4. CALCULATOR & GRAPH VIEW ---
          <>
            {activeTab === "graph" ? (
              <GraphMode input={input} graphRef={graphRef} />
            ) : (
              <BasicMode
                inputRef={inputRef}
                input={input}
                result={result}
                setInput={setInput}
                handleBtnClick={handleBtnClick}
              />
            )}
          </>
        )}

        {/* --- 5. HISTORY OVERLAY --- */}
        {activeTab === "history" && (
          <HistoryMode
            historyList={historyList}
            setActiveTab={setActiveTab}
            setHistoryList={setHistoryList}
            restoreHistoryItem={restoreHistoryItem}
          />
        )}
      </div>

      {/* --- BÀN PHÍM (KEYPAD) --- */}
      {activeTab !== "eqn" && activeTab !== "geo" && (
        <Keypad isScientific={isScientific} input={input} />
      )}
    </div>
  );
};
