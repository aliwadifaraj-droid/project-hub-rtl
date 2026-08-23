const tower = "/assets/project-tower-CY4UtbFp.jpg";
const mall = "/assets/project-mall-C2poXo39.jpg";
const bridge = "/assets/project-bridge-CEy5d9F2.jpg";
const hospital = "/assets/project-hospital-C03d0OVK.jpg";
const villa = "/assets/project-villa-1KGCCkeh.jpg";
const school = "/assets/project-school-ByfoLf-l.jpg";
const projectImageMap = {
  tower,
  mall,
  bridge,
  hospital,
  villa,
  school
};
function resolveImage(key) {
  return projectImageMap[key] ?? tower;
}
function buildR2Url(coverImage) {
  if (!coverImage) return null;
  if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) return coverImage;
  if (coverImage.startsWith("data:")) return coverImage;
  let key = coverImage;
  const legacyMatch = key.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (legacyMatch) key = legacyMatch[1];
  key = key.replace(/^\/+/, "").replace(/^turso\//, "");
  if (!key.includes("/")) return null;
  const bucket = "turso";
  const encoded = key.split("/").map(encodeURIComponent).join("/");
  return `https://${bucket}.r2.dev/${encoded}`;
}
export {
  buildR2Url as b,
  resolveImage as r
};
