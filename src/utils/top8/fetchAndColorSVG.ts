export const fetchAndColorSVG = async (svgUrl: string, color: string) => {
  const response = await fetch(svgUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG: ${response.statusText}`);
  }

  let svgText = await response.text();

  if (color) {
    svgText = svgText.replace(/fill=["'][^"']*["']/gi, `fill="${color}"`);

    svgText = svgText.replace(/fill:\s*[^;"}]+/gi, `fill: ${color}`);
  }

  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  return url;
};
