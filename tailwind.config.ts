import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0B0E14",
          raised: "#111520",
          overlay: "#161B28",
          glass: "rgba(17, 21, 32, 0.7)",
        },
        accent: {
          DEFAULT: "#7C3AED",
          light: "#A78BFA",
          dark: "#6D28D9",
          muted: "#5B21B6",
          glow: "rgba(124, 58, 237, 0.4)",
        },
        border: {
          DEFAULT: "#1E2433",
          subtle: "#151A26",
          glow: "rgba(124, 58, 237, 0.25)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(124, 58, 237, 0.15), 0 0 40px rgba(124, 58, 237, 0.05)",
        "glow-lg": "0 0 30px rgba(124, 58, 237, 0.25), 0 0 60px rgba(124, 58, 237, 0.1)",
        "glow-active": "0 0 12px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(124, 58, 237, 0.08)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-gradient":
          "radial-gradient(at 40% 20%, rgba(124, 58, 237, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(99, 102, 241, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(124, 58, 237, 0.04) 0px, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
