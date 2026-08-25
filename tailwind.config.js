const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        dately: {
          primary: "#2D176B",
          // Deep purple
          secondary: "#4B3594",
          // Secondary purple
          success: "#25B87A",
          // Green success
          background: "#F4F7FB",
          // Very light blue-gray
          card: "#FFFFFF",
          // White card
          navy: "#172B4D",
          // Dark navy (primary text)
          slate: "#64748B",
          // Slate gray (secondary text)
          border: "#E2E8F0",
          // Subtle border
          danger: "#DC3E4D",
          // Red danger
          warning: "#E9A23B"
          // Amber warning
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))"
      }
    }
  },
  plugins: []
};
export default config;
