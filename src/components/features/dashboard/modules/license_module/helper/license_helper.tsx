import { LEGAL_CONFIG } from "../constants/license_const";

export const getTranslations = (version: string) => ({
  en: {
    header: {
      title: "Legal Center",
      verified: `Verified by ${LEGAL_CONFIG.companyName}`,
      lastUpdated: "Last Updated",
    },
    tabs: {
      license: "License",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
    },
    license: {
      title: "Open Source License",
      desc: "OverDesk is free and open-source software licensed under the MIT License. You are free to use, modify, and distribute this software under the conditions listed below.",
    },
    terms: {
      sec1: "1. Acceptance of Terms",
      sec1_desc: `By accessing and using OverDesk (v${version}), you accept and agree to be bound by the terms and provision of this agreement.`,
      sec2: "2. Use License",
      sec2_li1:
        "Permission is granted to temporarily download one copy of the materials for personal, non-commercial transitory viewing only.",
      sec2_li2: "This is the grant of a license, not a transfer of title.",
      sec3: "3. Disclaimer",
      sec3_desc: `The materials on OverDesk are provided "as is". ${LEGAL_CONFIG.companyName} makes no warranties, expressed or implied.`,
      sec4: "4. Governing Law",
      sec4_desc:
        "Any claim relating to OverDesk shall be governed by the laws of Vietnam without regard to its conflict of law provisions.",
    },
    privacy: {
      localFirstTitle: "Local-First Policy",
      localFirstDesc:
        "We prioritize your privacy. OverDesk operates primarily offline.",
      q1: "What data do we collect?",
      a1: "We do not collect personal data on our servers. All your dashboard configurations, notes, and preferences are stored locally on your device.",
      q2: "Third-party services",
      a2: "Some modules (News, Weather) make API requests. Your IP address might be visible to providers, but we do not transmit personal identity.",
      q3: "Data Security",
      a3: "Since data is stored on your device, security relies on your device's protection measures.",
    },
    footer: {
      rights: "All rights reserved.",
      contact: "Contact Legal Team",
    },
  },
  vi: {
    header: {
      title: "Trung tâm Pháp lý",
      verified: `Xác thực bởi ${LEGAL_CONFIG.companyName}`,
      lastUpdated: "Cập nhật",
    },
    tabs: {
      license: "Bản quyền",
      terms: "Điều khoản",
      privacy: "Bảo mật",
    },
    license: {
      title: "Giấy phép Mã nguồn mở",
      desc: "OverDesk là phần mềm miễn phí và mã nguồn mở được cấp phép theo Giấy phép MIT. Bạn được tự do sử dụng, sửa đổi và phân phối phần mềm này theo các điều kiện bên dưới.",
    },
    terms: {
      sec1: "1. Chấp nhận Điều khoản",
      sec1_desc: `Bằng việc truy cập và sử dụng OverDesk (v${version}), bạn đồng ý tuân thủ các điều khoản và quy định của thỏa thuận này.`,
      sec2: "2. Giấy phép Sử dụng",
      sec2_li1:
        "Cho phép tải xuống tạm thời một bản sao của tài liệu để xem cá nhân, phi thương mại.",
      sec2_li2:
        "Đây là việc cấp giấy phép, không phải chuyển nhượng quyền sở hữu.",
      sec3: "3. Tuyên bố miễn trừ trách nhiệm",
      sec3_desc: `Tài liệu trên OverDesk được cung cấp "nguyên trạng". ${LEGAL_CONFIG.companyName} không đưa ra bất kỳ bảo đảm nào, dù rõ ràng hay ngụ ý.`,
      sec4: "4. Luật điều chỉnh",
      sec4_desc:
        "Mọi khiếu nại liên quan đến OverDesk sẽ được điều chỉnh bởi luật pháp Việt Nam.",
    },
    privacy: {
      localFirstTitle: "Chính sách Local-First",
      localFirstDesc:
        "Chúng tôi ưu tiên quyền riêng tư. OverDesk hoạt động chủ yếu ngoại tuyến (offline).",
      q1: "Chúng tôi thu thập dữ liệu gì?",
      a1: "Chúng tôi KHÔNG thu thập dữ liệu cá nhân trên máy chủ. Mọi cấu hình, ghi chú và tùy chọn được lưu trữ cục bộ trên thiết bị của bạn.",
      q2: "Dịch vụ bên thứ ba",
      a2: "Một số module (Tin tức, Thời tiết) có gửi yêu cầu API. Địa chỉ IP của bạn có thể hiển thị với nhà cung cấp đó, nhưng chúng tôi không gửi danh tính cá nhân.",
      q3: "Bảo mật dữ liệu",
      a3: "Vì dữ liệu nằm trên thiết bị của bạn, sự an toàn phụ thuộc vào các biện pháp bảo mật của chính thiết bị đó.",
    },
    footer: {
      rights: "Đã đăng ký bản quyền.",
      contact: "Liên hệ Pháp chế",
    },
  },
});
