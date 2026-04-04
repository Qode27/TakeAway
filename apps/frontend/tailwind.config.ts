import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0B1220",
        panel: "#111B2E",
        panelAlt: "#17233B",
        line: "#223250",
        ink: "#E7EDF7",
        muted: "#90A1BC",
        accent: "#F97316",
        accentSoft: "#FDBA74",
        kitchen: "#08101C"
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(249, 115, 22, 0.18), 0 18px 60px rgba(15, 23, 42, 0.42)",
        panel: "0 18px 48px rgba(2, 8, 23, 0.32)"
      }
    }
  },
  plugins: []
} satisfies Config;
