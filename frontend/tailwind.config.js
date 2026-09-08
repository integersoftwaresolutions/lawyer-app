/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Base */
        background: "var(--color-background)",
        "background-text": "var(--color-text)",
        "background-border": "var(--color-border)",
        surface: "var(--color-surface)",
        "surface-hover": "var(--color-surface-hover)",
        "surface-border": "var(--color-surface-border)",
        "surface-text": "var(--color-surface-text)",
        
        /* Card */
        card: "var(--color-card)",
        "card-hover": "var(--color-card-hover)",
        "card-border": "var(--color-card-border)",
        "card-shadow": "var(--color-card-shadow)",
        "card-text": "var(--color-card-text)",
        
        /* Text */
        text: "var(--color-text)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        
        /* Border */
        border: "var(--color-border)",
        
        /* Input */
        input: "var(--color-input)",
        "input-background": "var(--color-input-background)",
        "input-border": "var(--color-input-border)",
        "input-text": "var(--color-input-text)",
        "input-placeholder": "var(--color-input-placeholder)",
        
        /* Palettes — brand colors defined in src/theme.css
           primary: seagreen (#085456), secondary: brown (#463428), accent: golden (#ED9D06) */
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-border": "var(--color-primary-border)",
        "primary-shadow": "var(--color-primary-shadow)",
        "primary-text": "var(--color-primary-text)",
        "primary-light": "var(--color-primary-light)",
        "primary-light-hover": "var(--color-primary-light-hover)",

        secondary: "var(--color-secondary)",
        "secondary-hover": "var(--color-secondary-hover)",
        "secondary-border": "var(--color-secondary-border)",
        "secondary-shadow": "var(--color-secondary-shadow)",
        "secondary-text": "var(--color-secondary-text)",
        "secondary-light": "var(--color-secondary-light)",
        "secondary-light-hover": "var(--color-secondary-light-hover)",

        accent: "var(--color-accent)",
        "accent-hover": "var(--color-accent-hover)",
        "accent-border": "var(--color-accent-border)",
        "accent-shadow": "var(--color-accent-shadow)",
        "accent-text": "var(--color-accent-text)",
        "accent-light": "var(--color-accent-light)",
        "accent-light-hover": "var(--color-accent-light-hover)",

        success: "var(--color-success)",
        "success-hover": "var(--color-success-hover)",
        "success-border": "var(--color-success-border)",
        "success-shadow": "var(--color-success-shadow)",
        "success-text": "var(--color-success-text)",
        "success-light": "var(--color-success-light)",
        "success-light-hover": "var(--color-success-light-hover)",

        warning: "var(--color-warning)",
        "warning-hover": "var(--color-warning-hover)",
        "warning-border": "var(--color-warning-border)",
        "warning-shadow": "var(--color-warning-shadow)",
        "warning-text": "var(--color-warning-text)",
        "warning-light": "var(--color-warning-light)",
        "warning-light-hover": "var(--color-warning-light-hover)",

        danger: "var(--color-danger)",
        "danger-hover": "var(--color-danger-hover)",
        "danger-border": "var(--color-danger-border)",
        "danger-shadow": "var(--color-danger-shadow)",
        "danger-text": "var(--color-danger-text)",
        "danger-light": "var(--color-danger-light)",
        "danger-light-hover": "var(--color-danger-light-hover)",

        info: "var(--color-info)",
        "info-hover": "var(--color-info-hover)",
        "info-border": "var(--color-info-border)",
        "info-shadow": "var(--color-info-shadow)",
        "info-text": "var(--color-info-text)",
        "info-light": "var(--color-info-light)",
        "info-light-hover": "var(--color-info-light-hover)",

        link: "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
        "link-border": "var(--color-link-border)",
        "link-shadow": "var(--color-link-shadow)",
        "link-text": "var(--color-link-text)",
        "link-light": "var(--color-link-light)",
        "link-light-hover": "var(--color-link-light-hover)",
      },
      fontFamily: {
        sora: ['"Sora"', "sans-serif"],
      },
      keyframes: {
        "modal-scale-in": {
          "0%": { opacity: "0", transform: "scale(0.2)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "modal-scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.2)" },
        },
        "modal-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "modal-fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "modal-scale-in": "modal-scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "modal-scale-out": "modal-scale-out 0.2s cubic-bezier(0.4, 0, 1, 1) forwards",
        "modal-fade-in": "modal-fade-in 0.3s ease-out forwards",
        "modal-fade-out": "modal-fade-out 0.2s ease-in forwards",
      },
    },
  },
  plugins: [],
};
