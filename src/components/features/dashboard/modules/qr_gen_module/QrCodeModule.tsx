import { useState, useEffect } from "react";
import { QrCode } from "lucide-react";
import { TYPES } from "./constants/qr_gen_const";
import { EmailTab } from "./components/EmailTab";
import { TextUrlTab } from "./components/TextUrlTab";
import { UuidTab } from "./components/UuidTab";
import { WifiTab } from "./components/WifiTab";
import { ResultQr } from "./components/ResultQr";

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
          emailData.subject,
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
            <WifiTab wifiData={wifiData} setWifiData={setWifiData} />
          )}

          {activeType === "email" && (
            <EmailTab emailData={emailData} setEmailData={setEmailData} />
          )}

          {(activeType === "text" || activeType === "url") && (
            <TextUrlTab
              activeType={activeType}
              textInput={textInput}
              setTextInput={setTextInput}
              generateRandom={generateRandom}
            />
          )}

          {activeType === "uuid" && (
            <UuidTab uuidValue={uuidValue} regenerateUUID={regenerateUUID} />
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
                className="w-8 h-8 rounded pointer border-none bg-transparent"
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
                className="w-8 h-8 rounded pointer border-none bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500">
                {bgColor}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- CỘT PHẢI: KẾT QUẢ --- */}
      <ResultQr
        qrValue={qrValue}
        fgColor={fgColor}
        bgColor={bgColor}
        downloadQR={downloadQR}
        activeType={activeType}
      />
    </div>
  );
};
