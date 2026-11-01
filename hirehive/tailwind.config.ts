import type { Config } from "tailwindcss";

// Our mood board colors live here, so every partner uses the same names.
// Example: className="bg-brand text-white" gives a teal background with white text.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#0B5C6B",   // dark teal (sidebar, main buttons)
        accent: "#F2A900",  // amber (highlight buttons, active menu item)
        surface: "#F6F8FA", // light grey page background
        ink: "#12212B",     // main text color
        muted: "#5B6B76",   // grey helper text
        line: "#DDE3E8",    // thin borders
        soft: "#E1EFF1",    // light teal background for small boxes
      },
    },
  },
  plugins: [],
};

export default config;
