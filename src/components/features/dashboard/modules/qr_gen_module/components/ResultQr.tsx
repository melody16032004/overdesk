import { Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export const ResultQr = ({
  qrValue,
  fgColor,
  bgColor,
  downloadQR,
  activeType,
}: any) => (
  <div
    className="
        w-full md:w-1/2 flex flex-col items-center justify-center
        bg-slate-50 dark:bg-black/20 rounded-2xl border
        border-slate-200 dark:border-white/5 p-2 relative group"
  >
    <div className="bg-white p-1 rounded-xl shadow-lg border border-slate-100">
      <QRCodeSVG
        id="qr-code-svg"
        value={qrValue}
        size={180}
        fgColor={fgColor}
        bgColor={bgColor}
        level={"H"} // Mức độ sửa lỗi cao nhất
        includeMargin={true}
      />
    </div>

    <div className="mt-3 flex gap-3">
      <button
        onClick={downloadQR}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-all active:scale-95 text-sm font-bold"
      >
        <Download size={16} /> Download PNG
      </button>
    </div>

    <div className="absolute top-4 right-4 text-xs text-slate-300 font-mono hidden md:block">
      {activeType.toUpperCase()} MODE
    </div>
  </div>
);
