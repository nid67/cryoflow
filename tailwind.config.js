/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-primary": "#ffffff",
        "error-container": "#ffdad6",
        "on-secondary": "#ffffff",
        "tertiary": "#404445",
        "on-surface": "#041b3c",
        "surface-dim": "#cadaff",
        "surface-tint": "#0c56d0",
        "surface-variant": "#d7e2ff",
        "on-error-container": "#93000a",
        "surface-container-highest": "#d7e2ff",
        "primary-container": "#0052cc",
        "primary-fixed-dim": "#b2c5ff",
        "tertiary-fixed-dim": "#c4c7c9",
        "tertiary-fixed": "#e0e3e5",
        "on-tertiary-fixed-variant": "#444749",
        "surface-container-low": "#f1f3ff",
        "surface-container": "#e8edff",
        "on-primary-fixed": "#001848",
        "on-background": "#041b3c",
        "surface-container-high": "#e0e8ff",
        "surface-bright": "#f9f9ff",
        "secondary-container": "#0866ff",
        "secondary-fixed-dim": "#b3c5ff",
        "on-error": "#ffffff",
        "on-tertiary": "#ffffff",
        "on-secondary-container": "#f9f7ff",
        "tertiary-container": "#585b5d",
        "background": "#f9f9ff",
        "on-secondary-fixed": "#00184a",
        "outline-variant": "#c3c6d6",
        "on-primary-fixed-variant": "#0040a2",
        "secondary-fixed": "#dbe1ff",
        "primary-fixed": "#dae2ff",
        "outline": "#737685",
        "on-primary-container": "#c4d2ff",
        "inverse-primary": "#b2c5ff",
        "on-tertiary-container": "#d1d3d5",
        "surface-container-lowest": "#ffffff",
        "surface": "#f9f9ff",
        "inverse-surface": "#1d3052",
        "on-secondary-fixed-variant": "#003fa5",
        "inverse-on-surface": "#edf0ff",
        "error": "#ba1a1a",
        "on-surface-variant": "#434654",
        "secondary": "#0050cd",
        "on-tertiary-fixed": "#191c1e",
        "primary": "#003d9b"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "xs": "4px",
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "gutter": "16px",
        "container-margin": "24px",
        "unit": "4px"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "headline-xl": ["Inter", "sans-serif"],
        "code": ["Inter", "monospace"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "code": ["13px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }]
      }
    }
  }
}
