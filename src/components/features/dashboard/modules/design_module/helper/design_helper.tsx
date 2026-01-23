import { TAILWIND_COLORS } from "../constants/design_const";

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    })
    .join("");

export const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
};

export const getLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

export const getContrastRatio = (hex1: string, hex2: string) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
};

export const getHarmonies = (baseHex: string) => {
  const rgb = hexToRgb(baseHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shiftHue = (deg: number) => {
    const newH = (hsl.h + deg) % 360;
    const newRgb = hslToRgb(newH, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  };
  return {
    complementary: shiftHue(180),
    analogous: [shiftHue(330), shiftHue(30)],
    triadic: [shiftHue(120), shiftHue(240)],
    monochromatic: [
      rgbToHex(
        Math.min(255, rgb.r * 1.4),
        Math.min(255, rgb.g * 1.4),
        Math.min(255, rgb.b * 1.4),
      ),
      rgbToHex(
        Math.max(0, rgb.r * 0.6),
        Math.max(0, rgb.g * 0.6),
        Math.max(0, rgb.b * 0.6),
      ),
    ],
  };
};

export const findNearestTailwind = (hex: string) => {
  const target = hexToRgb(hex);
  let minDist = Infinity;
  let name = "Custom";
  Object.entries(TAILWIND_COLORS).forEach(([tHex, tName]) => {
    const tRgb = hexToRgb(tHex);
    const dist = Math.sqrt(
      Math.pow(target.r - tRgb.r, 2) +
        Math.pow(target.g - tRgb.g, 2) +
        Math.pow(target.b - tRgb.b, 2),
    );
    if (dist < minDist) {
      minDist = dist;
      name = tName;
    }
  });
  return minDist < 50 ? name : "Custom";
};

export const extractDominantColors = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const colorCounts: Record<string, number> = {};
  const step = 20;
  for (let i = 0; i < imgData.length; i += 4 * step) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];
    if (a < 128) continue;
    const round = (n: number) => Math.round(n / 30) * 30;
    const key = `${round(r)},${round(g)},${round(b)}`;
    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }
  return Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return rgbToHex(r, g, b);
    });
};

export const extractFullPalette = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  const uniqueColors = new Set<string>();
  const step = 10; // Bước nhảy pixel (càng nhỏ càng chi tiết nhưng chậm hơn)

  for (let i = 0; i < imgData.length; i += 4 * step) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];
    if (a < 128) continue; // Bỏ qua pixel trong suốt

    // Quantization: Làm tròn màu để giảm số lượng biến thể quá nhỏ
    const round = (n: number) => Math.round(n / 20) * 20;
    const hex = rgbToHex(round(r), round(g), round(b));
    uniqueColors.add(hex);

    // Giới hạn số lượng màu để tránh treo trình duyệt
    if (uniqueColors.size >= 200) break;
  }

  // --- THUẬT TOÁN SẮP XẾP MỚI ---
  return Array.from(uniqueColors).sort((a, b) => {
    const rgbA = hexToRgb(a);
    const rgbB = hexToRgb(b);

    // Chuyển sang hệ màu HSL để dễ so sánh
    const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
    const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);

    // 1. Tách màu Grayscale (Xám/Đen/Trắng) xuống cuối cùng
    // Điều kiện: Độ bão hòa (S) < 15% HOẶC quá tối/quá sáng
    const isGrayA = hslA.s < 15 || hslA.l < 10 || hslA.l > 95;
    const isGrayB = hslB.s < 15 || hslB.l < 10 || hslB.l > 95;

    if (isGrayA && !isGrayB) return 1; // A là xám -> đẩy xuống sau
    if (!isGrayA && isGrayB) return -1; // B là xám -> đẩy A lên trước

    // Nếu cả 2 đều là Xám hoặc đều là Màu -> Xử lý tiếp
    if (isGrayA && isGrayB) {
      return hslB.l - hslA.l; // Cả 2 xám: Sắp xếp từ Sáng -> Tối
    }

    // 2. Gom nhóm màu (Hue Binning)
    // Chia 360 độ thành 18 nhóm (mỗi nhóm 20 độ) để gom các màu gần nhau lại
    const binSize = 20;
    const binA = Math.floor(hslA.h / binSize);
    const binB = Math.floor(hslB.h / binSize);

    if (binA !== binB) {
      return binA - binB; // Khác nhóm -> Sắp xếp theo thứ tự cầu vồng (Đỏ -> Cam -> Vàng...)
    }

    // 3. Trong cùng nhóm màu -> Sắp xếp từ Nhạt (Sáng) đến Đậm (Tối)
    // L (Lightness) cao là sáng, thấp là tối.
    return hslB.l - hslA.l;
  });
};

export const adjustBrightness = (hex: string, amount: number) => {
  let { r, g, b } = hexToRgb(hex);
  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));
  return rgbToHex(r, g, b);
};

export const findSafeColor = (fgHex: string, bgHex: string) => {
  const bgLum = getLuminance(
    hexToRgb(bgHex).r,
    hexToRgb(bgHex).g,
    hexToRgb(bgHex).b,
  );
  const direction = bgLum > 0.5 ? -10 : 10;
  let safeColor = fgHex;
  let safetyLoop = 0;
  while (getContrastRatio(safeColor, bgHex) < 4.5 && safetyLoop < 50) {
    safeColor = adjustBrightness(safeColor, direction);
    safetyLoop++;
  }
  return safeColor;
};
