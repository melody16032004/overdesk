import { useState, useEffect, useRef } from 'react';
import { Delete, Equal, History, FlaskConical, X, TrendingUp, Sigma, ArrowLeft, HelpCircle, Box } from 'lucide-react';
import { evaluate, format } from 'mathjs';
// @ts-ignore
import nerdamer from 'nerdamer/all.min'; 
import functionPlot from 'function-plot';

// --- TYPES ---
type EqnType = 'quad' | 'cubic' | 'sys2' | 'sys3' | null;
type GeoType = 'square' | 'rect' | 'triangle' | 'circle' | 'sphere' | 'cylinder' | null;

// --- GEOMETRY VISUALIZER COMPONENT ---
// --- GEOMETRY VISUALIZER COMPONENT (ĐÃ SỬA LỖI TYPE) ---
const GeometryVisualizer = ({ type, data }: { type: GeoType, data: Record<string, string> }) => {
    const show = (key: string, label: string) => data[key] ? data[key] : label;
    const getVal = (key: string) => parseFloat(data[key] || '0');

    const VIEW_SIZE = 200;
    const CENTER = VIEW_SIZE / 2;

    if (!type) return null;

    let svgContent = null;

    // 👇 SỬA LỖI Ở ĐÂY: Đổi CSSProperties thành React.SVGProps<SVGTextElement>
    const textStyle = { 
        fontSize: "12px", 
        fill: "#ec4899", 
        fontWeight: "bold", 
        textAnchor: "middle" 
    } as React.SVGProps<SVGTextElement>; 

    if (type === 'square') {
        const val = show('a', 'a');
        svgContent = (
            <>
                <rect x={50} y={50} width={100} height={100} fill="none" stroke="#ec4899" strokeWidth="2" />
                <text x={CENTER} y={165} {...textStyle}>{val}</text>
                <text x={160} y={105} {...textStyle}>{val}</text>
            </>
        );
    } 
    else if (type === 'rect') {
        const l = getVal('l');
        const w = getVal('w');
        const ratio = l && w ? Math.min(Math.max(w / l, 0.25), 4) : 0.6;
        
        const baseSize = 140; 
        let width, height;

        if (ratio < 1) { 
            width = baseSize;
            height = baseSize * ratio;
        } else { 
            height = baseSize;
            width = baseSize / ratio;
        }

        svgContent = (
            <>
                <rect x={CENTER - width/2} y={CENTER - height/2} width={width} height={height} fill="none" stroke="#ec4899" strokeWidth="2" />
                <text x={CENTER} y={CENTER + height/2 + 15} {...textStyle}>{show('l', 'l')}</text>
                <text x={CENTER + width/2 + 15} y={CENTER + 5} {...textStyle}>{show('w', 'w')}</text>
            </>
        );
    }
    else if (type === 'circle' || type === 'sphere') {
        svgContent = (
            <>
                <circle cx={CENTER} cy={CENTER} r={60} fill="none" stroke="#ec4899" strokeWidth="2" />
                {type === 'sphere' && (
                    <ellipse cx={CENTER} cy={CENTER} rx={60} ry={15} fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="4,4" />
                )}
                <line x1={CENTER} y1={CENTER} x2={CENTER + 60} y2={CENTER} stroke="#ec4899" strokeWidth="1" />
                <text x={CENTER + 30} y={CENTER - 5} {...textStyle}>{show('r', 'r')}</text>
            </>
        );
    }
    else if (type === 'triangle') {
        svgContent = (
            <>
                <polygon points={`${CENTER},40 ${CENTER-60},150 ${CENTER+60},150`} fill="none" stroke="#ec4899" strokeWidth="2" />
                <text x={CENTER} y={165} {...textStyle}>{data['b'] || (data['a'] ? 'base' : '')}</text>
                {(data['h'] || (!data['a'] && !data['b'])) && (
                    <>
                        <line x1={CENTER} y1={40} x2={CENTER} y2={150} stroke="#ec4899" strokeWidth="1" strokeDasharray="4,4" />
                        <text x={CENTER + 10} y={100} {...textStyle} textAnchor="start">{show('h', 'h')}</text>
                    </>
                )}
            </>
        );
    }
    else if (type === 'cylinder') {
        const rInput = getVal('r');
        const hInput = getVal('h');
        
        const ratio = (rInput && hInput) ? hInput / (2 * rInput) : 1; 
        const displayRatio = Math.min(Math.max(ratio, 0.3), 3);

        const r = 40 / Math.sqrt(displayRatio); 
        const h = r * 2 * displayRatio;         

        svgContent = (
            <>
                <ellipse cx={CENTER} cy={CENTER - h/2} rx={r} ry={r/3} fill="none" stroke="#ec4899" strokeWidth="2" />
                <path d={`M${CENTER-r},${CENTER-h/2} v${h} a${r},${r/3} 0 0,0 ${2*r},0 v-${h}`} fill="none" stroke="#ec4899" strokeWidth="2" />
                
                <line x1={CENTER} y1={CENTER-h/2} x2={CENTER+r} y2={CENTER-h/2} stroke="#ec4899" strokeWidth="1" strokeDasharray="2,2"/>
                <text x={CENTER + r/2} y={CENTER - h/2 - 5} {...textStyle}>{show('r', 'r')}</text>
                
                <line x1={CENTER + r + 10} y1={CENTER - h/2} x2={CENTER + r + 10} y2={CENTER + h/2} stroke="#ec4899" strokeWidth="1" />
                <text x={CENTER + r + 25} y={CENTER} {...textStyle}>{show('h', 'h')}</text>
            </>
        );
    }

    return (
        <div className="w-full h-40 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-xl my-2 border border-slate-100 dark:border-white/5 shrink-0">
            <svg width={VIEW_SIZE} height={VIEW_SIZE} viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="w-full h-full">
                {svgContent}
            </svg>
        </div>
    );
};

