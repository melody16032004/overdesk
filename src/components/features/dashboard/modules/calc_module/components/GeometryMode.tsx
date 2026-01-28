import { ArrowLeft } from "lucide-react";
import { CoeffInput } from "./CoeffInput";
import { GeometryVisualizer } from "./GeometryVisualizer";

export const GeometryMode = ({
  geoType,
  geoInputs,
  geoResult,
  setGeoType,
  setGeoInputs,
  setGeoResult,
}: any) => (
  <div className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200 p-3 pt-10">
    {!geoType ? (
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="col-span-2 text-center text-xs font-bold text-slate-500 mb-1">
          Select Shape
        </div>
        <button
          onClick={() => {
            setGeoType("square");
            setGeoInputs({});
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10"
        >
          Square
        </button>
        <button
          onClick={() => {
            setGeoType("rect");
            setGeoInputs({});
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10"
        >
          Rectangle
        </button>
        <button
          onClick={() => {
            setGeoType("triangle");
            setGeoInputs({});
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10"
        >
          Triangle
        </button>
        <button
          onClick={() => {
            setGeoType("circle");
            setGeoInputs({});
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10"
        >
          Circle
        </button>
        <button
          onClick={() => {
            setGeoType("sphere");
            setGeoInputs({});
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10"
        >
          Sphere
        </button>
        <button
          onClick={() => {
            setGeoType("cylinder");
            setGeoInputs({});
          }}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold hover:bg-pink-50 dark:hover:bg-white/10"
        >
          Cylinder
        </button>
      </div>
    ) : (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2 mt-2">
          <button
            onClick={() => {
              setGeoType(null);
              setGeoResult([]);
            }}
            className="p-1 text-slate-400 hover:text-pink-500"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-bold text-pink-500 uppercase">
            {geoType}
          </span>
        </div>

        {/* --- VISUALIZER --- */}
        <GeometryVisualizer type={geoType} data={geoInputs} />

        <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
          {geoType === "square" && (
            <CoeffInput
              label="side"
              id="a"
              valObj={geoInputs}
              setValObj={setGeoInputs}
            />
          )}
          {geoType === "rect" && (
            <>
              <CoeffInput
                label="length"
                id="l"
                valObj={geoInputs}
                setValObj={setGeoInputs}
              />
              <CoeffInput
                label="width"
                id="w"
                valObj={geoInputs}
                setValObj={setGeoInputs}
              />
            </>
          )}
          {geoType === "triangle" && (
            <>
              <div className="text-[10px] text-slate-400">By Sides (Heron)</div>
              <div className="grid grid-cols-3 gap-2">
                <CoeffInput
                  label="a"
                  id="a"
                  valObj={geoInputs}
                  setValObj={setGeoInputs}
                />
                <CoeffInput
                  label="b"
                  id="b"
                  valObj={geoInputs}
                  setValObj={setGeoInputs}
                />
                <CoeffInput
                  label="c"
                  id="c"
                  valObj={geoInputs}
                  setValObj={setGeoInputs}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                OR By Base/Height
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CoeffInput
                  label="base"
                  id="b"
                  valObj={geoInputs}
                  setValObj={setGeoInputs}
                />
                <CoeffInput
                  label="height"
                  id="h"
                  valObj={geoInputs}
                  setValObj={setGeoInputs}
                />
              </div>
            </>
          )}
          {geoType === "circle" && (
            <CoeffInput
              label="radius"
              id="r"
              valObj={geoInputs}
              setValObj={setGeoInputs}
            />
          )}
          {geoType === "sphere" && (
            <CoeffInput
              label="radius"
              id="r"
              valObj={geoInputs}
              setValObj={setGeoInputs}
            />
          )}
          {geoType === "cylinder" && (
            <>
              <CoeffInput
                label="radius"
                id="r"
                valObj={geoInputs}
                setValObj={setGeoInputs}
              />
              <CoeffInput
                label="height"
                id="h"
                valObj={geoInputs}
                setValObj={setGeoInputs}
              />
            </>
          )}
        </div>
        <div className="bg-slate-100 dark:bg-white/5 rounded-xl p-3 mt-3 min-h-[60px] flex flex-col justify-center gap-1">
          {geoResult.length > 0 ? (
            geoResult.map((r: any, i: any) => (
              <div key={i} className="text-sm font-bold text-pink-500">
                {r}
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400 text-center">
              Enter values to calculate
            </span>
          )}
        </div>
      </div>
    )}
  </div>
);
