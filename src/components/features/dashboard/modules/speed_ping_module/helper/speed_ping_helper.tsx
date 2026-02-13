export const getNetworkRating = (ping: number, download: number) => {
  // 1. Kiểm tra tốc độ quá thấp trước
  if (download < 5)
    return {
      label: "Slow Internet",
      color: "text-red-500",
      desc: "Web browsing only",
    };

  // 2. Ping cao (HTTP Ping > 400ms mới coi là lag)
  if (ping > 400)
    return {
      label: "High Latency",
      color: "text-orange-500",
      desc: "Delays in gaming/calls",
    };

  // 3. Đánh giá dựa trên tốc độ Download
  if (download < 15)
    return {
      label: "Average",
      color: "text-yellow-500",
      desc: "SD Streaming OK",
    };
  if (download < 50)
    return {
      label: "Good",
      color: "text-blue-400",
      desc: "HD/4K Streaming Ready",
    };

  // Tốc độ cao (> 50Mbps)
  return {
    label: "Excellent",
    color: "text-emerald-400",
    desc: "Perfect for Heavy Usage",
  };
};
