/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          dark: '#0a0a0a',     // Deep black
          gray: '#1a1a1a',     // Very dark gray for panels
          olive: '#2d3329',    // Dark olive green
          green: '#4b5e40',    // Military green
          light: '#a0a39f',    // Muted text
        },
        status: {
          green: '#00ff41',    // Bright tactical green (Nominal)
          amber: '#ffb300',    // Warning
          red: '#ff2a00',      // Threat
        }
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', '"Courier New"', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
