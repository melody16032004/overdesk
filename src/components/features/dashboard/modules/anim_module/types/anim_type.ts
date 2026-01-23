import * as PIXI from "pixi.js";

export type AnimGroupData = {
  id: string;
  name: string;
  imageBlobs: Blob[];
  sliceConfig?: { cols: number; rows: number };
};
export type AnimGroupRuntime = AnimGroupData & { frames: PIXI.Texture[] };
