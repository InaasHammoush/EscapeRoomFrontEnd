/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  // with v4 you can keep this, but plugin loading actually comes from @plugin in CSS
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        arcaneDark: {
          primary:  "#2b6f43",
          secondary:"#1e422b",
          accent:   "#4ade80",
          neutral:  "#0e1a12",
          "base-100":"#1a664c",
          "base-200":"#075c40",
          "base-300":"#10ad5f",
          info:     "#7dd3fc",
          success:  "#22c55e",
          warning:  "#eab308",
          error:    "#dc2626",
        },
      },
      "dark"
    ],
  },
};
