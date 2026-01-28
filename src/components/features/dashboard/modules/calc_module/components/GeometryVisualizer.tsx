import { GeoType } from "../types/calc_type";

export const GeometryVisualizer = ({
  type,
  data,
}: {
  type: GeoType;
  data: Record<string, string>;
}) => {
  const show = (key: string, label: string) => (data[key] ? data[key] : label);
  const getVal = (key: string) => parseFloat(data[key] || "0");

  const VIEW_SIZE = 200;
  const CENTER = VIEW_SIZE / 2;

  if (!type) return null;

  let svgContent = null;

  // 👇 SỬA LỖI Ở ĐÂY: Đổi CSSProperties thành React.SVGProps<SVGTextElement>
  const textStyle = {
    fontSize: "12px",
    fill: "#ec4899",
    fontWeight: "bold",
    textAnchor: "middle",
  } as React.SVGProps<SVGTextElement>;

  if (type === "square") {
    const val = show("a", "a");
    svgContent = (
      <>
        <rect
          x={50}
          y={50}
          width={100}
          height={100}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />
        <text x={CENTER} y={165} {...textStyle}>
          {val}
        </text>
        <text x={160} y={105} {...textStyle}>
          {val}
        </text>
      </>
    );
  } else if (type === "rect") {
    const l = getVal("l");
    const w = getVal("w");
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
        <rect
          x={CENTER - width / 2}
          y={CENTER - height / 2}
          width={width}
          height={height}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />
        <text x={CENTER} y={CENTER + height / 2 + 15} {...textStyle}>
          {show("l", "l")}
        </text>
        <text x={CENTER + width / 2 + 15} y={CENTER + 5} {...textStyle}>
          {show("w", "w")}
        </text>
      </>
    );
  } else if (type === "circle" || type === "sphere") {
    svgContent = (
      <>
        <circle
          cx={CENTER}
          cy={CENTER}
          r={60}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />
        {type === "sphere" && (
          <ellipse
            cx={CENTER}
            cy={CENTER}
            rx={60}
            ry={15}
            fill="none"
            stroke="#ec4899"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}
        <line
          x1={CENTER}
          y1={CENTER}
          x2={CENTER + 60}
          y2={CENTER}
          stroke="#ec4899"
          strokeWidth="1"
        />
        <text x={CENTER + 30} y={CENTER - 5} {...textStyle}>
          {show("r", "r")}
        </text>
      </>
    );
  } else if (type === "triangle") {
    svgContent = (
      <>
        <polygon
          points={`${CENTER},40 ${CENTER - 60},150 ${CENTER + 60},150`}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />
        <text x={CENTER} y={165} {...textStyle}>
          {data["b"] || (data["a"] ? "base" : "")}
        </text>
        {(data["h"] || (!data["a"] && !data["b"])) && (
          <>
            <line
              x1={CENTER}
              y1={40}
              x2={CENTER}
              y2={150}
              stroke="#ec4899"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <text x={CENTER + 10} y={100} {...textStyle} textAnchor="start">
              {show("h", "h")}
            </text>
          </>
        )}
      </>
    );
  } else if (type === "cylinder") {
    const rInput = getVal("r");
    const hInput = getVal("h");

    const ratio = rInput && hInput ? hInput / (2 * rInput) : 1;
    const displayRatio = Math.min(Math.max(ratio, 0.3), 3);

    const r = 40 / Math.sqrt(displayRatio);
    const h = r * 2 * displayRatio;

    svgContent = (
      <>
        <ellipse
          cx={CENTER}
          cy={CENTER - h / 2}
          rx={r}
          ry={r / 3}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />
        <path
          d={`M${CENTER - r},${CENTER - h / 2} v${h} a${r},${r / 3} 0 0,0 ${2 * r},0 v-${h}`}
          fill="none"
          stroke="#ec4899"
          strokeWidth="2"
        />

        <line
          x1={CENTER}
          y1={CENTER - h / 2}
          x2={CENTER + r}
          y2={CENTER - h / 2}
          stroke="#ec4899"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <text x={CENTER + r / 2} y={CENTER - h / 2 - 5} {...textStyle}>
          {show("r", "r")}
        </text>

        <line
          x1={CENTER + r + 10}
          y1={CENTER - h / 2}
          x2={CENTER + r + 10}
          y2={CENTER + h / 2}
          stroke="#ec4899"
          strokeWidth="1"
        />
        <text x={CENTER + r + 25} y={CENTER} {...textStyle}>
          {show("h", "h")}
        </text>
      </>
    );
  }

  return (
    <div className="w-full h-40 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-xl my-2 border border-slate-100 dark:border-white/5 shrink-0">
      <svg
        width={VIEW_SIZE}
        height={VIEW_SIZE}
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="w-full h-full"
      >
        {svgContent}
      </svg>
    </div>
  );
};
