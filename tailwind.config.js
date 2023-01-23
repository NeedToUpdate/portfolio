/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
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
        DEFAULT: "0px 2px 3px var(--tw-shadow-color), 0px 6px 13px var(--tw-shadow-color), 0px 6px 23px var(--tw-shadow-color)",
        lg: " 0px 15px 5px var(--tw-shadow-color), 10px 20px 5px var(--tw-shadow-color), -10px 20px 5px var(--tw-shadow-color)",
      },
      sideGlow: {
        DEFAULT: "0px 0px 80px 10px var(--tw-shadow-color), 0px 0px 6px 1px var(--tw-shadow-color)",
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
  ],
};
