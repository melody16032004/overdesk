import JSZip from "jszip";
import mammoth from "mammoth";

export const decodeQuotedPrintable = (input: string) => {
  return input
    .replace(/=\r\n/g, "")
    .replace(/=\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (p1) => String.fromCharCode(parseInt(p1, 16)));
};

// Hàm xử lý nội dung file .docx/.zip
export const parseDocxContent = async (
  arrayBuffer: ArrayBuffer,
): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const files = Object.keys(zip.files);

    // 1. Ưu tiên tìm file HTML/MHT trong zip
    const foundFile = files.find(
      (path) => path.endsWith(".html") || path.endsWith(".mht"),
    );

    if (foundFile) {
      let rawContent = (await zip.file(foundFile)?.async("string")) || "";

      if (foundFile.endsWith(".mht") || rawContent.includes("MIME-Version")) {
        rawContent = decodeQuotedPrintable(rawContent);
      }

      const match =
        rawContent.match(/<html[^>]*>([\s\S]*)<\/html>/i) ||
        rawContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const htmlResult =
        match && match[1]
          ? match[1]
          : rawContent.includes("<")
            ? rawContent
            : "";

      if (htmlResult && htmlResult.length > 10) return htmlResult;
    }

    // 2. Fallback: Dùng Mammoth nếu không tìm thấy HTML hợp lệ
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (err) {
    console.error("Lỗi parse DOCX:", err);
    throw new Error("File bị hỏng hoặc không hỗ trợ.");
  }
};
