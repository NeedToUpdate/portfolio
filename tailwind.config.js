/** @type {import('tailwindcss').Config} */
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
    },
  },
  plugins: [],
};
