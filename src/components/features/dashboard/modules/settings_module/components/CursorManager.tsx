import { useEffect, useState, useRef } from "react";
import { useAppStore } from "../../../../../../stores/useAppStore";

export const CursorManager = () => {
  const { customCursor } = useAppStore();
  const cursorRef = useRef<HTMLImageElement>(null);
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  // 1. Static CSS Injection (Normal & Pointer)
  useEffect(() => {
    // Nếu Animation đang bật, không inject CSS cho body (để tránh xung đột)
    if (customCursor.enableAnimation && customCursor.animated) return;

    const styleId = "global-cursor-style";
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const normalUrl = customCursor.normal;
    const pointerUrl = customCursor.pointer;

    let css = "";

    if (normalUrl) {
      // Normal cursor đã được resize trong SettingsModule (Base64)
      css += `body, html { cursor: url('${normalUrl}') 0 0, auto !important; }`;
    }

    if (pointerUrl) {
      // Pointer cursor đã được resize trong SettingsModule (Base64)
      css += `a, button, [role="button"], .pointer, select, input, label { cursor: url('${pointerUrl}') 0 0, pointer !important; }`;
    }

    styleTag.innerHTML = css;

    return () => {
      if (!customCursor.enableAnimation) styleTag.innerHTML = "";
    };
  }, [
    customCursor.normal,
    customCursor.pointer,
    customCursor.enableAnimation,
    customCursor.animated,
  ]);

  // 2. Animated Cursor (Fake DOM Element)
  useEffect(() => {
    if (!customCursor.enableAnimation || !customCursor.animated) {
      document.body.style.cursor = "auto";
      return;
    }

    document.body.style.cursor = "none"; // Ẩn chuột thật

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Logic kiểm tra hover
      const target = e.target as HTMLElement;
      // Sửa selector để bao quát hơn (ví dụ SVG icon bên trong button)
      const isClickable = target.closest(
        "a, button, input, select, [role='button'], .pointer, [onClick]",
      );
      setIsHoveringClickable(!!isClickable);
    };

    window.addEventListener("mousemove", moveCursor);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.body.style.cursor = "auto";
    };
  }, [customCursor.enableAnimation, customCursor.animated]);

  // Render
  if (!customCursor.enableAnimation || !customCursor.animated) return null;

  return (
    <>
      <style>{`
        body, html { cursor: none !important; }
        /* Khi hover vào nút, ẩn Animated Cursor, hiện lại Pointer tĩnh */
        a, button, input, select, .pointer, [role='button'] { cursor: pointer !important; } 
        ${
          customCursor.pointer
            ? `
          a, button, input, select, .pointer, [role='button'] { 
            cursor: url('${customCursor.pointer}') 0 0, pointer !important; 
          }
        `
            : ""
        }
      `}</style>

      <img
        ref={cursorRef}
        src={customCursor.animated}
        alt="cursor"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          // [QUAN TRỌNG] Resize Animated Cursor bằng CSS tại đây
          width: `${customCursor.size}px`,
          height: "auto", // Giữ tỷ lệ
          pointerEvents: "none",
          zIndex: 99999,
          opacity: isHoveringClickable ? 0 : 1, // Ẩn khi hover button
          transition: "opacity 0.15s ease",
          willChange: "transform",
        }}
      />
    </>
  );
};
