/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      container: {
        center: true,
        padding: "1rem",
        screens: {
          sm: "640px",
          md: "862px",
          lg: "1080px",
          xl: "1400px",
        },
      },
      screens: {
        sm: { min: "140px", max: "639px" },

        md: { min: "640px", max: "862px" },

        lg: { min: "863px", max: "1079px" },

        xl: { min: "1081px", max: "1280px" },
      },
    },
  },
  plugins: [],
};
