// The site's colour theme: the `data-theme` attribute every stylesheet keys
// off, and the browser chrome (a phone's status and address bars), which
// otherwise keeps index.html's dark colour over a light page.

export type Theme = "dark" | "light";

const CHROME_COLOR: Record<Theme, string> = {
  dark: "#0e0e10",
  light: "#f4f4f5",
};

export const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute("data-theme", theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", CHROME_COLOR[theme]);
};
