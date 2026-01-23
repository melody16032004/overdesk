import { useSphere } from "@react-three/cannon";
import { ObjectStats, SceneObject } from "../types/space3d_type";
import { GeometryShape } from "./GeometryShape";
import { useEffect } from "react";
import * as THREE from "three";

export const SimulatedSphere = ({
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
  const radius = 0.7 * data.scale[0];
  const [ref, api] = useSphere(() => ({
    mass: data.mass,
    position: data.position,
    rotation: data.rotation as any,
    args: [radius],
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
      <GeometryShape type={data.type} />
      <meshStandardMaterial
        color={data.color}
        roughness={0.2}
        metalness={0.5}
      />
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[new THREE.SphereGeometry(0.7, 16, 16)]} />
          <lineBasicMaterial color="#ffff00" />
        </lineSegments>
      )}
    </mesh>
  );
};
