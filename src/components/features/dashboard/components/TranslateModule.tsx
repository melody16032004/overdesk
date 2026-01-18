import { useState, useEffect, useRef } from 'react';
import { ArrowRightLeft, Copy, X, Loader2, Check, Image as ImageIcon } from 'lucide-react';
import { createWorker } from 'tesseract.js';

const LANGS = [
  { code: 'en', label: 'English', tess: 'eng' },
  { code: 'vi', label: 'Tiếng Việt', tess: 'vie' },
  { code: 'ja', label: 'Japanese', tess: 'jpn' },
  { code: 'ko', label: 'Korean', tess: 'kor' },
  { code: 'zh', label: 'Chinese', tess: 'chi_sim' },
  { code: 'fr', label: 'French', tess: 'fra' },
  { code: 'es', label: 'Spanish', tess: 'spa' },
  { code: 'de', label: 'German', tess: 'deu' },
];

export const TranslateModule = () => {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('vi');
  
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);     // Loading dịch
  const [isOcrLoading, setIsOcrLoading] = useState(false); // Loading đọc ảnh
  const [copied, setCopied] = useState(false);
  
  // State quản lý ảnh
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC DỊCH (Debounce) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim() && !isOcrLoading) { // Chỉ dịch khi không đang quét ảnh
        handleTranslate();
      } else if (!text.trim()) {
        setTranslated('');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [text, sourceLang, targetLang]);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await response.json();
      if (data.responseData) {
        setTranslated(data.responseData.translatedText);
      }
    } catch (error) {
      setTranslated('Error: Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC OCR (ĐỌC ẢNH) ---
// --- LOGIC OCR (ĐỌC ẢNH) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setIsOcrLoading(true);
    setText('⏳ Đang phân tích ảnh... (Vui lòng đợi)'); // Thông báo rõ ràng hơn
    setTranslated('');

    try {
      // 1. Lấy mã ngôn ngữ từ dropdown Nguồn (Bên trái)
      const selectedLangConfig = LANGS.find(l => l.code === sourceLang)?.tess || 'eng';
      
      // 2. MẸO QUAN TRỌNG: Luôn kết hợp với tiếng Anh (eng) để tăng độ chính xác
      // Ví dụ: Nếu chọn Tiếng Việt -> tải 'vie+eng'
      const langsToLoad = selectedLangConfig === 'eng' ? 'eng' : `${selectedLangConfig}+eng`;

      // 3. Khởi tạo Worker với ngôn ngữ đã chọn
      // logger giúp bạn xem tiến độ tải language trong Console (F12)
      const worker = await createWorker(langsToLoad, 1, {
        logger: m => console.log(m), 
      });
      
      // 4. Nhận diện
      const { data: { text: recognizedText } } = await worker.recognize(file);
      
      // 5. Kết thúc
      await worker.terminate();

      // Kiểm tra nếu không đọc được chữ nào
      if (!recognizedText.trim()) {
         setText("Không tìm thấy văn bản nào trong ảnh. Thử ảnh rõ nét hơn.");
      } else {
         setText(recognizedText); 
      }

    } catch (error) {
      console.error(error);
      setText('Lỗi: Không thể đọc ảnh. Hãy đảm bảo bạn chọn đúng ngôn ngữ nguồn trước khi up ảnh.');
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setText('');
    setTranslated('');
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setText(translated);
    setTranslated(text);
    setSelectedImage(null); // Xóa ảnh khi đảo ngữ
  };

  const handleCopy = () => {
    if (translated) {
      navigator.clipboard.writeText(translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-white/5 p-2 gap-2">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between bg-white dark:bg-black/20 p-2 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
        <select 
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none w-24 cursor-pointer"
        >
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        <button onClick={handleSwap} className="p-1.5 rounded-full hover:bg-indigo-50 dark:hover:bg-white/10 text-indigo-500 transition-transform active:rotate-180">
          <ArrowRightLeft size={14} />
        </button>

        <select 
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-transparent text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none w-24 text-right cursor-pointer"
        >
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* --- BODY --- */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        
        {/* SOURCE INPUT AREA */}
        <div className="flex-1 bg-white dark:bg-black/20 rounded-xl p-3 border border-slate-200 dark:border-white/10 flex flex-col relative focus-within:border-indigo-500/50 transition-colors group">
          
          {/* Image Preview (Nếu có) */}
          {selectedImage && (
            <div className="relative mb-2 h-20 shrink-0 w-full bg-slate-100 dark:bg-white/5 rounded-lg overflow-hidden flex items-center justify-center border border-dashed border-slate-300 dark:border-white/10">
               <img src={selectedImage} alt="Source" className="h-full object-contain opacity-80" />
               {isOcrLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <Loader2 size={20} className="animate-spin text-white" />
                 </div>
               )}
               <button onClick={clearImage} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors">
                 <X size={10} />
               </button>
            </div>
          )}

          <textarea
            className="flex-1 w-full bg-transparent resize-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            placeholder={isOcrLoading ? "Extracting text..." : "Type or paste image..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isOcrLoading}
          />

          {/* Tools: Upload & Clear */}
          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-white/20 transition-colors"
               title="Import Image (OCR)"
             >
               <ImageIcon size={14} />
             </button>
             
             {text && (
                <button 
                  onClick={() => {setText(''); setTranslated(''); setSelectedImage(null);}}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/20 transition-colors"
                >
                  <X size={14} />
                </button>
             )}
          </div>
        </div>

        {/* TRANSLATED OUTPUT AREA */}
        <div className="flex-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-3 border border-indigo-100 dark:border-white/5 flex flex-col relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <textarea
              className="w-full h-full bg-transparent resize-none outline-none text-sm font-medium text-indigo-700 dark:text-indigo-300"
              placeholder="Translation..."
              value={translated}
              readOnly
            />
          )}
          
          <div className="absolute bottom-2 right-2">
             <button 
                onClick={handleCopy}
                disabled={!translated}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 text-indigo-400 transition-colors"
                title="Copy Result"
             >
                {copied ? <Check size={14} /> : <Copy size={14} />}
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};