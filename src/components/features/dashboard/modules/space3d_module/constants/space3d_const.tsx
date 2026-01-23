import { Circle, Cuboid } from "lucide-react";
import { SceneConfig, SceneObject, AnimType } from "../types/space3d_type";

export const STORAGE_KEY_DATA = "overdesk_3d_objects_v1";
export const STORAGE_KEY_CONFIG = "overdesk_3d_config_v1";

export const DEFAULT_CONFIG: SceneConfig = {
  bgColor: "#09090b",
  gridVisible: true,
  ambientIntensity: 0.6,
  enableFog: false,
  fogDensity: 0.03,
  snapEnabled: false,
  snapStep: 0.5,
};

export const DEFAULT_OBJECTS: SceneObject[] = [
  {
    id: "1",
    name: "Blue Cube",
    type: "box",
    position: [0, 5, 0],
    rotation: [0.5, 0.5, 0],
    scale: [1, 1, 1],
    color: "#6366f1",
    animation: "none",
    animSpeed: 1,
    mass: 1,
    bounciness: 0.5,
    visible: true,
    locked: false,
  },
  {
    id: "2",
    name: "Pink Ball",
    type: "sphere",
    position: [0.5, 8, 0.5],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: "#ec4899",
    animation: "none",
    animSpeed: 1,
    mass: 2,
    bounciness: 0.8,
    visible: true,
    locked: false,
  },
  {
    id: "floor",
    name: "Ground",
    type: "box",
    position: [0, -0.5, 0],
    rotation: [0, 0, 0],
    scale: [20, 1, 20],
    color: "#333333",
    animation: "none",
    animSpeed: 0,
    mass: 0,
    bounciness: 0.1,
    visible: true,
    locked: true,
  },
];

export const TEMPLATES = [
  {
    label: "Planet",
    type: "sphere",
    scale: [2, 2, 2],
    color: "#3b82f6",
    mass: 5,
    bounciness: 0.5,
    animation: "spin" as AnimType,
    speed: 0.5,
    icon: <Circle size={16} />,
  },
  {
    label: "Crate",
    type: "box",
    scale: [1, 1, 1],
    color: "#eab308",
    mass: 1,
    bounciness: 0.2,
    animation: "none" as AnimType,
    speed: 0,
    icon: <Cuboid size={16} />,
  },
  {
    label: "Bouncy Ball",
    type: "sphere",
    scale: [1, 1, 1],
    color: "#ec4899",
    mass: 1,
    bounciness: 0.9,
    animation: "none" as AnimType,
    speed: 0,
    icon: <Circle size={16} />,
  },
];
