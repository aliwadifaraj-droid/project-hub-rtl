import tower from "@/assets/project-tower.jpg";
import mall from "@/assets/project-mall.jpg";
import bridge from "@/assets/project-bridge.jpg";
import hospital from "@/assets/project-hospital.jpg";
import villa from "@/assets/project-villa.jpg";
import school from "@/assets/project-school.jpg";

export const projectImageMap: Record<string, string> = {
  tower,
  mall,
  bridge,
  hospital,
  villa,
  school,
};

export function resolveImage(key: string) {
  return projectImageMap[key] ?? tower;
}
