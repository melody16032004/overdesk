import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Inbox,
  Send,
  Trash2,
  Star,
  AlertOctagon,
  Reply,
  ChevronLeft,
  PenSquare,
  RefreshCw,
  Loader2,
  Mail as MailIcon,
  LogOut,
  Paperclip,
  Filter,
  Menu,
  X,
  Minimize2,
  Maximize2,
  Forward,
} from "lucide-react";
import { Email, MailFolder } from "./types/mail_type";
import {
  fetchEmailDetails,
  fetchMessageIds,
  sendEmail,
  trashEmail,
  modifyEmailLabels,
} from "./services/gmail_service";
import { useGmailAuth } from "./hooks/useGmailAuth";
import { useToastStore } from "../../../../../stores/useToastStore";
import newMsgSound from "/sounds/messages/notification_2.mp3";
import sendSound from "/sounds/messages/send.mp3";
import { playSendSound } from "./helper/mail_helper";

// --- COMPONENTS ---

// 1. Skeleton Loading
const MailSkeleton = () => (
  <div className="p-4 border-b border-slate-200 dark:border-[#2d2d2d] animate-pulse">
    <div className="flex justify-between items-center mb-2">
      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/3"></div>
      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-12"></div>
    </div>
    <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
  </div>
);

// 2. Compose Modal
const ComposeModal = ({
  onClose,
  onSuccess,
  token,
  initialData,
}: {
  onClose: () => void;
  onSuccess?: () => void;
  token: string;
  initialData?: { to: string; subject: string; body: string };
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const { showToast } = useToastStore();

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || "");
      setSubject(initialData.subject || "");
      setBody(initialData.body || "");
    } else {
      setTo("");
      setSubject("");
      setBody("");
    }
  }, [initialData]);

  // Function to play the sound

  const handleSend = async () => {
    if (!to || !subject)
      return showToast("Vui lòng nhập người nhận và chủ đề", "warning");

    setSending(true);
    try {
      await sendEmail(token, to, subject, body);

      playSendSound(sendSound);

      showToast("Đã gửi", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      showToast(`Gửi thất bại: ${e}`, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`
      absolute z-50 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#3e3e42] shadow-2xl transition-all duration-300 flex flex-col
      ${
        isMaximized
          ? "inset-0 rounded-none"
          : "bottom-0 right-4 w-[90%] md:w-[500px] h-[500px] max-h-[90%] rounded-t-xl"
      }
    `}
    >
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-[#252526] border-b border-slate-200 dark:border-[#3e3e42] rounded-t-xl shrink-0">
        <h3 className="text-sm font-bold text-slate-700 dark:text-white">
          {initialData?.subject.startsWith("Re:")
            ? "Trả lời"
            : initialData?.subject.startsWith("Fwd:")
              ? "Chuyển tiếp"
              : "Thư mới"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-transparent border-b border-slate-200 dark:border-[#3e3e42] py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 placeholder:text-slate-400"
          placeholder="Tới"
          autoFocus={!to}
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-transparent border-b border-slate-200 dark:border-[#3e3e42] py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 placeholder:text-slate-400"
          placeholder="Chủ đề"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-700 dark:text-slate-300 mt-2 placeholder:text-slate-400"
          placeholder="Viết nội dung..."
          autoFocus={!!to}
        />
      </div>
      <div className="p-3 border-t border-slate-200 dark:border-[#3e3e42] flex justify-between items-center bg-slate-50 dark:bg-[#252526] shrink-0">
        <div className="flex gap-3 text-slate-400">
          <Paperclip
            size={18}
            className="cursor-pointer hover:text-slate-600 dark:hover:text-white"
          />
          <span className="text-xs">Formatting options...</span>
        </div>
        <button
          onClick={handleSend}
          disabled={sending}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center gap-2"
        >
          {sending ? "Đang gửi..." : "Gửi"} <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export const MailModule = () => {
  const { accessToken, isTokenValid, login, logout } = useGmailAuth();

  // --- STATE ---
  const [mailStore, setMailStore] = useState<Record<MailFolder, Email[]>>({
    inbox: [],
    sent: [],
    spam: [],
    trash: [],
  });

  // [NEW] Theo dõi xem folder nào đã được tải dữ liệu rồi
  const [loadedFolders, setLoadedFolders] = useState<
    Record<MailFolder, boolean>
  >({
    inbox: false,
    sent: false,
    spam: false,
    trash: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [composeState, setComposeState] = useState<{
    isOpen: boolean;
    data: { to: string; subject: string; body: string } | undefined;
  }>({
    isOpen: false,
    data: undefined,
  });

  const [selectedFolder, setSelectedFolder] = useState<MailFolder>("inbox");
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);

  const mailStoreRef = useRef(mailStore);
  useEffect(() => {
    mailStoreRef.current = mailStore;
  }, [mailStore]);

  // --- CORE FETCHING ---
  const fetchFolderData = async (
    token: string,
    folder: MailFolder,
    qty: number = 10,
  ) => {
    let query = "in:inbox";
    if (folder === "sent") query = "in:sent";
    if (folder === "spam") query = "in:spam";
    if (folder === "trash") query = "in:trash";

    try {
      const messages = await fetchMessageIds(token, qty, query);
      const currentEmails = mailStoreRef.current[folder] || [];
      const newMessages = messages.filter(
        (msg: any) => !currentEmails.find((e) => e.id === msg.id),
      );

      let newEmailsData: Email[] = [];
      if (newMessages.length > 0) {
        const emailPromises = newMessages.map((msg: any) =>
          fetchEmailDetails(token, msg.id),
        );
        newEmailsData = await Promise.all(emailPromises);

        playSendSound(newMsgSound);
      }

      const mergedList = messages
        .map((msg: any) => {
          const isNew = newEmailsData.find((e) => e.id === msg.id);
          const isOld = currentEmails.find((e) => e.id === msg.id);
          const finalMail = isNew || isOld;
          if (finalMail) return { ...finalMail, folder };
          return null;
        })
        .filter(Boolean) as Email[];

      return mergedList;
    } catch (e) {
      console.error(`Lỗi tải folder ${folder}:`, e);
      return mailStoreRef.current[folder] || [];
    }
  };

  // --- ACTIONS ---
  // 1. Chỉ tải 1 folder cụ thể (Dùng khi click vào sidebar hoặc init inbox)
  const loadSingleFolder = async (folder: MailFolder, qty: number) => {
    if (!accessToken || !isTokenValid()) return;
    setIsLoading(true);
    try {
      const data = await fetchFolderData(accessToken, folder, qty);
      setMailStore((prev) => ({ ...prev, [folder]: data }));
      setLoadedFolders((prev) => ({ ...prev, [folder]: true }));
    } finally {
      setIsLoading(false);
    }
  };

  // --- 1. FETCH LOGIC ---
  const fetchSmartFolderData = async (token: string, folder: MailFolder) => {
    let query = "in:inbox";
    if (folder === "sent") query = "in:sent";
    if (folder === "spam") query = "in:spam";
    if (folder === "trash") query = "in:trash";

    try {
      // 1. Lấy 20 ID mới nhất từ Server
      const serverMessages = await fetchMessageIds(token, 10, query);

      // 2. Lấy danh sách mail đang có ở Local
      const currentEmails = mailStoreRef.current[folder] || [];

      // 3. Tìm xem có ID nào MỚI không (chưa có trong local)
      const newMessages = serverMessages.filter(
        (msg: any) => !currentEmails.find((e) => e.id === msg.id),
      );

      let newEmailsData: Email[] = [];

      // 4. Nếu có mail mới, tải chi tiết
      if (newMessages.length > 0) {
        // console.log(`Folder ${folder}: Phát hiện ${newMessages.length} thư mới, đang tải nội dung...`);
        const emailPromises = newMessages.map((msg: any) =>
          fetchEmailDetails(token, msg.id),
        );
        newEmailsData = await Promise.all(emailPromises);
      } else {
        // console.log(`Folder ${folder}: Không có thư mới.`);
      }

      // 5. Gộp danh sách:
      // Duyệt qua danh sách ID từ Server (để đảm bảo thứ tự và xóa mail đã mất trên server)
      // Nếu ID đó là mới -> lấy từ newEmailsData
      // Nếu ID đó đã có -> lấy từ currentEmails (giữ nguyên trạng thái cũ)
      const mergedList = serverMessages
        .map((msg: any) => {
          const isNew = newEmailsData.find((e) => e.id === msg.id);
          const isOld = currentEmails.find((e) => e.id === msg.id);

          const finalMail = isNew || isOld;
          if (finalMail) {
            return { ...finalMail, folder }; // Đảm bảo folder tag đúng
          }
          return null;
        })
        .filter(Boolean) as Email[];

      return mergedList;
    } catch (e) {
      console.error(`Lỗi tải folder ${folder}:`, e);
      // Nếu lỗi, trả về danh sách cũ để không bị trắng trang
      return mailStoreRef.current[folder] || [];
    }
  };

  // --- 2. REFRESH ALL ---
  const refreshAllData = useCallback(
    async (showLoadingUI = false) => {
      if (!accessToken || !isTokenValid()) return;

      if (showLoadingUI) setIsLoading(true); // Chỉ hiện Skeleton khi cần thiết (lần đầu)
      setIsRefreshing(true); // Luôn xoay icon refresh

      try {
        const [inbox, sent, spam, trash] = await Promise.all([
          fetchSmartFolderData(accessToken, "inbox"),
          fetchSmartFolderData(accessToken, "sent"),
          fetchSmartFolderData(accessToken, "spam"),
          fetchSmartFolderData(accessToken, "trash"),
        ]);
        setMailStore({ inbox, sent, spam, trash });
        setLoadedFolders({ inbox: true, sent: true, spam: true, trash: true });
      } catch (e) {
        console.error("Lỗi refresh:", e);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [accessToken, isTokenValid],
  );

  // --- 3. EFFECTS ---
  useEffect(() => {
    if (isTokenValid()) {
      refreshAllData();
      // loadSingleFolder("inbox");
    }
  }, [accessToken]);
  // Effect 2: Khi bấm vào folder khác, nếu chưa tải thì mới tải
  useEffect(() => {
    if (isTokenValid()) {
      if (!loadedFolders[selectedFolder]) {
        // Nếu chưa tải thì tải
        loadSingleFolder(selectedFolder, 10);
      } else {
        // Nếu tải rồi thì cập nhật
      }
    }
  }, [selectedFolder]);

  // Auto-refresh mỗi n phút
  useEffect(() => {
    if (!isTokenValid()) return;
    const interval = setInterval(
      () => {
        console.log("Auto-refreshing...");
        // refreshAllData();
        loadSingleFolder("inbox", 15);
      },
      // 5 * 60 * 1000,
      15000,
    );
    return () => clearInterval(interval);
  }, [refreshAllData, isTokenValid]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (composeState.isOpen)
          setComposeState((prev) => ({ ...prev, isOpen: false }));
        else if (selectedMailId) setSelectedMailId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [composeState.isOpen, selectedMailId]);

  // --- 4. COMPUTED ---
  const currentList = mailStore[selectedFolder] || [];

  const filteredEmails = useMemo(() => {
    return currentList
      .filter((e) => !filterUnread || !e.read)
      .filter(
        (e) =>
          e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.sender.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentList, searchQuery, filterUnread]);

  const selectedMail = currentList.find((e) => e.id === selectedMailId);

  // --- 5. ACTION HANDLERS ---

  const handleComposeNew = () => {
    setComposeState({
      isOpen: true,
      data: undefined,
    });
    setShowMobileSidebar(false);
  };

  const handleReply = () => {
    if (!selectedMail) return;
    const subjectPrefix = selectedMail.subject.startsWith("Re:") ? "" : "Re: ";
    setComposeState({
      isOpen: true,
      data: {
        to: selectedMail.email,
        subject: subjectPrefix + selectedMail.subject,
        body: "",
      },
    });
  };

  const handleForward = () => {
    if (!selectedMail) return;
    const subjectPrefix = selectedMail.subject.startsWith("Fwd:")
      ? ""
      : "Fwd: ";
    const cleanBody = selectedMail.body.replace(/<[^>]+>/g, " ").trim();

    setComposeState({
      isOpen: true,
      data: {
        to: "",
        subject: subjectPrefix + selectedMail.subject,
        body: `\n\n\n---------- Thư được chuyển tiếp ----------\nTừ: ${selectedMail.sender} <${selectedMail.email}>\nNgày: ${new Date(selectedMail.date).toLocaleString()}\nChủ đề: ${selectedMail.subject}\n\n${cleanBody.substring(0, 300)}...`,
      },
    });
  };

  const handleDelete = async (id: string) => {
    const mailToDelete = currentList.find((e) => e.id === id);
    if (!mailToDelete) return;

    // Optimistic Update
    setMailStore((prev) => ({
      ...prev,
      [selectedFolder]: prev[selectedFolder].filter((e) => e.id !== id),
      trash: [mailToDelete, ...prev.trash],
    }));

    if (selectedMailId === id) setSelectedMailId(null);

    if (accessToken) {
      try {
        await trashEmail(accessToken, id);
      } catch (e) {
        console.error("Lỗi xoá API:", e);
      }
    }
  };

  const handleToggleStar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const mail = currentList.find((m) => m.id === id);
    if (!mail || !accessToken) return;

    setMailStore((prev) => ({
      ...prev,
      [selectedFolder]: prev[selectedFolder].map((m) =>
        m.id === id ? { ...m, starred: !m.starred } : m,
      ),
    }));

    try {
      await modifyEmailLabels(
        accessToken,
        id,
        !mail.starred ? ["STARRED"] : [],
        !mail.starred ? [] : ["STARRED"],
      );
    } catch (err) {
      console.error("Lỗi star API:", err);
    }
  };

  const handleSelectMail = async (id: string) => {
    setSelectedMailId(id);
    const mail = currentList.find((m) => m.id === id);

    if (mail && !mail.read && accessToken) {
      setMailStore((prev) => ({
        ...prev,
        [selectedFolder]: prev[selectedFolder].map((m) =>
          m.id === id ? { ...m, read: true } : m,
        ),
      }));
      try {
        await modifyEmailLabels(accessToken, id, [], ["UNREAD"]);
      } catch (e) {
        console.error("Lỗi read API:", e);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  // --- RENDER ---

  if (!isTokenValid()) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-300 gap-6 animate-in fade-in zoom-in-95 duration-300 transition-colors">
        <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-red-900/40">
          <MailIcon size={48} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pro Mail
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Experience a faster, cleaner Gmail client directly on your
            dashboard.
          </p>
        </div>
        <button
          onClick={login}
          className="flex items-center gap-3 px-8 py-3.5 bg-white border border-slate-200 dark:border-transparent text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-xl active:scale-95 group"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            alt="G"
          />
          Connect with Google
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-slate-300 font-sans overflow-hidden relative isolate transition-colors">
      {/* 1. SIDEBAR */}
      <div
        className={`absolute inset-y-0 left-0 z-40 w-64 bg-slate-50 dark:bg-[#252526] border-r border-slate-200 dark:border-[#3e3e42] transform transition-transform duration-300 ease-in-out flex flex-col h-full shadow-2xl md:relative md:translate-x-0 md:w-56 md:shadow-none shrink-0 ${showMobileSidebar ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 h-16 flex items-center justify-between border-b border-slate-200 dark:border-[#3e3e42] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Inbox size={18} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
              MailBox
            </span>
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="md:hidden text-slate-500 dark:text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 shrink-0">
          <button
            onClick={handleComposeNew}
            className="w-full py-3 bg-white dark:bg-slate-100 hover:bg-slate-50 dark:hover:bg-white text-slate-900 border border-slate-200 dark:border-transparent rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all font-bold text-sm active:scale-95"
          >
            <PenSquare size={16} /> Soạn thư
          </button>
        </div>

        <div className="flex-1 px-2 space-y-1 overflow-y-auto mail-scrollbar min-h-0">
          {(["inbox", "sent", "spam", "trash"] as MailFolder[]).map(
            (folder) => {
              const isActive = selectedFolder === folder;
              const mailsInFolder = mailStore[folder] || [];
              const unreadCount = mailsInFolder.filter((m) => !m.read).length;
              const displayCount =
                unreadCount > 0 ? unreadCount : mailsInFolder.length;

              return (
                <button
                  key={folder}
                  onClick={() => {
                    setSelectedFolder(folder);
                    setSelectedMailId(null);
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm font-medium ${isActive ? "bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2d2d2d] hover:text-slate-900 dark:hover:text-slate-200"}`}
                >
                  <div className="flex items-center gap-3">
                    {folder === "inbox" && <Inbox size={18} />}
                    {folder === "sent" && <Send size={18} />}
                    {folder === "spam" && <AlertOctagon size={18} />}
                    {folder === "trash" && <Trash2 size={18} />}
                    <span className="capitalize">{folder}</span>
                  </div>
                  {displayCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${unreadCount > 0 ? "bg-red-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
                    >
                      {displayCount}
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-[#3e3e42] shrink-0">
          <button
            onClick={() => {
              setShowMobileSidebar(!showMobileSidebar);
              logout();
            }}
            className="flex items-center gap-3 text-slate-500 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 text-sm font-medium transition-colors w-full"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {showMobileSidebar && (
        <div
          className="absolute inset-0 bg-black/20 dark:bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* 2. EMAIL LIST */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1e1e1e] transition-all duration-300 ${selectedMailId ? "hidden md:flex md:w-80 md:flex-none md:border-r border-slate-200 dark:border-[#3e3e42]" : "flex w-full"}`}
      >
        <div className="h-16 px-4 border-b border-slate-200 dark:border-[#3e3e42] flex items-center gap-3 bg-white dark:bg-[#1e1e1e] sticky top-0 z-10 shrink-0">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <Menu size={20} />
          </button>
          <div className="relative flex-1 group">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#252526] border border-transparent dark:border-[#3e3e42] rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`p-2 rounded-lg transition-colors ${filterUnread ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-[#3e3e42]"}`}
            title="Lọc tin chưa đọc"
          >
            <Filter size={18} />
          </button>

          {/* NÚT REFRESH THỦ CÔNG: Gọi refreshAllData(true) để hiện Skeleton */}
          <button
            onClick={() => refreshAllData(true)}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#3e3e42] rounded-lg"
            title="Làm mới tất cả"
          >
            {isRefreshing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mail-scrollbar min-h-0 bg-slate-50 dark:bg-[#1e1e1e]">
          {/* Hiện Skeleton nếu đang load và list trống */}
          {isLoading ? (
            [...Array(5)].map((_, i) => <MailSkeleton key={i} />)
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 opacity-60">
              <Inbox size={48} strokeWidth={1} className="mb-2" />
              <p className="text-sm font-medium">Hộp thư trống</p>
            </div>
          ) : (
            filteredEmails.map((mail) => (
              <div
                key={mail.id}
                onClick={() => handleSelectMail(mail.id)}
                className={`p-4 border-b border-slate-200 dark:border-[#2d2d2d] cursor-pointer transition-all relative group hover:bg-slate-100 dark:hover:bg-[#252526] ${selectedMailId === mail.id ? "bg-blue-50 dark:bg-[#252526] border-l-[3px] border-l-blue-500 pl-[13px]" : "bg-white dark:bg-[#1e1e1e] border-l-[3px] border-l-transparent pl-[13px]"} ${!mail.read ? "bg-slate-50/50 dark:bg-[#252526]/30" : ""}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h4
                    className={`text-sm truncate max-w-[70%] ${!mail.read ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-300"}`}
                  >
                    {mail.sender}
                  </h4>
                  <span
                    className={`text-[10px] ${!mail.read ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {formatDate(mail.date)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs truncate max-w-[85%] ${!mail.read ? "text-slate-800 dark:text-slate-200 font-semibold" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    {mail.subject || "(Không có chủ đề)"}
                  </span>
                  {mail.id && (
                    <Paperclip size={12} className="text-slate-500 opacity-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate line-clamp-1 mt-1">
                  {mail.preview}
                </p>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-white dark:bg-[#1e1e1e] shadow-xl border border-slate-200 dark:border-[#3e3e42] rounded-lg p-1 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(mail.id);
                    }}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={(e) => handleToggleStar(e, mail.id)}
                    className={`p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 rounded ${mail.starred ? "text-yellow-500 dark:text-yellow-400" : "text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400"}`}
                    title="Đánh dấu sao"
                  >
                    <Star
                      size={14}
                      fill={mail.starred ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. MAIL DETAIL */}
      <div
        className={`flex-1 flex-col bg-white dark:bg-[#1e1e1e] min-w-0 transition-all duration-300 ${selectedMailId ? "flex absolute inset-0 z-50 md:static md:z-auto" : "hidden md:flex"}`}
      >
        {selectedMail ? (
          <>
            <div className="h-16 px-4 border-b border-slate-200 dark:border-[#3e3e42] flex items-center justify-between bg-white/80 dark:bg-[#252526]/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedMailId(null)}
                  className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex gap-1 bg-slate-100 dark:bg-[#1e1e1e] rounded-lg p-1 border border-slate-200 dark:border-[#3e3e42]">
                  <button
                    onClick={handleReply}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-[#2d2d2d] rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Trả lời"
                  >
                    <Reply size={16} />
                  </button>
                  <button
                    onClick={handleForward}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-[#2d2d2d] rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Chuyển tiếp"
                  >
                    <Forward size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMail.id)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-[#2d2d2d] rounded text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={(e) => handleToggleStar(e, selectedMail.id)}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-[#2d2d2d] rounded text-slate-500 dark:text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
                    title="Đánh dấu sao"
                  >
                    <Star
                      size={16}
                      fill={selectedMail.starred ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    className="p-2 hover:bg-slate-200 dark:hover:bg-[#2d2d2d] rounded text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                    title="Báo cáo Spam"
                  >
                    <AlertOctagon size={16} />
                  </button>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-[#1e1e1e] px-2 py-1 rounded border border-slate-200 dark:border-[#3e3e42] hidden md:block capitalize">
                {selectedFolder}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto mail-scrollbar p-6 md:p-10 bg-white dark:bg-[#1e1e1e] min-h-0">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-snug">
                  {selectedMail.subject}
                </h1>
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-[#3e3e42]">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ${selectedMail.avatarColor || "bg-gradient-to-br from-blue-500 to-indigo-600"}`}
                  >
                    {selectedMail.sender[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">
                        {selectedMail.sender}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {new Date(selectedMail.date).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-500">
                      to me &lt;{selectedMail.email}&gt;
                    </div>
                  </div>
                </div>
                <div
                  className="prose-mail text-base text-slate-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: selectedMail.body }}
                />
                <div className="mt-10 pt-6 border-t border-slate-200 dark:border-[#3e3e42] flex gap-3">
                  <button
                    onClick={handleReply}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-[#252526] hover:bg-slate-200 dark:hover:bg-[#2d2d2d] border border-slate-200 dark:border-[#3e3e42] rounded-xl text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2 transition-all"
                  >
                    <Reply size={16} /> Trả lời
                  </button>
                  <button
                    onClick={handleForward}
                    className="px-6 py-2.5 bg-slate-100 dark:bg-[#252526] hover:bg-slate-200 dark:hover:bg-[#2d2d2d] border border-slate-200 dark:border-[#3e3e42] rounded-xl text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2 transition-all"
                  >
                    <Forward size={16} /> Chuyển tiếp
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 opacity-40 bg-[url('/overdesk_logo.png')] bg-no-repeat bg-center bg-[length:100px_100px] grayscale blend-overlay">
            <p className="mt-40 text-sm">Chọn một email để đọc</p>
          </div>
        )}
      </div>

      {composeState.isOpen && accessToken && (
        <ComposeModal
          onClose={() => setComposeState({ ...composeState, isOpen: false })}
          onSuccess={() => refreshAllData(false)}
          token={accessToken}
          initialData={composeState.data}
        />
      )}
    </div>
  );
};
