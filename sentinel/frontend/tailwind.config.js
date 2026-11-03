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
          dark: '#0b0f19',     // Refined dark slate canvas
          gray: '#111827',     // Slate-900 surface for cards/panels
          olive: '#1e293b',    // Slate-800 clean divider/border
          green: '#2563eb',    // Professional cobalt accent
          light: '#94a3b8',    // Clean slate-400 secondary text
        },
        status: {
          green: '#10b981',    // Clean emerald (calm, non-neon)
          amber: '#f59e0b',    // Balanced amber
          red: '#ef4444',      // Crisp crimson
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
