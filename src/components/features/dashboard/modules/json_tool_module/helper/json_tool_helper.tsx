import { DiffLine } from "../types/json_tool_type";

export const formatJson = (str: string, indent = 2) => {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, indent);
  } catch (e: any) {
    throw new Error(e.message);
  }
};

// Thuật toán so sánh đơn giản (Line-by-Line Diff)
export const computeDiff = (textA: string, textB: string): DiffLine[] => {
  // 1. Format chuẩn trước khi so sánh
  let linesA: string[] = [];
  let linesB: string[] = [];

  try {
    linesA = formatJson(textA).split("\n");
  } catch {
    linesA = textA.split("\n");
  } // Fallback nếu không phải JSON

  try {
    linesB = formatJson(textB).split("\n");
  } catch {
    linesB = textB.split("\n");
  }

  // 2. So sánh (Naive Algorithm)
  const diffs: DiffLine[] = [];
  let i = 0,
    j = 0;

  while (i < linesA.length || j < linesB.length) {
    const lineA = linesA[i];
    const lineB = linesB[j];

    // Trường hợp giống nhau
    if (lineA === lineB) {
      diffs.push({ type: "same", content: lineA, lineNum: i + 1 });
      i++;
      j++;
    }
    // Khác nhau
    else {
      // Tìm xem dòng A có xuất hiện ở B tương lai gần không? (Để phát hiện Insert)
      let foundA_in_B = -1;
      for (let k = j + 1; k < Math.min(j + 5, linesB.length); k++) {
        if (linesB[k] === lineA) {
          foundA_in_B = k;
          break;
        }
      }

      if (foundA_in_B !== -1) {
        // Có vẻ như các dòng từ j đến foundA_in_B là mới thêm vào (ADD)
        while (j < foundA_in_B) {
          diffs.push({ type: "add", content: linesB[j] });
          j++;
        }
      } else {
        // Không thấy A trong B -> A đã bị xóa (REMOVE)
        // Hoặc là dòng modified (REMOVE A + ADD B)
        if (i < linesA.length) {
          diffs.push({ type: "remove", content: lineA, lineNum: i + 1 });
          i++;
        }
        // Nếu đây là modified, dòng B sẽ được xử lý ở vòng lặp sau hoặc coi như ADD ngay
        if (
          j < linesB.length &&
          (i >= linesA.length || linesA[i] === linesB[j + 1])
        ) {
          // Simple heuristic check
          diffs.push({ type: "add", content: lineB });
          j++;
        }
      }
    }
  }
  return diffs;
};
