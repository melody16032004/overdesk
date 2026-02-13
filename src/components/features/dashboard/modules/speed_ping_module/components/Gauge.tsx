export const Gauge = ({ value }: { value: number }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const maxVal = 100; // Max speed hiển thị là 100Mbps (có thể tăng nếu cần)
  const percent = Math.min(value / maxVal, 1);
  const offset = circumference - percent * (circumference * 0.66);

  const needleRotation = -120 + percent * 240;

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg
        width="240"
        height="240"
        className="overflow-visible transform scale-90 md:scale-100"
      >
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ticks */}
        {Array.from({ length: 41 }).map((_, i) => {
          const rotate = -120 + i * 6;
          const isMajor = i % 10 === 0;
          return (
            <line
              key={i}
              x1="120"
              y1="20"
              x2="120"
              y2={isMajor ? "35" : "28"}
              stroke={
                isMajor ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.1)"
              }
              strokeWidth={isMajor ? 2 : 1}
              transform={`rotate(${rotate} 120 120)`}
            />
          );
        })}

        {/* Background Arc */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.66} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform="rotate(150 120 120)"
        />

        {/* Active Arc */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.66} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(150 120 120)"
          filter="url(#glow)"
          className="transition-all duration-100 ease-linear"
        />

        {/* Needle */}
        <g
          transform={`rotate(${needleRotation} 120 120)`}
          className="transition-transform duration-300 ease-out"
        >
          <circle cx="120" cy="120" r="6" fill="#fff" />
          <path
            d="M 120 115 L 120 35"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>

      {/* Center Text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-8">
        <div className="text-5xl font-black font-mono tracking-tighter text-white drop-shadow-lg">
          {value.toFixed(1)}
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
          Mbps
        </div>
      </div>
    </div>
  );
};
