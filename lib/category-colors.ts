export const categoryColors = [
  { name: "Ciano", value: "#00CACA" },
  { name: "Verde", value: "#3DDC97" },
  { name: "Azul", value: "#5B8DEF" },
  { name: "Violeta", value: "#7C5CFF" },
  { name: "Rosa", value: "#E85D75" },
  { name: "Coral", value: "#F27D52" },
  { name: "Âmbar", value: "#F0A202" },
  { name: "Lilás", value: "#C084FC" },
] as const;

export type CategoryColor = (typeof categoryColors)[number]["value"];
