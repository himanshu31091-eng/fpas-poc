import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F3F6F8",
        panel: "#FFFFFF",
        ink: "#0C1B29",
        "ink-soft": "#3A4A59",
        "ink-faint": "#697784",
        line: "#E5EAEF",
        "line-strong": "#CBD5DF",
        // Brand accent — driven by CSS variables so the whole app can be
        // re-themed from Settings (see globals.css [data-theme]). Alpha-value
        // placeholder keeps opacity modifiers (e.g. text-primary/40) working.
        primary: "rgb(var(--c-primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--c-primary-soft) / <alpha-value>)",
        // FPAS brand marks (fixed, from the brand pack): yellow accent + navy.
        accent: "#FFC40C",
        "accent-soft": "#FFF3D0",
        fpasnavy: "#231F5C",
        // Gradient stops (navy → teal → aqua).
        navy: "#123C63",
        teal: "#166C86",
        aqua: "#2AA79A",
        // Warm accent (hay / stable gold).
        gold: "#C0872E",
        "gold-soft": "#F5E9CF",
        cyan: "#2AA79A",
        amber: "#A56A00",
        "amber-soft": "#F6E8CE",
        green: "#2E8B57",
        "green-soft": "#DCEFE2",
        red: "#C0392B",
        "red-soft": "#F7E4E1",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        brand:
          "linear-gradient(135deg,rgb(var(--c-grad1)) 0%,rgb(var(--c-grad2)) 52%,rgb(var(--c-grad3)) 100%)",
        "brand-soft":
          "linear-gradient(135deg,#E7EFF3 0%,#E4F1F0 50%,#EEF3E9 100%)",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15,34,51,0.04), 0 1px 1px rgba(15,34,51,0.03)",
        card: "0 1px 3px rgba(15,34,51,0.06), 0 6px 20px -8px rgba(15,34,51,0.10)",
        lift: "0 10px 30px -10px rgba(15,34,51,0.22)",
        glow: "0 10px 34px -8px rgb(var(--c-primary) / 0.45)",
      },
      borderRadius: {
        card: "14px",
        xl2: "20px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(192,57,43,0.35)" },
          "50%": { boxShadow: "0 0 0 6px rgba(192,57,43,0)" },
        },
        growWidth: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        bob: {
          "0%,100%": { transform: "translateY(0) rotate(-3deg)" },
          "50%": { transform: "translateY(-7px) rotate(3deg)" },
        },
        trot: {
          "0%,100%": { opacity: "0.25", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(-3px)" },
        },
      },
      animation: {
        "fade-up": "fadeUp .45s cubic-bezier(.2,.7,.3,1) both",
        "fade-in": "fadeIn .35s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "grow-width": "growWidth .6s cubic-bezier(.2,.7,.3,1) both",
        bob: "bob 1.1s ease-in-out infinite",
        trot: "trot 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
