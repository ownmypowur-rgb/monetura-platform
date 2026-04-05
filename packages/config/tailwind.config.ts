import type { Config } from "tailwindcss";

const moneturaConfig: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        "monetura-charcoal": "#2C2420",
        "monetura-champagne": "#D4A853",
        "monetura-cream": "#FBF5ED",
        "monetura-mocha": "#4A3728",
        "monetura-terracotta": "#C17A4A",
        "monetura-earth": "#8B6E52",
        "monetura-sand": "#E8DCCB",
        "monetura-sunset": "#C4973D",
      },
      fontFamily: {
        garet: ["Garet", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default moneturaConfig;
