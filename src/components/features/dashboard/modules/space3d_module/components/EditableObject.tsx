import { useRef } from "react";
import { SceneConfig, SceneObject, TransformMode } from "../types/space3d_type";
import { useFrame } from "@react-three/fiber";
import { CsgMesh } from "./CsgMesh";
import { GeometryShape } from "./GeometryShape";
import { TransformControls } from "@react-three/drei";
import * as THREE from "three";

export const EditableObject = ({
  data,
  isSelected,
  mode,
  config,
  onSelect,
  onUpdate,
}: {
  data: SceneObject;
  isSelected: boolean;
  mode: TransformMode;
  config: SceneConfig;
  onSelect: (e: any) => void;
  onUpdate: (id: string, props: Partial<SceneObject>) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!meshRef.current || isSelected) return;
    const time = state.clock.getElapsedTime();
    const speed = data.animSpeed || 1;
    if (data.animation === "float")
      meshRef.current.position.y =
        data.position[1] + Math.sin(time * speed * 2) * 0.3;
    if (data.animation === "spin") {
      meshRef.current.rotation.y += 0.01 * speed;
      meshRef.current.rotation.x += 0.005 * speed;
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={data.position}
        rotation={data.rotation as any}
        scale={data.scale}
        onClick={onSelect}
        castShadow
        receiveShadow
      >
        {data.type === "csg" ? (
          <CsgMesh data={data} />
        ) : (
          <GeometryShape type={data.type} />
        )}
        <meshStandardMaterial
          color={isSelected ? "#facc15" : data.color}
          roughness={0.2}
          metalness={0.5}
          emissive={
            isSelected
              ? "#443300"
              : data.type === "knot"
                ? data.color
                : "#000000"
          }
          emissiveIntensity={data.type === "knot" ? 0.2 : 0}
          opacity={data.locked ? 0.8 : 1}
          transparent={data.locked}
        />
      </mesh>

      {isSelected && !data.locked && (
        <TransformControls
          object={meshRef}
          mode={mode}
          translationSnap={config.snapEnabled ? config.snapStep : null}
          rotationSnap={config.snapEnabled ? Math.PI / 4 : null}
          scaleSnap={config.snapEnabled ? 0.1 : null}
          onObjectChange={() => {
            if (meshRef.current) {
              const { position, rotation, scale } = meshRef.current;
              onUpdate(data.id, {
                position: [position.x, position.y, position.z],
                rotation: [rotation.x, rotation.y, rotation.z],
                scale: [scale.x, scale.y, scale.z],
              });
            }
          }}
        />
      )}
    </>
  );
};
