import { DB } from "../constants/tester_const";
import { ValidationRule } from "../types/tester_type";

export const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

export const randNum = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const Generators: Record<string, () => any> = {
  id: () => randNum(1000, 9999),
  uuid: () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) =>
      (c === "x"
        ? (Math.random() * 16) | 0
        : (((Math.random() * 16) | 0) & 0x3) | 0x8
      ).toString(16),
    ),
  name: () => `${rand(DB.first)} ${rand(DB.last)}`,
  email: () => `user.${randNum(1000, 9999)}@${rand(DB.domains)}`,
  phone: () => `0${randNum(900, 999)}${randNum(1000000, 9999999)}`,
  role: () => rand(DB.roles),
  status: () => rand(DB.status),
  card: () =>
    `4${randNum(100, 999)} ${randNum(1000, 9999)} ${randNum(
      1000,
      9999,
    )} ${randNum(1000, 9999)}`,
  address: () => `${randNum(1, 999)} ${rand(DB.streets)}, ${rand(DB.cities)}`,
  date: () =>
    new Date(Date.now() - randNum(0, 10000000000)).toISOString().split("T")[0],
  boolean: () => Math.random() > 0.5,
};

export const validateValue = (
  value: any,
  rule: ValidationRule,
): string | null => {
  const strVal = String(
    value !== undefined && value !== null ? value : "",
  ).trim();

  if (rule.type === "required") {
    return strVal === "" ? "Thiếu dữ liệu bắt buộc" : null;
  }
  if (strVal === "") return null; // Skip other checks if empty and not required

  switch (rule.type) {
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)
        ? null
        : "Email không hợp lệ";
    case "number":
      return !isNaN(Number(value)) ? null : "Phải là số";
    case "url":
      return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
        strVal,
      )
        ? null
        : "URL không hợp lệ";
    case "date":
      return !isNaN(Date.parse(strVal)) ? null : "Ngày không hợp lệ";
    case "string_length":
      const [minL, maxL] = (rule.params || "0,255").split(",").map(Number);
      if (strVal.length < minL) return `Quá ngắn (< ${minL} ký tự)`;
      if (strVal.length > maxL) return `Quá dài (> ${maxL} ký tự)`;
      return null;
    case "number_range":
      const num = Number(value);
      if (isNaN(num)) return "Không phải số";
      const [minN, maxN] = (rule.params || "0,100").split(",").map(Number);
      if (num < minN) return `Giá trị quá nhỏ (< ${minN})`;
      if (num > maxN) return `Giá trị quá lớn (> ${maxN})`;
      return null;
    case "enum":
      const options = (rule.params || "").split(",").map((s) => s.trim());
      return options.includes(strVal)
        ? null
        : `Giá trị không hợp lệ (Chỉ chấp nhận: ${rule.params})`;
    case "regex":
      try {
        const regex = new RegExp(rule.params || "");
        return regex.test(strVal) ? null : "Sai định dạng (Regex không khớp)";
      } catch {
        return "Lỗi cấu hình Regex";
      }
    default:
      return null;
  }
};
