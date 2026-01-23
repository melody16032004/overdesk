import { useRef } from "react";
import { useAppStore } from "../stores/useAppStore";
import { getCurrentWindow } from "@tauri-apps/api/window";

// 1. Thêm hàm kiểm tra môi trường (hoặc import từ utils nếu bạn đã tách ra)
const isTauri = () => {
  return (
    typeof window !== "undefined" &&
    (window as any).__TAURI_INTERNALS__ !== undefined
  );
};

export const BubbleLayout = () => {
  const { setViewMode } = useAppStore();
  // const appWindow = getCurrentWindow();
  const appWindow = isTauri() ? getCurrentWindow() : null;

  // Dùng useRef để lưu vị trí chuột mà không gây render lại
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  // 1. Khi ấn chuột xuống: Lưu vị trí
  const handlePointerDown = (e: React.PointerEvent) => {
    // Chỉ xử lý chuột trái
    if (e.button !== 0) return;

    isDragging.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };

    // Bắt buộc setPointerCapture để theo dõi chuột khi di chuyển nhanh ra ngoài div
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  // 2. Khi di chuyển chuột: Kiểm tra xem đã "kéo" chưa
  const handlePointerMove = async (e: React.PointerEvent) => {
    if (!dragStart.current) return; // Nếu chưa ấn chuột thì bỏ qua
    if (!appWindow) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Nếu di chuyển quá 10px -> Coi là đang KÉO
    if (distance > 10 && !isDragging.current) {
      isDragging.current = true;
      try {
        // Gọi lệnh kéo của Tauri
        await appWindow.startDragging();
        // Lưu ý: Sau khi startDragging chạy, sự kiện pointerUp có thể không kích hoạt nữa
        // do OS chiếm quyền, nên ta reset luôn ở đây cho chắc
        dragStart.current = null;
      } catch (err) {
        console.error("Drag error:", err);
      }
    }
  };

  // 3. Khi thả chuột: Nếu chưa kéo thì là CLICK
  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture(e.pointerId);

    // Nếu chỉ ấn rồi thả (chưa di chuyển thành drag) -> Mở Panel
    if (dragStart.current && !isDragging.current) {
      setViewMode("panel");
    }

    // Reset trạng thái
    dragStart.current = null;
    isDragging.current = false;
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <div
        // Gán các sự kiện thủ công thay vì dùng data-tauri-drag-region
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-14 h-14 rounded-2xl bg-[#0B0F19] border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 group z-50 select-none"
      >
        {/* Icon OD */}
        <span className="text-sm font-bold text-indigo-400 group-hover:text-white pointer-events-none">
          OD
        </span>

        {/* Hiệu ứng pulse nhẹ để biết là nó đang sống */}
        <div className="absolute inset-0 rounded-2xl border border-indigo-500/20 animate-pulse pointer-events-none" />
      </div>
    </div>
  );
};
