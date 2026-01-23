export type TransformMode = "translate" | "rotate" | "scale";
export type ShapeType =
  | "box"
  | "sphere"
  | "torus"
  | "cone"
  | "knot"
  | "gem"
  | "csg";
export type AnimType = "none" | "spin" | "float" | "pulse" | "wobble";
export type CsgOperation = "base" | "add" | "sub" | "int";

export interface SceneObject {
  id: string;
  name?: string;
  type: ShapeType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  animation: AnimType;
  animSpeed: number;
  csgChildren?: SceneObject[];
  csgOp?: CsgOperation;
  triggerUrl?: string;
  triggerLabel?: string;
  mass: number;
  bounciness: number;
  visible: boolean;
  locked: boolean;
}

export interface SceneConfig {
  bgColor: string;
  gridVisible: boolean;
  ambientIntensity: number;
  enableFog: boolean;
  fogDensity: number;
  snapEnabled: boolean;
  snapStep: number;
}

export interface ObjectStats {
  position: [number, number, number];
  velocity: [number, number, number];
}
