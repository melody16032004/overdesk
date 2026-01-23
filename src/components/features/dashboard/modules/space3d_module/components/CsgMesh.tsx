import {
  Addition,
  Base,
  Geometry,
  Intersection,
  Subtraction,
} from "@react-three/csg";
import { SceneObject } from "../types/space3d_type";
import { GeometryShape } from "./GeometryShape";

export const CsgMesh = ({ data }: { data: SceneObject }) => {
  if (!data.csgChildren || data.csgChildren.length === 0) return null;
  return (
    <Geometry>
      {data.csgChildren.map((child, index) => {
        const Component =
          index === 0
            ? Base
            : child.csgOp === "sub"
              ? Subtraction
              : child.csgOp === "int"
                ? Intersection
                : Addition;
        return (
          <Component
            key={child.id}
            position={child.position}
            rotation={child.rotation as any}
            scale={child.scale}
          >
            <GeometryShape type={child.type} />
          </Component>
        );
      })}
    </Geometry>
  );
};
