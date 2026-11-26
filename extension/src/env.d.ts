// Stylesheets imported `with { type: "text" }` arrive as their text.
declare module "*.css" {
  const text: string;
  export default text;
}
