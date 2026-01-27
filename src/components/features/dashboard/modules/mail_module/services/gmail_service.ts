import { Email } from "../types/mail_type";

const API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

// Helper: Giải mã nội dung Base64URL của Gmail
const decodeBase64 = (data: string) => {
  if (!data) return "";
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
};

// Helper: Tìm header (Subject, From, Date)
const getHeader = (headers: any[], name: string) => {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
    ""
  );
};

// Helper to create MIME message for sending
const createMimeMessage = (to: string, subject: string, body: string) => {
  const nl = "\n";
  const str = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join(nl);

  // Encode to Base64URL
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// 1. Lấy danh sách ID các mail mới nhất
export const fetchMessageIds = async (
  token: string,
  maxResults = 10,
  query = "in:inbox",
) => {
  const response = await fetch(
    `${API_BASE}/messages?maxResults=${maxResults}&q=${query}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!response.ok) throw new Error("Token hết hạn hoặc lỗi API");
  const data = await response.json();
  return data.messages || []; // Trả về mảng [{id: '...', threadId: '...'}]
};

// 2. Lấy chi tiết từng mail và convert sang kiểu dữ liệu của Dashboard
export const fetchEmailDetails = async (
  token: string,
  messageId: string,
): Promise<Email> => {
  const response = await fetch(`${API_BASE}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  const headers = data.payload.headers;

  // Xử lý Body (Gmail lồng body rất sâu)
  let bodyHtml = "";
  let snippet = data.snippet;

  // Hàm đệ quy tìm body HTML hoặc Plain Text
  const findBody = (parts: any[]) => {
    for (const part of parts) {
      if (part.mimeType === "text/html" && part.body.data) {
        bodyHtml = decodeBase64(part.body.data);
        return;
      }
      if (part.parts) findBody(part.parts);
    }
  };

  if (data.payload.body.data) {
    bodyHtml = decodeBase64(data.payload.body.data);
  } else if (data.payload.parts) {
    findBody(data.payload.parts);
  }

  // Parse người gửi "Google <no-reply@google.com>" -> "Google"
  const fromHeader = getHeader(headers, "From");
  const senderName =
    fromHeader.split("<")[0].trim().replace(/"/g, "") || fromHeader;
  const emailAddr = fromHeader.match(/<(.+)>/)?.[1] || "";

  return {
    id: data.id,
    sender: senderName,
    email: emailAddr,
    subject: getHeader(headers, "Subject") || "(Không có chủ đề)",
    preview: snippet,
    body: bodyHtml || snippet, // Fallback nếu không có HTML
    date: new Date(parseInt(data.internalDate)).toISOString(),
    read: !data.labelIds.includes("UNREAD"),
    starred: data.labelIds.includes("STARRED"),
    folder: "inbox",
    avatarColor: "bg-blue-600", // Màu ngẫu nhiên có thể xử lý sau
  };
};

// 3. Send Email [REAL]
export const sendEmail = async (
  token: string,
  to: string,
  subject: string,
  body: string,
) => {
  const raw = createMimeMessage(to, subject, body);
  const response = await fetch(`${API_BASE}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error.message);
  }
  return await response.json();
};

// 4. Modify Labels (Star, Read, Archive, Spam) [REAL]
export const modifyEmailLabels = async (
  token: string,
  messageId: string,
  addLabels: string[],
  removeLabels: string[],
) => {
  await fetch(`${API_BASE}/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      addLabelIds: addLabels,
      removeLabelIds: removeLabels,
    }),
  });
};

// 5. Trash Email [REAL]
export const trashEmail = async (token: string, messageId: string) => {
  await fetch(`${API_BASE}/messages/${messageId}/trash`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 6. Lấy số lượng thư chưa đọc của các nhãn [REAL]
export const fetchUnreadCounts = async (token: string) => {
  try {
    // Gọi song song 4 API để lấy chi tiết từng Label (vì API list không trả về số lượng)
    const [inboxRes, sentRes, spamRes, trashRes] = await Promise.all([
      fetch(`${API_BASE}/labels/INBOX`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/labels/SENT`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/labels/SPAM`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/labels/TRASH`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const inbox = await inboxRes.json();
    const sent = await sentRes.json();
    const spam = await spamRes.json();
    const trash = await trashRes.json();

    return {
      inbox: inbox.messagesUnread || 0,
      sent: sent.messagesTotal || 0, // Sent lấy tổng số, vì thư gửi đi unread luôn = 0
      spam: spam.messagesUnread || 0,
      trash: trash.messagesUnread || 0, // Hoặc trash.messagesTotal tùy bạn
    };
  } catch (error) {
    console.error("Lỗi lấy số lượng:", error);
    return { inbox: 0, sent: 0, spam: 0, trash: 0 };
  }
};

// 7. [SIÊU TỐI ƯU] Đếm số unread trong top 20 mail mới nhất
// KHÔNG tải nội dung, KHÔNG tải tiêu đề. Chỉ so sánh ID.
export const getInboxUnreadCountLimit20 = async (
  token: string,
  limit: number = 20,
): Promise<number> => {
  try {
    // Request 1: Lấy 20 ID mới nhất bất kể trạng thái (chỉ tốn ~1kb)
    const allMessagesPromise = fetch(
      `${API_BASE}/messages?maxResults=${limit}&q=in:inbox`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    // Request 2: Lấy 20 ID chưa đọc mới nhất (chỉ tốn ~1kb)
    const unreadMessagesPromise = fetch(
      `${API_BASE}/messages?maxResults=${limit}&q=in:inbox is:unread`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    // Chạy song song (Total time = max(req1, req2) ~ 100-300ms)
    const [allRes, unreadRes] = await Promise.all([
      allMessagesPromise,
      unreadMessagesPromise,
    ]);

    if (!allRes.ok || !unreadRes.ok) return 0;

    const allData = await allRes.json();
    const unreadData = await unreadRes.json();

    const allIds = (allData.messages || []).map((m: any) => m.id);
    const unreadIds = (unreadData.messages || []).map((m: any) => m.id);

    // Nếu inbox trống
    if (allIds.length === 0) return 0;

    // LOGIC GIAO THOA:
    // Đếm xem có bao nhiêu ID trong "Top 20" (allIds)
    // xuất hiện trong danh sách "Chưa đọc" (unreadIds)
    const count = allIds.filter((id: string) => unreadIds.includes(id)).length;

    return count;
  } catch (error) {
    console.error("Lỗi đếm số lượng (ID compare):", error);
    return 0;
  }
};
