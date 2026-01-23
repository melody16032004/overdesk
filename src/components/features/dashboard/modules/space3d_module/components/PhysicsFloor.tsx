import { usePlane } from "@react-three/cannon";

export const PhysicsFloor = () => {
  usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: "Static",
    material: { friction: 0.1, restitution: 0.5 },
  }));
  return null;
};
