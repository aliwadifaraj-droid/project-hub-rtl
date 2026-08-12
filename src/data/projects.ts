const projectPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700' viewBox='0 0 1200 700'%3E%3Crect width='1200' height='700' fill='%23e7e5e4'/%3E%3Cpath d='M0 560 260 390l170 110 220-220 210 170 130-90 210 200v140H0z' fill='%23a8a29e'/%3E%3Ccircle cx='890' cy='170' r='70' fill='%23d6d3d1'/%3E%3C/svg%3E";

export const projectImageMap: Record<string, string> = {
  tower: projectPlaceholder,
  mall: projectPlaceholder,
  bridge: projectPlaceholder,
  hospital: projectPlaceholder,
  villa: projectPlaceholder,
  school: projectPlaceholder,
};

export function resolveImage(key: string): string {
  return projectImageMap[key] ?? projectPlaceholder;
}
