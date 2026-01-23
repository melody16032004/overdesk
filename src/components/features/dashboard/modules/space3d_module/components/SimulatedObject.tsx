import { ObjectStats, SceneObject } from "../types/space3d_type";
import { SimulatedBox } from "./SimulatedBox";
import { SimulatedSphere } from "./SimulatedSphere";

export const SimulatedObject = ({
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
  if (data.type === "sphere")
    return (
      <SimulatedSphere
        data={data}
        isSelected={isSelected}
        onTrigger={onTrigger}
        onStatsUpdate={onStatsUpdate}
      />
    );
  return (
    <SimulatedBox
      data={data}
      isSelected={isSelected}
      onTrigger={onTrigger}
      onStatsUpdate={onStatsUpdate}
    />
  );
};
