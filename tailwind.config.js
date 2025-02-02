/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plasma: {
          100: "#D1FDFF",
          500: "#01ECF7",
          700: "#081D1E",
        },
        star: {
          100: "#FEFEEF",
          500: "#F9FF57",
          700: "#30310D",
        },
        nebula: {
          100: "#F5E4FE",
          500: "#A104F8",
          700: "#190A21",
        },
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        lato: ["Lato", "sans-serif"],
      },
      textShadow: {
        none: "0px 0px 0px var(--tw-shadow-color), 0px 0px 0px var(--tw-shadow-color), 0px 0px 0px var(--tw-shadow-color)",
        sm: "0px 0px 6px var(--tw-shadow-color)",
        DEFAULT:
          "0px 2px 3px var(--tw-shadow-color), 0px 6px 13px var(--tw-shadow-color), 0px 6px 23px var(--tw-shadow-color)",
        lg: " 0px 15px 5px var(--tw-shadow-color), 10px 20px 5px var(--tw-shadow-color), -10px 20px 5px var(--tw-shadow-color)",
      },
      sideGlow: {
        DEFAULT:
          "0px 0px 80px 10px var(--tw-shadow-color), 0px 0px 6px 1px var(--tw-shadow-color)",
      },
      shine: {
        DEFAULT:
          "inset 10px -7px 14px 2px #00000022,inset 10px -7px 12px 2px #00000044,inset -10px 7px 5px -10px var(--tw-shadow-color)",
        flipped:
          "inset -10px -7px 14px 2px #00000022,inset -10px -7px 12px 2px #00000044,inset 8px 5px 5px -10px var(--tw-shadow-color)",
      },
      keyframes: {
        "fade-in": {
          "0%": { transform: "translateY(30px)", opacity: 0 },
          "100%": { transform: "", opacity: 1 },
        },
      },
      animation: {
        "fade-in": "fade-in 800ms ease-in both",
      },
      animationDelay: {
        none: "0s",
        75: "75ms",
        100: "100ms",
        200: "200ms",
        500: "500ms",
        1000: "1000ms",
        2000: "2000ms",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "side-glow": (value) => ({
            boxShadow: value,
          }),
        },
        { values: theme("sideGlow") }
      );
    }),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          shine: (value) => ({
            boxShadow: value,
          }),
        },
        { values: theme("shine") }
      );
    }),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "animation-delay": (value) => {
            return {
              animationDelay: value,
            };
          },
        },
        { values: theme("animationDelay") }
      );
    }),
  ],
  safelist: [
    ...Array(15)
      .fill(0)
      .map((_, i) => "animation-delay-[" + i * 125 + "ms]"),
  ],
};
