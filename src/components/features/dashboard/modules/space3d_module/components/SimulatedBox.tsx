import { useEffect } from "react";
import { CsgMesh } from "./CsgMesh";
import { GeometryShape } from "./GeometryShape";
import { ObjectStats, SceneObject } from "../types/space3d_type";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";

export const SimulatedBox = ({
  data,
  isSelected,
  onTrigger,
  onStatsUpdate,
}: {
  data: SceneObject;
  isSelected: boolean;
  onTrigger: (url: string) => void;
  onStatsUpdate: (stats: ObjectStats) => void;
}) => {
  const [ref, api] = useBox(() => ({
    mass: data.mass,
    position: data.position,
    rotation: data.rotation as any,
    args: [data.scale[0], data.scale[1], data.scale[2]],
    material: { friction: 0.1, restitution: data.bounciness },
  }));

  useEffect(() => {
    if (!isSelected) return;
    let currentPos = [0, 0, 0];
    const pSub = api.position.subscribe((v) => {
      currentPos = v;
      onStatsUpdate({ position: v as any, velocity: [0, 0, 0] });
    });
    const vSub = api.velocity.subscribe((v) =>
      onStatsUpdate({ position: currentPos as any, velocity: v as any }),
    );
    return () => {
      pSub();
      vSub();
    };
  }, [isSelected, api]);

  return (
    <mesh
      ref={ref as any}
      scale={data.scale}
      onClick={(e) => {
        e.stopPropagation();
        if (data.triggerUrl) onTrigger(data.triggerUrl);
      }}
      castShadow
      receiveShadow
    >
      {data.type === "csg" ? (
        <CsgMesh data={data} />
      ) : (
        <GeometryShape type={data.type} />
      )}
      <meshStandardMaterial
        color={data.color}
        roughness={0.2}
        metalness={0.5}
        emissive={data.type === "knot" ? data.color : "#000000"}
        emissiveIntensity={data.type === "knot" ? 0.2 : 0}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color="#ffff00" />
        </lineSegments>
      )}
    </mesh>
  );
};
