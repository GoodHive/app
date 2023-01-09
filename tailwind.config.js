/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      montserrat: ['Montserrat', 'sans-serif']
    },
    screens: {
      'sm': '320px',
      // => @media (min-width: 320px) { ... }

      'md': '480px',
      // => @media (min-width: 4800px) { ... }

      'lg': '600px',
      // => @media (min-width: 600px) { ... }
      
      'xl': '768px',
      // => @media (min-width: 768px) { ... }

      '2xl': '900px',
      // => @media (min-width: 900px) { ... }

      '3xl': '1024px',
      // => @media (min-width: 1024px) { ... }

      '4xl': '1200px',
      // => @media (min-width: 1200px) { ... }
      
      '5xl': '1440px',
      // => @media (min-width: 1440px) { ... }
    },
    extend: {
      screens: {
        '3xl': '1024px',
        // => @media (min-width: 1024px) { ... }
  
        '4xl': '1200px',
        // => @media (min-width: 1200px) { ... }
        
        '5xl': '1440px',
        // => @media (min-width: 1440px) { ... }
      },
    },
  },
  plugins: [],
}
