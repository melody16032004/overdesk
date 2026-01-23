import { CATEGORY_STYLES } from "../constants/periodic_const";
import { ElementData } from "../types/periodic_type";

export const AtomVisualizer = ({
  element,
  temperature,
}: {
  element: ElementData;
  temperature: number;
}) => {
  const calculateShells = (atomicNumber: number) => {
    const shellLimits = [2, 8, 18, 32, 32, 18, 8];
    const shells: number[] = [];
    let remaining = atomicNumber;

    for (const limit of shellLimits) {
      if (remaining <= 0) break;
      const count = Math.min(remaining, limit);
      shells.push(count);
      remaining -= count;
    }
    return shells;
  };

  const shells = calculateShells(element.number);
  const styles = CATEGORY_STYLES[element.category] || CATEGORY_STYLES.unknown;

  // Xử lý trạng thái 0 Kelvin (Độ không tuyệt đối -> Ngừng chuyển động)
  const isFrozen = temperature === 0;

  return (
    <div className="relative w-52 h-52 mx-auto flex items-center justify-center my-4">
      {/* Background Glow - Nhấp nháy nhanh hơn theo nhiệt độ */}
      <div
        className={`absolute w-full h-full rounded-full opacity-10 bg-gradient-to-tr from-transparent via-${
          styles.text.split("-")[1]
        }-500 to-transparent animate-pulse`}
        style={{
          // Pulse cũng nhanh hơn khi nóng lên
          animationDuration: isFrozen
            ? "0s"
            : `${2000 / Math.max(temperature, 100)}s`,
        }}
      />

      {/* Nucleus */}
      <div
        className={`z-10 w-12 h-12 rounded-full flex items-center justify-center border shadow-[0_0_15px_rgba(0,0,0,0.5)] ${styles.bg} ${styles.border} ${styles.text}`}
      >
        <div className="text-center leading-none">
          <div className="text-xs font-bold">{element.symbol}</div>
          <div className="text-[10px] opacity-70 mt-0.5">{element.number}</div>
        </div>
      </div>

      {/* Electron Shells */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        style={{ overflow: "visible" }}
      >
        {shells.map((electronCount, index) => {
          const radius = 12 + (index + 1) * 6;

          // --- LOGIC TỐC ĐỘ ---
          // Base duration: vòng trong quay nhanh (3s), vòng ngoài quay chậm dần (+2s mỗi vòng)
          const baseDuration = 3 + index * 2;

          // Speed Factor: Tỉ lệ với nhiệt độ (Chuẩn 300K = 1x)
          // Math.max(temperature, 1) để tránh chia cho 0
          const speedFactor = Math.max(temperature, 1) / 300;

          // Thời gian quay thực tế = Thời gian gốc / Tỉ lệ tốc độ
          // Ví dụ: 6000K -> nhanh gấp 20 lần -> duration cực nhỏ
          const duration = baseDuration / speedFactor;

          return (
            <g
              key={index}
              className="origin-center"
              style={{
                animation: `spin ${duration}s linear infinite`,
                animationPlayState: isFrozen ? "paused" : "running", // Dừng khi 0K
              }}
            >
              {/* Orbit Line */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.3"
                strokeWidth="0.5"
                className={styles.text}
              />

              {/* Electrons */}
              {Array.from({ length: electronCount }).map((_, eIdx) => {
                const angle = (eIdx / electronCount) * 2 * Math.PI;
                const x = 50 + radius * Math.cos(angle);
                const y = 50 + radius * Math.sin(angle);

                return (
                  <circle
                    key={eIdx}
                    cx={x}
                    cy={y}
                    r="1.2"
                    className="fill-white drop-shadow-[0_0_1px_rgba(255,255,255,0.8)]"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
