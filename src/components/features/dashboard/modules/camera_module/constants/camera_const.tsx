export const CLOUD_NAME = "dspycnr0t";
export const UPLOAD_PRESET = "overdesk";

export const FILTERS = [
  { id: "none", label: "Normal", css: "none" },
  { id: "bw", label: "B&W", css: "grayscale(100%) contrast(120%)" },
  {
    id: "warm",
    label: "Vintage",
    css: "sepia(40%) contrast(110%) brightness(110%)",
  },
  {
    id: "cool",
    label: "Cyber",
    css: "hue-rotate(180deg) saturate(150%) contrast(120%)",
  },
  {
    id: "soft",
    label: "Soft",
    css: "brightness(110%) contrast(90%) saturate(110%) blur(0.5px)",
  },
  {
    id: "dark",
    label: "Noir",
    css: "grayscale(100%) brightness(80%) contrast(150%)",
  },
];
