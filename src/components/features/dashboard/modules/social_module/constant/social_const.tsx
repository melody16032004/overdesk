import {
  Search,
  Mail,
  Film,
  Music,
  Gamepad2,
  LayoutGrid,
  Twitch,
  Figma,
  Slack,
} from "lucide-react";

export const PRESETS = [
  {
    label: "Google",
    url: "https://google.com",
    icon: Search,
    idPrefix: "google",
  },
  {
    label: "Gmail",
    url: "https://mail.google.com",
    icon: Mail,
    idPrefix: "gmail",
  },
  {
    label: "Netflix",
    url: "https://netflix.com",
    icon: Film,
    idPrefix: "netflix",
  },
  {
    label: "Spotify",
    url: "https://open.spotify.com",
    icon: Music,
    idPrefix: "spotify",
  },
  {
    label: "TikTok",
    url: "https://www.tiktok.com",
    icon: Music,
    idPrefix: "tiktok",
  },
  {
    label: "Discord",
    url: "https://discord.com/app",
    icon: Gamepad2,
    idPrefix: "discord",
  },
  {
    label: "Reddit",
    url: "https://reddit.com",
    icon: LayoutGrid,
    idPrefix: "reddit",
  },
  {
    label: "Twitch",
    url: "https://twitch.tv",
    icon: Twitch,
    idPrefix: "twitch",
  },
  { label: "Figma", url: "https://figma.com", icon: Figma, idPrefix: "figma" },
  { label: "Slack", url: "https://slack.com", icon: Slack, idPrefix: "slack" },
];
