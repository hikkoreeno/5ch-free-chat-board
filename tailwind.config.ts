import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bbs-bg': '#efefef',
        'bbs-header': '#800000',
        'bbs-link': '#0000ff',
        'bbs-visited': '#660066',
        'bbs-thread-bg': '#f0e0d6',
        'bbs-thread-border': '#d9bfb7',
      },
      fontFamily: {
        'bbs': ['MS PGothic', 'MS Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
