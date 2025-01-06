import { default as CleanCss } from "clean-css";
const cssCleaner = new CleanCss({});

export const cleanCss = (css?: string): string => cssCleaner.minify(css).styles;
