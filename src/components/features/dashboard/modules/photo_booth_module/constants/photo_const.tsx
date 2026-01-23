export const DB_NAME = "OverdeskCameraDB";
export const STORE_NAME = "gallery";

export const AR_MASKS = [
  {
    id: "cat_ears",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/1067/1067357.png",
    label: "Cat Ears",
  },
  {
    id: "dog_nose",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/6667/6667509.png",
    label: "Doggy",
  },
  {
    id: "glasses",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/616/616574.png",
    label: "Thug Life",
  },
  {
    id: "blush",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/9463/9463956.png",
    label: "UwU Blush",
  },
  {
    id: "crown",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/168/168233.png",
    label: "Queen",
  },
  {
    id: "mask",
    type: "image",
    src: "https://cdn-icons-png.flaticon.com/512/2061/2061803.png",
    label: "Mask",
  },
];

export const EMOJI_LIST = [
  "😎",
  "🥰",
  "👽",
  "👻",
  "🔥",
  "✨",
  "🌈",
  "🦋",
  "🍄",
  "🍕",
  "🍑",
  "💦",
];

export const FILTERS = [
  { id: "normal", label: "Normal", css: "none", color: "bg-zinc-500" },
  {
    id: "cream",
    label: "Cream",
    css: "contrast(90%) brightness(110%) saturate(80%) sepia(20%)",
    color: "bg-orange-200",
  },
  {
    id: "dramatic",
    label: "Drama",
    css: "contrast(120%) saturate(120%)",
    color: "bg-indigo-900",
  },
  {
    id: "noir",
    label: "Noir",
    css: "grayscale(100%) contrast(110%)",
    color: "bg-black",
  },
  {
    id: "vivid",
    label: "Vivid",
    css: "saturate(160%) contrast(105%)",
    color: "bg-rose-500",
  },
  {
    id: "cyber",
    label: "Cyber",
    css: "hue-rotate(190deg) saturate(150%)",
    color: "bg-cyan-500",
  },
];
