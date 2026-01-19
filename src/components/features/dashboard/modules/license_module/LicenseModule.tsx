import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import {
  Scale,
  Shield,
  FileText,
  Lock,
  Mail,
  Check,
  Copy,
  Award,
  AlertTriangle,
  Languages,
} from "lucide-react";
import { PrivacyItem } from "./components/PrivacyItem";
import { TabButton } from "./components/TabButton";
import { LEGAL_CONFIG, MIT_TEXT } from "./constants/license_const";
import { getTranslations } from "./helper/license_helper";
import { SectionHeader } from "../settings_module/components/SectionHeader";

export const LicenseModule = () => {
  const [activeTab, setActiveTab] = useState<"license" | "terms" | "privacy">(
    "license",
  );
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [copied, setCopied] = useState(false);

  // State lưu version thực tế
  const [realVersion, setRealVersion] = useState("Loading...");

  useEffect(() => {
    getVersion()
      .then(setRealVersion)
      .catch(() => setRealVersion("Web Mode"));
  }, []);

  // Lấy nội dung dựa trên ngôn ngữ và version hiện tại
  const t = getTranslations(realVersion)[lang];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLang = () => {
    setLang((prev) => (prev === "en" ? "vi" : "en"));
  };

  return (
    <div className="h-full flex flex-col font-sans bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 select-none transition-colors">
      {/* --- HEADER --- */}
      <div className="flex-none p-6 pb-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Scale size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.header.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                <Award size={10} className="text-emerald-500" />{" "}
                {t.header.verified}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* NÚT TOGGLE NGÔN NGỮ */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-all border border-slate-200 dark:border-white/5"
            >
              <Languages
                size={12}
                className="text-slate-500 dark:text-slate-400"
              />
              <span
                className={`text-[10px] font-bold ${lang === "en" ? "text-blue-600" : "text-slate-400"}`}
              >
                EN
              </span>
              <span className="text-[10px] text-slate-300">|</span>
              <span
                className={`text-[10px] font-bold ${lang === "vi" ? "text-blue-600" : "text-slate-400"}`}
              >
                VI
              </span>
            </button>

            <div className="text-right mt-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {t.header.lastUpdated}
              </div>
              <div className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                {LEGAL_CONFIG.updatedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mt-6">
          <TabButton
            active={activeTab === "license"}
            onClick={() => setActiveTab("license")}
            icon={Scale}
            label={t.tabs.license}
          />
          <TabButton
            active={activeTab === "terms"}
            onClick={() => setActiveTab("terms")}
            icon={FileText}
            label={t.tabs.terms}
          />
          <TabButton
            active={activeTab === "privacy"}
            onClick={() => setActiveTab("privacy")}
            icon={Lock}
            label={t.tabs.privacy}
          />
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
        {/* TAB 1: LICENSE */}
        {activeTab === "license" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 flex gap-3">
              <Shield
                size={24}
                className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-1"
              />
              <div>
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  {t.license.title}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                  {t.license.desc}
                </p>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={() => handleCopy(MIT_TEXT)}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
                title="Copy License Text"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              <pre className="p-5 rounded-xl bg-slate-100 border border-slate-200 dark:bg-black/30 dark:border-white/10 font-mono text-[13px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed text-justify select-text">
                {MIT_TEXT}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: TERMS */}
        {activeTab === "terms" && (
          <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
            <SectionHeader title={t.terms.sec1} />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              {t.terms.sec1_desc}
            </p>

            <SectionHeader title={t.terms.sec2} />
            <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4 pl-1">
              <li>{t.terms.sec2_li1}</li>
              <li>{t.terms.sec2_li2}</li>
            </ul>

            <SectionHeader title={t.terms.sec3} />
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 flex gap-2 mb-4">
              <AlertTriangle
                size={16}
                className="text-rose-500 shrink-0 mt-0.5"
              />
              <p className="text-[10px] text-rose-700 dark:text-rose-300 leading-relaxed">
                {t.terms.sec3_desc}
              </p>
            </div>

            <SectionHeader title={t.terms.sec4} />
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.terms.sec4_desc}
            </p>
          </div>
        )}

        {/* TAB 3: PRIVACY */}
        {activeTab === "privacy" && (
          <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-full text-blue-600 dark:text-blue-400">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">
                  {t.privacy.localFirstTitle}
                </h3>
                <p className="text-[11px] text-blue-700 dark:text-blue-400/80">
                  {t.privacy.localFirstDesc}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <PrivacyItem question={t.privacy.q1} answer={t.privacy.a1} />
              <PrivacyItem question={t.privacy.q2} answer={t.privacy.a2} />
              <PrivacyItem question={t.privacy.q3} answer={t.privacy.a3} />
            </div>
          </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="flex-none p-4 bg-slate-100 dark:bg-white/5 border-t border-slate-200 dark:border-white/5 flex justify-between items-center text-[10px]">
        <div className="text-slate-500">
          &copy; {new Date().getFullYear()} {LEGAL_CONFIG.companyName}.{" "}
          {t.footer.rights}
        </div>
        <a
          href={`mailto:${LEGAL_CONFIG.email}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/20 hover:text-blue-600 hover:border-blue-200 transition-all font-bold text-slate-600 dark:text-slate-300"
        >
          <Mail size={12} /> {t.footer.contact}
        </a>
      </div>
    </div>
  );
};
