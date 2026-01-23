import {
  ELEMENT_SIZES,
  RADIUS,
  SHADOWS,
  SIZES,
} from "../constants/ui_builder_const";
import { ComponentConfig } from "../types/ui_builder_type";

export const formatCode = (code: string) => {
  try {
    let formatted = "";
    let indentLevel = 0;
    const indentString = "  ";
    const cleanCode = code.replace(/>\s+</g, "><").trim();
    const tokens = cleanCode.split(/(<[^>]+>)/g).filter(Boolean);
    tokens.forEach((token) => {
      if (token.match(/^<\//)) {
        indentLevel = Math.max(0, indentLevel - 1);
        formatted += "\n" + indentString.repeat(indentLevel) + token;
      } else if (
        token.match(/^<.*>$/) &&
        !token.match(/\/>$/) &&
        !token.match(/^<!/)
      ) {
        formatted += "\n" + indentString.repeat(indentLevel) + token;
        indentLevel++;
      } else if (token.match(/^<.*\/>$/)) {
        formatted += "\n" + indentString.repeat(indentLevel) + token;
      } else {
        const text = token.trim();
        if (text) formatted += "\n" + indentString.repeat(indentLevel) + text;
      }
    });
    return formatted.trim();
  } catch (e) {
    return code;
  }
};

export const generateClasses = (c: ComponentConfig) => {
  if (c.type === "custom") return c.customClasses ? c.customClasses.trim() : "";
  let classes = `transition-all duration-200 ${RADIUS[c.radius]} ${
    SHADOWS[c.shadow]
  } `;
  const isElement =
    c.type === "button" || c.type === "input" || c.type === "badge";
  classes += (isElement ? ELEMENT_SIZES[c.size] : SIZES[c.size]) + " ";
  if (c.type === "button" || c.type === "badge") {
    classes +=
      "inline-flex items-center justify-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ";
    classes += `focus:ring-${c.color}-500 dark:focus:ring-offset-zinc-900 `;
    if (c.fullWidth && c.type === "button") classes += "w-full ";
    if (c.variant === "solid")
      classes += `bg-${c.color}-600 hover:bg-${c.color}-700 text-white border border-transparent dark:bg-${c.color}-500 dark:hover:bg-${c.color}-600`;
    else if (c.variant === "outline")
      classes += `bg-transparent border border-${c.color}-600 text-${c.color}-600 hover:bg-${c.color}-50 dark:border-${c.color}-400 dark:text-${c.color}-400 dark:hover:bg-${c.color}-950`;
    else if (c.variant === "ghost")
      classes += `bg-transparent hover:bg-${c.color}-100 text-${c.color}-600 border border-transparent dark:text-${c.color}-400 dark:hover:bg-${c.color}-900/30`;
    else if (c.variant === "soft")
      classes += `bg-${c.color}-100 hover:bg-${c.color}-200 text-${c.color}-700 border border-transparent dark:bg-${c.color}-900/50 dark:text-${c.color}-300 dark:hover:bg-${c.color}-900/70`;
  } else if (c.type === "input") {
    classes += `w-full border border-slate-300 focus:border-${c.color}-500 focus:ring-1 focus:ring-${c.color}-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 dark:bg-zinc-900 dark:border-white/10 dark:text-white dark:placeholder:text-zinc-500`;
  } else if (c.type === "card") {
    classes += `bg-white border border-slate-200 dark:bg-zinc-900 dark:border-white/10 dark:text-slate-200 `;
  } else if (c.type === "alert") {
    classes += `border-l-4 bg-${c.color}-50 border-${c.color}-500 text-${c.color}-700 flex items-start gap-3 dark:bg-${c.color}-950/30 dark:text-${c.color}-300`;
  }
  if (c.customClasses) classes += ` ${c.customClasses}`;
  return classes.trim().replace(/\s+/g, " ");
};

export const generateReactCode = (c: ComponentConfig) => {
  const className = generateClasses(c);
  if (c.type === "custom")
    return `<div className="${className}">\n  {/* Paste code here */}\n</div>`;
  if (c.type === "button")
    return `<button className="${className}" {...props}>\n{icon && <span className="mr-1">{icon}</span>}\n${c.text}\n</button>`;
  if (c.type === "input")
    return `<input className="${className}" placeholder="${c.text}" {...props} />`;
  if (c.type === "badge")
    return `<span className="${className}">${c.text}</span>`;
  if (c.type === "alert")
    return `<div className="${className}">\n<strong>Thông báo:</strong> ${c.text}\n</div>`;
  if (c.type === "card")
    return `<div className="${className}">\n<h3>${c.text}</h3>\n<p>Content goes here...</p>\n</div>`;
  return `<div className="${className}">...</div>`;
};
