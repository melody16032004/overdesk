import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react"; // Thư viện render QR
import {
  Wifi,
  Link,
  Type,
  Mail,
  Download,
  RefreshCw,
  Copy,
  QrCode,
  Fingerprint,
} from "lucide-react";

// Các loại QR hỗ trợ
const TYPES = [
  { id: "text", label: "Text", icon: Type },
  { id: "url", label: "Website", icon: Link },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "email", label: "Email", icon: Mail },
  { id: "uuid", label: "UUID", icon: Fingerprint },
];

export const QrCodeModule = () => {
  const [activeType, setActiveType] = useState("text");
  const [qrValue, setQrValue] = useState("Hello OverDesk!");
  const [uuidValue, setUuidValue] = useState("");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  // State riêng cho từng loại input
  const [wifiData, setWifiData] = useState({
    ssid: "",
    password: "",
    encryption: "WPA",
  });
  const [emailData, setEmailData] = useState({ to: "", subject: "", body: "" });
  const [textInput, setTextInput] = useState("Hello OverDesk!");

  // Logic "Thông minh": Tự động ghép chuỗi theo chuẩn định dạng
  useEffect(() => {
    let finalString = "";

    switch (activeType) {
      case "wifi":
        // Chuẩn WIFI:T:WPA;S:MyNetwork;P:mypass;;
        finalString = `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};;`;
        break;
      case "email":
        // Chuẩn mailto:abc@gmail.com?subject=...
        finalString = `mailto:${emailData.to}?subject=${encodeURIComponent(
          emailData.subject
        )}&body=${encodeURIComponent(emailData.body)}`;
        break;
      case "url":
        finalString = textInput.startsWith("http")
          ? textInput
          : `https://${textInput}`;
        break;
      case "uuid": // 👈 Xử lý case UUID
        if (!uuidValue) {
          const newId = crypto.randomUUID(); // Tạo ngay nếu chưa có
          setUuidValue(newId);
          finalString = newId;
        } else {
          finalString = uuidValue;
        }
        break;
      default:
        finalString = textInput;
    }
    setQrValue(finalString);
  }, [activeType, wifiData, emailData, textInput, uuidValue]);

  const regenerateUUID = () => {
    setUuidValue(crypto.randomUUID());
  };

  // Hàm tạo ngẫu nhiên (Cho vui hoặc test)
  const generateRandom = () => {
    const randomString =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    setActiveType("text");
    setTextInput(randomString);
  };

  // Hàm tải ảnh QR về máy
  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qrcode-${activeType}-${Date.now()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      {/* --- CỘT TRÁI: ĐIỀU KHIỂN --- */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-thin pr-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <QrCode className="text-indigo-500" /> QR Generator
          </h2>
          <p className="text-xs text-slate-400">
            Create smart QR codes instantly.
          </p>
        </div>

        {/* Tab chọn loại */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all ${
                activeType === t.id
                  ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* Input Form thay đổi theo loại */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 rounded-xl space-y-3">
          {activeType === "wifi" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                {/* Cột 1: SSID */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                    placeholder="MyWiFi"
                    value={wifiData.ssid}
                    onChange={(e) =>
                      setWifiData({ ...wifiData, ssid: e.target.value })
                    }
                  />
                </div>

                {/* Cột 2: Password */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                    placeholder="password123"
                    value={wifiData.password}
                    onChange={(e) =>
                      setWifiData({ ...wifiData, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Encryption
                </label>
                <select
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none"
                  value={wifiData.encryption}
                  onChange={(e) =>
                    setWifiData({ ...wifiData, encryption: e.target.value })
                  }
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No Password</option>
                </select>
              </div>
            </div>
          )}

          {activeType === "email" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
              <input
                type="email"
                placeholder="To: email@example.com"
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                value={emailData.to}
                onChange={(e) =>
                  setEmailData({ ...emailData, to: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500"
                value={emailData.subject}
                onChange={(e) =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
              />
              <textarea
                placeholder="Message body..."
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 h-20 resize-none"
                value={emailData.body}
                onChange={(e) =>
                  setEmailData({ ...emailData, body: e.target.value })
                }
              />
            </div>
          )}

          {(activeType === "text" || activeType === "url") && (
            <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Content
              </label>
              <textarea
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-500 h-24 resize-none"
                placeholder={
                  activeType === "url"
                    ? "https://example.com"
                    : "Type something..."
                }
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button
                onClick={generateRandom}
                className="text-xs flex items-center gap-1 text-indigo-500 hover:underline"
              >
                <RefreshCw size={12} /> Generate Random String
              </button>
            </div>
          )}

          {activeType === "uuid" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-left-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
                  Generated UUID (v4)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 break-all select-all">
                    {uuidValue}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(uuidValue)}
                    className="p-2 bg-slate-200 dark:bg-white/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-500 rounded-lg transition-colors"
                    title="Copy to Clipboard"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <button
                onClick={regenerateUUID}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors text-xs font-bold"
              >
                <RefreshCw size={14} /> Generate New UUID
              </button>
            </div>
          )}
        </div>

        {/* Color Picker */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
              Foreground
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500">
                {fgColor}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500">
                {bgColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: KẾT QUẢ --- */}
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
    </div>
  );
};
