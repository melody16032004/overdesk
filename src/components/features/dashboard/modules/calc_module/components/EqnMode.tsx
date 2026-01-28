import { ArrowLeft } from "lucide-react";
import { CoeffInput } from "./CoeffInput";

export const EqnMode = ({
  eqnType,
  coeffs,
  eqnResult,
  setEqnType,
  setCoeffs,
  setEqnResult,
  solveEQN,
}: any) => (
  <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200 p-3 pt-10">
    {!eqnType ? (
      <div className="flex flex-col gap-2 mt-4">
        <div className="text-center text-xs font-bold text-slate-500 mb-2">
          Select Equation
        </div>
        <button
          onClick={() => {
            setEqnType("quad");
            setCoeffs({});
            setEqnResult([]);
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left"
        >
          1. Quadratic (ax² + bx + c = 0)
        </button>
        <button
          onClick={() => {
            setEqnType("cubic");
            setCoeffs({});
            setEqnResult([]);
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left"
        >
          2. Cubic (ax³ + bx² + cx + d)
        </button>
        <button
          onClick={() => {
            setEqnType("sys2");
            setCoeffs({});
            setEqnResult([]);
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left"
        >
          3. System 2 Unknowns
        </button>
        <button
          onClick={() => {
            setEqnType("sys3");
            setCoeffs({});
            setEqnResult([]);
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-indigo-50 dark:hover:bg-white/10 text-left"
        >
          4. System 3 Unknowns
        </button>
      </div>
    ) : (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3 mt-4">
          <button
            onClick={() => setEqnType(null)}
            className="p-1 text-slate-400 hover:text-indigo-500"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-bold text-indigo-500 uppercase">
            {eqnType}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
          {(eqnType === "quad" || eqnType === "cubic") && (
            <div className="grid grid-cols-2 gap-2">
              <CoeffInput
                label="a"
                id="a"
                valObj={coeffs}
                setValObj={setCoeffs}
              />
              <CoeffInput
                label="b"
                id="b"
                valObj={coeffs}
                setValObj={setCoeffs}
              />
              <CoeffInput
                label="c"
                id="c"
                valObj={coeffs}
                setValObj={setCoeffs}
              />
              {eqnType === "cubic" && (
                <CoeffInput
                  label="d"
                  id="d"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
              )}
            </div>
          )}
          {eqnType === "sys2" && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <CoeffInput
                  label="a1"
                  id="a1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="b1"
                  id="b1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="c1"
                  id="c1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <CoeffInput
                  label="a2"
                  id="a2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="b2"
                  id="b2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="c2"
                  id="c2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
              </div>
            </div>
          )}
          {eqnType === "sys3" && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1">
                <CoeffInput
                  label="a1"
                  id="a1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="b1"
                  id="b1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="c1"
                  id="c1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="d1"
                  id="d1"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                <CoeffInput
                  label="a2"
                  id="a2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="b2"
                  id="b2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="c2"
                  id="c2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="d2"
                  id="d2"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                <CoeffInput
                  label="a3"
                  id="a3"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="b3"
                  id="b3"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="c3"
                  id="c3"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
                <CoeffInput
                  label="d3"
                  id="d3"
                  valObj={coeffs}
                  setValObj={setCoeffs}
                />
              </div>
            </div>
          )}
        </div>
        <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 mt-3 min-h-[60px] flex flex-col justify-center text-center">
          {eqnResult.length > 0 ? (
            eqnResult.map((r: any, i: any) => (
              <div key={i} className="text-sm font-bold text-indigo-500">
                {r}
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400">Result</span>
          )}
        </div>
        <button
          onClick={solveEQN}
          className="mt-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg"
        >
          SOLVE
        </button>
      </div>
    )}
  </div>
);
