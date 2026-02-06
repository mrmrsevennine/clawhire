import { loadFont as loadDMSerifDisplay } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";

const { fontFamily: headingFont } = loadDMSerifDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const { fontFamily: bodyFont } = loadDMSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const THEME = {
  bg: "#FFFDF8",
  bgDark: "#FFF8ED",
  text: "#2D2A26",
  textLight: "#6B6560",
  teal: "#14B8A6",
  tealDark: "#0D9488",
  tealLight: "#5EEAD4",
  earth: "#A3876B",
  earthLight: "#D4B896",
  accent: "#F59E0B",
  headingFont,
  bodyFont,
} as const;
