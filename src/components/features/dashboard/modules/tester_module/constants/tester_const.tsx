import {
  List,
  Fingerprint,
  User,
  Mail,
  Phone,
  Shield,
  CreditCard,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
  Code2,
  Globe2Icon,
  HandshakeIcon,
  Ruler,
} from "lucide-react";
import { RuleType, ValidationRule } from "../types/tester_type";

export const DB = {
  first: [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
  ],
  last: [
    "Văn A",
    "Thị B",
    "Minh",
    "Hùng",
    "Lan",
    "Hương",
    "Tuấn",
    "Kiệt",
    "Linh",
    "Thảo",
    "Huy",
    "Nam",
  ],
  domains: ["gmail.com", "yahoo.com", "outlook.com", "dev.io", "test.vn"],
  streets: [
    "Nguyễn Huệ",
    "Lê Lợi",
    "Hàm Nghi",
    "Pasteur",
    "Điện Biên Phủ",
    "Cách Mạng Tháng 8",
  ],
  cities: ["HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"],
  roles: ["Admin", "User", "Editor", "Viewer", "Tester"],
  status: ["Active", "Inactive", "Pending", "Banned"],
};

export const FIELD_OPTIONS = [
  { id: "id", label: "ID (Int)", icon: List },
  { id: "uuid", label: "UUID", icon: Fingerprint },
  { id: "name", label: "Full Name", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "role", label: "Role", icon: Shield },
  { id: "card", label: "Credit Card", icon: CreditCard },
  { id: "address", label: "Address", icon: MapPin },
  { id: "date", label: "Date", icon: Calendar },
  { id: "status", label: "Status", icon: CheckCircle2 },
];

export const RULE_DEFINITIONS: Record<
  RuleType,
  { label: string; icon: any; hasParams?: boolean; placeholder?: string }
> = {
  required: { label: "Bắt buộc có", icon: CheckCircle2, hasParams: false },
  email: { label: "Là Email", icon: Mail, hasParams: false },
  number: { label: "Là Số", icon: HandshakeIcon, hasParams: false },
  string_length: {
    label: "Độ dài chuỗi",
    icon: Ruler,
    hasParams: true,
    placeholder: "min,max (VD: 3,20)",
  },
  number_range: {
    label: "Khoảng giá trị",
    icon: ArrowRightLeft,
    hasParams: true,
    placeholder: "min,max (VD: 18,100)",
  },
  enum: {
    label: "Trong danh sách",
    icon: List,
    hasParams: true,
    placeholder: "A,B,C (VD: Admin,User)",
  },
  regex: {
    label: "Regex (Tùy chỉnh)",
    icon: Code2,
    hasParams: true,
    placeholder: "Biểu thức (VD: ^[A-Z]+$)",
  },
  date: { label: "Là Ngày (ISO)", icon: Calendar, hasParams: false },
  url: { label: "Là URL", icon: Globe2Icon, hasParams: false },
};

export const DEFAULT_JSON =
  '[\n  {"name": "Nguyen A", "age": 15, "role": "Admin"},\n  {"name": "Tran B", "age": 200, "role": "Guest"},\n  {"name": "", "age": "abc", "role": "User"}\n]';

export const DEFAULT_RULES: ValidationRule[] = [
  { id: "1", field: "name", type: "required", active: true },
  {
    id: "2",
    field: "age",
    type: "number_range",
    params: "18,100",
    active: true,
  },
  { id: "3", field: "role", type: "enum", params: "Admin,User", active: true },
];
