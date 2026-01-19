export const base64UrlDecode = (str: string) => {
  try {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += "==";
        break;
      case 3:
        output += "=";
        break;
      default:
        throw new Error("Illegal base64url string!");
    }
    const result = window.atob(output);
    return decodeURIComponent(escape(result));
  } catch (e) {
    return null;
  }
};

export const formatTime = (timestamp: number) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
};

export const getRelativeTime = (timestamp: number) => {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);

  let timeStr = "";
  if (absDiff < 60) timeStr = `${absDiff}s`;
  else if (absDiff < 3600) timeStr = `${Math.floor(absDiff / 60)}m`;
  else if (absDiff < 86400) timeStr = `${Math.floor(absDiff / 3600)}h`;
  else if (absDiff < 2592000) timeStr = `${Math.floor(absDiff / 86400)}d`;
  else if (absDiff < 31536000) timeStr = `${Math.floor(absDiff / 2592000)}mo`;
  else timeStr = `${Math.floor(absDiff / 31536000)}y`;

  if (diff < 0) return `Expired ${timeStr} ago`;
  return `Expires in ${timeStr}`;
};
