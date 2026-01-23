import { ShapeType } from "../types/space3d_type";

export const GeometryShape = ({ type }: { type: ShapeType }) => {
  switch (type) {
    case "box":
      return <boxGeometry args={[1, 1, 1]} />;
    case "sphere":
      return <sphereGeometry args={[0.7, 32, 32]} />;
    case "torus":
      return <torusGeometry args={[0.6, 0.2, 16, 32]} />;
    case "cone":
      return <coneGeometry args={[0.7, 1.5, 32]} />;
    case "knot":
      return <torusKnotGeometry args={[0.5, 0.15, 64, 8]} />;
    case "gem":
      return <icosahedronGeometry args={[0.7, 0]} />;
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
};