export const CalcModule = () => {
  // --- STATES ---
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isScientific, setIsScientific] = useState(false);
  const [activeTab, setActiveTab] = useState<'calc' | 'history' | 'graph' | 'eqn' | 'geo' | 'guide'>('calc');
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
    if (activeTab === 'graph' && input && graphRef.current) {
        drawGraph();
    }
    
    // Geometry Auto-Calc
    if (activeTab === 'geo' && geoType) {
        calculateGeometry();
    }

    // Live Preview (Calculator)
    if (activeTab === 'calc' && input && !input.match(/[x=<>!∫dlimPQC]/)) {
        try {
            if (/[\d)]$/.test(input)) {
                if (input.replace(/\s/g, '') === '0^0') { setResult('Undefined'); return; }
                const formatted = formatForMathJS(input);
                const res = evaluate(formatted);
                const display = input.includes('.') 
                    ? String(Math.round(res * 1000000000) / 1000000000) 
                    : format(res, { fraction: 'ratio' });
                setResult(display);
            }
        } catch (e) { /* Ignore */ }
    }
  }, [input, activeTab, geoInputs, geoType]);

  // --- 2. FORMATTERS ---
  const formatForMathJS = (expr: string) => {
    return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√\(/g, 'sqrt(').replace(/nCr\(/g, 'combinations(').replace(/nPr\(/g, 'permutations(').replace(/log\(/g, 'log10(').replace(/ln\(/g, 'log(');
  };
  const formatForNerdamer = (expr: string) => {
    return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√\(/g, 'sqrt(').replace(/log\(/g, 'log10(').replace(/ln\(/g, 'log(').replace(/\|(.+?)\|/g, 'abs($1)');
  };
  const formatForGraph = (expr: string) => {
    return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'PI').replace(/\be\b/g, '2.718281828').replace(/√\(/g, 'sqrt(');
  };
  const formatResult = (num: any) => {
      if (typeof num !== 'number') return num;
      return String(Math.round(num * 1000000000) / 1000000000);
  };

  // --- 3. INPUT HELPERS ---
  const insertAtCursor = (val: string, offsetCursor = 0) => {
    const el = inputRef.current;
    if (!el) { setInput(prev => prev + val); return; }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newText = input.substring(0, start) + val + input.substring(end);
    setInput(newText);
    setTimeout(() => { el.focus(); const newPos = start + val.length + offsetCursor; el.setSelectionRange(newPos, newPos); }, 0);
  };
  const deleteAtCursor = () => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    if (start !== end) { setInput(input.substring(0, start) + input.substring(end)); setTimeout(() => { el.focus(); el.setSelectionRange(start, start); }, 0); } 
    else if (start > 0) { setInput(input.substring(0, start - 1) + input.substring(start)); setTimeout(() => { el.focus(); el.setSelectionRange(start - 1, start - 1); }, 0); }
  };

  // --- 4. CALCULATION LOGIC ---
  const handleCalculate = () => {
      if (input.replace(/\s/g, '') === '0^0') { setResult('Undefined'); saveHistory(`${input} = Undefined`); return; }
      if (input.match(/[=<>]/)) { // Solve EQN
          try {
              const sol = nerdamer.solve(input, 'x');
              const resText = sol.toString().replace(/^\[|\]$/g, '').split(',').join(', ');
              const prefix = input.match(/[<>]/) ? 'Roots: ' : 'x = ';
              setResult(`${prefix}${resText}`); saveHistory(`${input} → ${resText}`);
          } catch (e) { setResult('No solution'); }
          return;
      }
      if (input.includes('x') && !input.match(/diff|integrate|limit/)) { // Simplify
          try { const res = nerdamer(formatForNerdamer(input)).simplify().toString(); setResult(res); saveHistory(`${input} = ${res}`); } catch (e) { setResult('Error'); } return;
      }
      if (input.match(/diff|integrate|limit/)) { // Calculus
          try { const res = nerdamer(formatForNerdamer(input)).toString(); setResult(res); saveHistory(`${input} = ${res}`); } catch (e) { setResult('Error'); } return;
      }
      try { // Arithmetic
          const expr = formatForMathJS(input); const res = evaluate(expr);
          const finalRes = input.includes('.') ? String(Math.round(res * 1000000000) / 1000000000) : format(res, { fraction: 'ratio' });
          saveHistory(`${input} = ${finalRes}`); setInput(finalRes);
      } catch (e) { 
          try { const resNerd = nerdamer(formatForNerdamer(input)).evaluate().text(); saveHistory(`${input} = ${resNerd}`); setInput(resNerd); } catch(err) { setResult('Error'); }
      }
  };

  // --- 5. SOLVE EQUATION MODE ---
  const solveEQN = () => {
      try {
          let resArray: string[] = [];
          if (eqnType === 'quad') { 
              const eq = `${coeffs.a}*x^2 + ${coeffs.b || 0}*x + ${coeffs.c || 0} = 0`;
              resArray = nerdamer.solve(eq, 'x').toString().replace(/^\[|\]$/g, '').split(',');
          } else if (eqnType === 'cubic') { 
              const eq = `${coeffs.a}*x^3 + ${coeffs.b || 0}*x^2 + ${coeffs.c || 0}*x + ${coeffs.d || 0} = 0`;
              resArray = nerdamer.solve(eq, 'x').toString().replace(/^\[|\]$/g, '').split(',');
          } else if (eqnType === 'sys2') { 
              const sol = nerdamer.solveEquations([`${coeffs.a1||0}x + ${coeffs.b1||0}y = ${coeffs.c1||0}`, `${coeffs.a2||0}x + ${coeffs.b2||0}y = ${coeffs.c2||0}`]);
              resArray = [`x=${formatResult(sol[0][1])}`, `y=${formatResult(sol[1][1])}`];
          } else if (eqnType === 'sys3') { 
               const sol = nerdamer.solveEquations([`${coeffs.a1||0}x + ${coeffs.b1||0}y + ${coeffs.c1||0}z = ${coeffs.d1||0}`, `${coeffs.a2||0}x + ${coeffs.b2||0}y + ${coeffs.c2||0}z = ${coeffs.d2||0}`, `${coeffs.a3||0}x + ${coeffs.b3||0}y + ${coeffs.c3||0}z = ${coeffs.d3||0}`]);
               resArray = [`x=${formatResult(sol[0][1])}`, `y=${formatResult(sol[1][1])}`, `z=${formatResult(sol[2][1])}`];
          }
          setEqnResult(resArray);
      } catch (e) { setEqnResult(['No Solution']); }
  };

  // --- 6. GEOMETRY MODE ---
  const calculateGeometry = () => {
      const v = geoInputs;
      let res: string[] = [];
      try {
          if (geoType === 'square') {
              const a = parseFloat(v.a || '0');
              res = [`Area: ${a*a}`, `Perimeter: ${4*a}`];
          } else if (geoType === 'rect') {
              const l = parseFloat(v.l || '0'), w = parseFloat(v.w || '0');
              res = [`Area: ${l*w}`, `Perimeter: ${2*(l+w)}`];
          } else if (geoType === 'triangle') {
              if (v.a && v.b && v.c) {
                  const a=parseFloat(v.a), b=parseFloat(v.b), c=parseFloat(v.c);
                  const s = (a+b+c)/2;
                  const area = Math.sqrt(s*(s-a)*(s-b)*(s-c));
                  res = [`Area: ${formatResult(area)}`, `Perimeter: ${a+b+c}`];
              } else if (v.b && v.h) {
                  const b=parseFloat(v.b), h=parseFloat(v.h);
                  res = [`Area: ${0.5*b*h}`];
              }
          } else if (geoType === 'circle') {
              const r = parseFloat(v.r || '0');
              res = [`Area: ${formatResult(Math.PI*r*r)}`, `Circumference: ${formatResult(2*Math.PI*r)}`];
          } else if (geoType === 'sphere') {
              const r = parseFloat(v.r || '0');
              res = [`Volume: ${formatResult((4/3)*Math.PI*Math.pow(r,3))}`, `Surface Area: ${formatResult(4*Math.PI*r*r)}`];
          } else if (geoType === 'cylinder') {
              const r = parseFloat(v.r || '0'), h = parseFloat(v.h || '0');
              res = [`Volume: ${formatResult(Math.PI*r*r*h)}`, `Surface Area: ${formatResult(2*Math.PI*r*h + 2*Math.PI*r*r)}`];
          }
          setGeoResult(res);
      } catch (e) { setGeoResult(['Error']); }
  };

  // --- 7. GRAPHING ---
  const drawGraph = () => {
      try {
          if(graphRef.current) graphRef.current.innerHTML = '';
          const width = graphRef.current?.offsetWidth || 350;
          const height = graphRef.current?.offsetHeight || 250;
          let fn = formatForGraph(input);
          functionPlot({ target: graphRef.current as HTMLElement, width, height, yAxis: { domain: [-10, 10] }, xAxis: { domain: [-10, 10] }, grid: true, data: [{ fn: fn, color: '#6366f1', graphType: 'polyline', closed: true }] });
      } catch (e) {}
  };

  // --- 8. UI HANDLERS ---
  const handleBtnClick = (val: string) => {
    inputRef.current?.focus();
    if (val === 'AC') { setInput(''); setResult(''); return; }
    if (val === 'DEL') { deleteAtCursor(); return; }
    if (val === '=') { handleCalculate(); return; }
    
    switch (val) {
        case 'sin': case 'cos': case 'tan': case 'log': case '√': case 'abs': insertAtCursor(val + '(', 0); break;
        case 'nPr': case 'nCr': insertAtCursor(val + '(', 0); break;
        case 'diff': insertAtCursor('diff(', 0); break;
        case 'int': insertAtCursor('integrate(', 0); break;
        case 'lim': insertAtCursor('limit(', 0); break;
        case 'root': insertAtCursor('sqroot(', 0); break;
        default: insertAtCursor(val);
    }
  };

  const saveHistory = (text: string) => setHistoryList(prev => [text, ...prev].slice(0, 15));
  const restoreHistoryItem = (item: string) => {
      let expression = item.split(/[=→]/)[0].trim();
      setInput(expression); setActiveTab('calc'); setTimeout(() => inputRef.current?.focus(), 0);
  };

  // --- UI COMPONENTS ---
  const CoeffInput = ({ label, id, valObj, setValObj }: { label: string, id: string, valObj: any, setValObj: any }) => (
      <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-lg border border-slate-200 dark:border-white/10"><span className="text-[10px] font-bold text-slate-400 w-4 text-center">{label}</span><input type="number" placeholder="0" className="w-full bg-transparent text-sm font-bold text-slate-700 dark:text-white outline-none text-right" value={valObj[id] || ''} onChange={(e) => setValObj({ ...valObj, [id]: e.target.value })} /></div>
  );

  const GuideItem = ({ title, syntax, ex }: {title: string, syntax: string, ex: string}) => (
      <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
          <div className="text-[10px] font-bold text-indigo-500 uppercase mb-1">{title}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-black/20 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 mb-1">{syntax}</div>
          <div className="text-[10px] text-slate-400 italic">Ex: {ex}</div>
      </div>
  );

  const Btn = ({ label, val, type = 'num', className = '', ...props }: any) => (
    <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleBtnClick(val || label)} className={`rounded-xl flex items-center justify-center font-bold transition-all active:scale-95 select-none ${isScientific ? 'text-[10px] h-9' : 'text-lg h-14'} ${type === 'num' ? 'bg-white dark:bg-white/5 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm border border-slate-200 dark:border-white/5' : ''} ${type === 'op' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20' : ''} ${type === 'sci' ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : ''} ${type === 'eval' ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/30' : ''} ${type === 'var' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : ''} ${className}`} {...props} >{label}</button>
  );

  return (
    <div className="flex flex-col h-full p-2 gap-2 relative">
      <div className="flex-1 bg-slate-100 dark:bg-black/20 rounded-2xl p-3 flex flex-col overflow-hidden relative border border-slate-200 dark:border-white/5 min-h-[160px]">
         {/* HEADER CONTROLS */}
         <div className="absolute top-2 left-2 flex gap-1 z-20">
            <button onClick={() => setIsScientific(!isScientific)} className={`p-1.5 rounded-lg transition-colors ${isScientific ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/50'}`}><FlaskConical size={14} /></button>
            <button onClick={() => setActiveTab(activeTab === 'graph' ? 'calc' : 'graph')} className={`p-1.5 rounded-lg transition-colors ${activeTab === 'graph' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-white/50'}`}><TrendingUp size={14} /></button>
            <button onClick={() => setActiveTab(activeTab === 'eqn' ? 'calc' : 'eqn')} className={`p-1.5 rounded-lg transition-colors ${activeTab === 'eqn' ? 'bg-violet-500 text-white' : 'text-slate-400 hover:bg-white/50'}`}><Sigma size={14} /></button>
            <button onClick={() => setActiveTab(activeTab === 'geo' ? 'calc' : 'geo')} className={`p-1.5 rounded-lg transition-colors ${activeTab === 'geo' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:bg-white/50'}`}><Box size={14} /></button>
            <button onClick={() => setActiveTab(activeTab === 'history' ? 'calc' : 'history')} className={`p-1.5 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-white/50'}`}><History size={14} /></button>
            <button onClick={() => setActiveTab(activeTab === 'guide' ? 'calc' : 'guide')} className={`p-1.5 rounded-lg transition-colors ${activeTab === 'guide' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-white/50'}`}><HelpCircle size={14} /></button>
        </div>

        {/* --- 1. GUIDE MODE --- */}
        {activeTab === 'guide' && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 p-3 flex flex-col backdrop-blur-sm animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-white/10 pb-2">
                    <span className="text-xs font-bold text-indigo-500 uppercase flex items-center gap-2"><HelpCircle size={14}/> Syntax Guide</span>
                    <button onClick={() => setActiveTab('calc')} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <GuideItem title="Derivative (Đạo hàm)" syntax="diff(fx, x)" ex="diff(x^2, x) → 2x" />
                    <GuideItem title="Integral (Nguyên hàm)" syntax="integrate(fx, x)" ex="integrate(2x, x) → x^2" />
                    <GuideItem title="Limit (Giới hạn)" syntax="limit(fx, x, val)" ex="limit(sin(x)/x, x, 0) → 1" />
                    <GuideItem title="Combinations (Tổ hợp)" syntax="nCr(n, k)" ex="nCr(5, 2) → 10" />
                    <GuideItem title="Permutations (Chỉnh hợp)" syntax="nPr(n, k)" ex="nPr(5, 2) → 20" />
                    <GuideItem title="Solve Equation (Tìm x)" syntax="eqn" ex="x^2 - 4 = 0 (Click =)" />
                    <GuideItem title="Graphing (Vẽ đồ thị)" syntax="fx" ex="sin(x), x^2, e^x" />
                </div>
            </div>
        )}

        {/* --- 2. GEOMETRY MODE --- */}
        {activeTab === 'geo' && (
            <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200 p-3 pt-10">
                {!geoType ? (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="col-span-2 text-center text-xs font-bold text-slate-500 mb-1">Select Shape</div>
                        <button onClick={() => {setGeoType('square'); setGeoInputs({});}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10">Square</button>
                        <button onClick={() => {setGeoType('rect'); setGeoInputs({});}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10">Rectangle</button>
                        <button onClick={() => {setGeoType('triangle'); setGeoInputs({});}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10">Triangle</button>
                        <button onClick={() => {setGeoType('circle'); setGeoInputs({});}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10">Circle</button>
                        <button onClick={() => {setGeoType('sphere'); setGeoInputs({});}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10">Sphere</button>
                        <button onClick={() => {setGeoType('cylinder'); setGeoInputs({});}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10">Cylinder</button>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-2 mt-2">
                            <button onClick={() => {setGeoType(null); setGeoResult([])}} className="p-1 text-slate-400 hover:text-pink-500"><ArrowLeft size={16} /></button>
                            <span className="text-xs font-bold text-pink-500 uppercase">{geoType}</span>
                        </div>
                        
                        {/* --- VISUALIZER --- */}
                        <GeometryVisualizer type={geoType} data={geoInputs} />

                        <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
                            {geoType === 'square' && <CoeffInput label="side" id="a" valObj={geoInputs} setValObj={setGeoInputs}/>}
                            {geoType === 'rect' && <><CoeffInput label="length" id="l" valObj={geoInputs} setValObj={setGeoInputs}/><CoeffInput label="width" id="w" valObj={geoInputs} setValObj={setGeoInputs}/></>}
                            {geoType === 'triangle' && (
                                <>
                                    <div className="text-[10px] text-slate-400">By Sides (Heron)</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <CoeffInput label="a" id="a" valObj={geoInputs} setValObj={setGeoInputs}/>
                                        <CoeffInput label="b" id="b" valObj={geoInputs} setValObj={setGeoInputs}/>
                                        <CoeffInput label="c" id="c" valObj={geoInputs} setValObj={setGeoInputs}/>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-2">OR By Base/Height</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <CoeffInput label="base" id="b" valObj={geoInputs} setValObj={setGeoInputs}/>
                                        <CoeffInput label="height" id="h" valObj={geoInputs} setValObj={setGeoInputs}/>
                                    </div>
                                </>
                            )}
                            {geoType === 'circle' && <CoeffInput label="radius" id="r" valObj={geoInputs} setValObj={setGeoInputs}/>}
                            {geoType === 'sphere' && <CoeffInput label="radius" id="r" valObj={geoInputs} setValObj={setGeoInputs}/>}
                            {geoType === 'cylinder' && <><CoeffInput label="radius" id="r" valObj={geoInputs} setValObj={setGeoInputs}/><CoeffInput label="height" id="h" valObj={geoInputs} setValObj={setGeoInputs}/></>}
                        </div>
                        <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 mt-3 min-h-[60px] flex flex-col justify-center gap-1">
                            {geoResult.length > 0 ? geoResult.map((r, i) => <div key={i} className="text-sm font-bold text-pink-500">{r}</div>) : <span className="text-xs text-slate-400 text-center">Enter values to calculate</span>}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* --- 3. EQN MODE --- */}
        {activeTab === 'eqn' ? (
             <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200 p-3 pt-10">
                 {!eqnType ? (
                    <div className="flex flex-col gap-2 mt-4">
                        <div className="text-center text-xs font-bold text-slate-500 mb-2">Select Equation</div>
                        <button onClick={() => {setEqnType('quad'); setCoeffs({}); setEqnResult([]);}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left">1. Quadratic (ax² + bx + c = 0)</button>
                        <button onClick={() => {setEqnType('cubic'); setCoeffs({}); setEqnResult([]);}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left">2. Cubic (ax³ + bx² + cx + d)</button>
                        <button onClick={() => {setEqnType('sys2'); setCoeffs({}); setEqnResult([]);}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left">3. System 2 Unknowns</button>
                        <button onClick={() => {setEqnType('sys3'); setCoeffs({}); setEqnResult([]);}} className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left">4. System 3 Unknowns</button>
                    </div>
                 ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-3 mt-4">
                            <button onClick={() => setEqnType(null)} className="p-1 text-slate-400 hover:text-indigo-500"><ArrowLeft size={16} /></button>
                            <span className="text-xs font-bold text-indigo-500 uppercase">{eqnType}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                            {(eqnType === 'quad' || eqnType === 'cubic') && <div className="grid grid-cols-2 gap-2"><CoeffInput label="a" id="a" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="b" id="b" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="c" id="c" valObj={coeffs} setValObj={setCoeffs}/>{eqnType==='cubic'&&<CoeffInput label="d" id="d" valObj={coeffs} setValObj={setCoeffs}/>}</div>}
                            {eqnType === 'sys2' && <div className="space-y-2"><div className="grid grid-cols-3 gap-2"><CoeffInput label="a1" id="a1" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="b1" id="b1" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="c1" id="c1" valObj={coeffs} setValObj={setCoeffs}/></div><div className="grid grid-cols-3 gap-2"><CoeffInput label="a2" id="a2" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="b2" id="b2" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="c2" id="c2" valObj={coeffs} setValObj={setCoeffs}/></div></div>}
                            {eqnType === 'sys3' && <div className="space-y-2"><div className="grid grid-cols-4 gap-1"><CoeffInput label="a1" id="a1" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="b1" id="b1" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="c1" id="c1" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="d1" id="d1" valObj={coeffs} setValObj={setCoeffs}/></div><div className="grid grid-cols-4 gap-1"><CoeffInput label="a2" id="a2" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="b2" id="b2" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="c2" id="c2" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="d2" id="d2" valObj={coeffs} setValObj={setCoeffs}/></div><div className="grid grid-cols-4 gap-1"><CoeffInput label="a3" id="a3" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="b3" id="b3" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="c3" id="c3" valObj={coeffs} setValObj={setCoeffs}/><CoeffInput label="d3" id="d3" valObj={coeffs} setValObj={setCoeffs}/></div></div>}
                        </div>
                        <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 mt-3 min-h-[60px] flex flex-col justify-center text-center">
                            {eqnResult.length > 0 ? eqnResult.map((r, i) => <div key={i} className="text-sm font-bold text-indigo-500">{r}</div>) : <span className="text-xs text-slate-400">Result</span>}
                        </div>
                        <button onClick={solveEQN} className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg">SOLVE</button>
                    </div>
                 )}
             </div>
        ) : (
            // --- 4. CALCULATOR & GRAPH VIEW ---
            <>
                {activeTab === 'graph' ? (
                    <div className="absolute inset-0 top-8 w-full h-full bg-white dark:bg-slate-900 z-0">
                        {!input ? <div className="flex items-center justify-center h-full text-xs text-slate-400">Enter function (e.g. x^2 or e^x)</div> : <div ref={graphRef} className="w-full h-full overflow-hidden" />}
                    </div>
                ) : (
                    <div className="w-full mt-8 z-0 relative flex-1 flex flex-col justify-end">
                        <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') handleBtnClick('=') }} className="w-full bg-transparent text-right text-xl font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-300 font-mono tracking-tight" placeholder="0" autoFocus autoComplete="off" />
                        {result && <div className="text-xl font-bold text-indigo-500 animate-in slide-in-from-bottom-2 text-right w-full break-words mt-1">{input.match(/[x=<>]/) ? result : `= ${result}`}</div>}
                    </div>
                )}
            </>
        )}
        
        {/* --- 5. HISTORY OVERLAY --- */}
        {activeTab === 'history' && (
             <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 z-30 p-2 flex flex-col backdrop-blur-sm animate-in fade-in zoom-in-95">
                 <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2"><button onClick={() => setActiveTab('calc')} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"><X size={16}/></button><span className="text-xs font-bold text-slate-500 uppercase">History</span></div>
                    <button onClick={() => setHistoryList([])} className="text-[10px] text-red-500 hover:underline px-2">Clear</button>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {historyList.length === 0 && <div className="text-center text-xs text-slate-400 mt-10">No history yet</div>}
                    {historyList.map((item, i) => <button key={i} onClick={() => restoreHistoryItem(item)} className="w-full text-right text-xs p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 truncate border border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-600 dark:text-slate-300">{item}</button>)}
                 </div>
             </div>
        )}
      </div>

      {/* --- BÀN PHÍM (KEYPAD) --- */}
      {activeTab !== 'eqn' && activeTab !== 'geo' && (
          <div className={`grid gap-1.5 transition-all ${isScientific ? 'grid-cols-6' : 'grid-cols-4'}`}>
            
            {isScientific && (
                <>
                    <Btn label="∫" val="int" type="sci" className="text-violet-500 font-serif italic" />
                    <Btn label="d/dx" val="diff" type="sci" className="text-violet-500" />
                    <Btn label="lim" val="lim" type="sci" className="text-violet-500" />
                    <Btn label="AC" type="sci" className="text-red-500 font-bold" />
                    <Btn label={<Delete size={18}/>} val="DEL" type="sci" className="text-red-500" />
                    <Btn label="÷" type="op" />

                    <Btn label="nCr" type="sci" className="text-orange-500" />
                    <Btn label="nPr" type="sci" className="text-orange-500" />
                    <Btn label="7" /> <Btn label="8" /> <Btn label="9" /> <Btn label="×" type="op" />

                    <Btn label="sin" type="sci" />
                    <Btn label="cos" type="sci" />
                    <Btn label="4" /> <Btn label="5" /> <Btn label="6" /> <Btn label="-" type="op" />

                    <Btn label="tan" type="sci" />
                    <Btn label="x!" val="!" type="sci" />
                    <Btn label="1" /> <Btn label="2" /> <Btn label="3" /> <Btn label="+" type="op" />

                    <Btn label="ln" val="ln" type="sci" />
                    <Btn label="log" type="sci" />
                    <Btn label="0" /> <Btn label="." /> <Btn label="e" type="sci" />
                    <Btn label="=" type="eval" className="bg-indigo-500 text-white" />

                    <Btn label="xʸ" val="^" type="sci" />
                    <Btn label="√" type="sci" />
                    <Btn label="π" val="pi" type="sci" />
                    <Btn label="abs" type="sci" />
                    <Btn label="eˣ" val="e^x" type="sci" />
                    <Btn label="SOLVE" val="=" type="eval" className="bg-emerald-500 text-white text-[10px]" />
                    
                    <Btn label="x²" val="x^2" type="sci" />
                    <Btn label="ʸ√x" val="y^(1/" type="sci" />
                    <Btn label="sin²" val="sin(x)^2" type="sci" />
                    <Btn label="cos²" val="cos(x)^2" type="sci" />
                    <Btn label="tan²" val="tan(x)^2" type="sci" />
                    <Btn label="( )" val="()" type="sci" />
                </>
            )}

            {!isScientific && (
                <>
                    <Btn label="AC" type="sci" className="text-red-500 font-bold" />
                    <Btn label={<Delete size={18}/>} val="DEL" type="sci" className="text-red-500" />
                    <Btn label="x" type="var" />
                    <Btn label="÷" type="op" />

                    <Btn label="7" /> <Btn label="8" /> <Btn label="9" /> <Btn label="×" type="op" />
                    <Btn label="4" /> <Btn label="5" /> <Btn label="6" /> <Btn label="-" type="op" />
                    <Btn label="1" /> <Btn label="2" /> <Btn label="3" /> <Btn label="+" type="op" />

                    <Btn label="0" className="col-span-2" /> 
                    <Btn label="." /> 
                    <Btn label={input.match(/[=<>]/) ? "SOLVE" : <Equal size={24}/>} val="=" type="eval" className={input.match(/[=<>]/) ? "text-[10px] bg-emerald-500" : ""} />
                </>
            )}
          </div>
      )}
    </div>
  );
};