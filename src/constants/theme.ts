export const colors = {
  primary: {
    DEFAULT: "#8B5E3C",
    name: "Coklat Kayu",
  },
  secondary: {
    DEFAULT: "#F7F3EE",
    name: "Krem",
  },
  accent: {
    DEFAULT: "#7A9E7E",
    name: "Hijau Sage",
  },
  background: {
    DEFAULT: "#FFFFFF",
    name: "Putih",
  },
  text: {
    primary: "#2E2E2E",
    secondary: "#6B7280",
  },
  whatsapp: {
    DEFAULT: "#25D366",
    name: "WhatsApp Green",
  },
} as const;

export const fonts = {
  heading: "Poppins",
  body: "Inter",
} as const;

export const theme = {
  colors,
  fonts,
} as const;

export default theme;
