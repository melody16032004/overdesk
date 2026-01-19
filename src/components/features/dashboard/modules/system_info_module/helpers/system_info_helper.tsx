export const getSystemDetails = () => {
  const ua = navigator.userAgent;
  let os = "Unknown OS";
  if (ua.indexOf("Win") !== -1) os = "Windows";
  if (ua.indexOf("Mac") !== -1) os = "MacOS";
  if (ua.indexOf("Linux") !== -1) os = "Linux";
  if (ua.indexOf("Android") !== -1) os = "Android";
  if (ua.indexOf("like Mac") !== -1) os = "iOS";

  let browser = "Unknown Browser";
  if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
  if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
  if (ua.indexOf("Safari") !== -1 && ua.indexOf("Chrome") === -1)
    browser = "Safari";
  if (ua.indexOf("Edg") !== -1) browser = "Edge";

  return { os, browser };
};

export const getSignalStrength = (rtt: number) => {
  if (!rtt) return 4;
  if (rtt < 50) return 4;
  if (rtt < 100) return 3;
  if (rtt < 200) return 2;
  return 1;
};
