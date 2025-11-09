export const fetchAndColorSVG = async (svgUrl: string, color: string) => {
  const response = await fetch(svgUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${response.statusText}`);
  }

  const svgText = await response.text();
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
  const svgElement = svgDoc.querySelector("svg");

  if (!svgElement) {
    throw new Error("SVG not found");
  }

  svgElement.querySelectorAll(".color-1").forEach((el) => {
    el.setAttribute("fill", color);
  });

  const updatedSVG = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([updatedSVG], { type: "image/svg+xml" });
  const blobUrl = URL.createObjectURL(blob);

  return blobUrl;
};
