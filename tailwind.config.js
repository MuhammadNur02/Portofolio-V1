/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			// "Sumi & Shu" — ink black, washi paper, torii vermilion and a touch of gold.
			colors: {
				ink: {
					DEFAULT: "#0a0807",
					950: "#060504",
					900: "#0d0a09",
					800: "#15110f",
					700: "#1e1916",
					600: "#2a231f",
				},
				washi: {
					DEFAULT: "#f4efe7",
					muted: "#b5ada3",
					subtle: "#8a8279",
				},
				shu: {
					200: "#ffc2b3",
					300: "#ff9a82",
					400: "#ff6d52",
					500: "#e8472f",
					// 600+ carry white text (buttons, active pills): 4.7:1 contrast, WCAG AA for small text
					600: "#d63a22",
					700: "#b02d18",
				},
				kin: {
					300: "#f0d494",
					400: "#e0b964",
					500: "#c99a3e",
				},
			},
			fontFamily: {
				sans: ['"Zen Kaku Gothic New"', "ui-sans-serif", "system-ui", "sans-serif"],
				display: ['"Archivo Variable"', '"Zen Kaku Gothic New"', "ui-sans-serif", "sans-serif"],
				kanji: ['"Shippori Mincho"', "serif"],
			},
			maxWidth: {
				site: "80rem",
			},
			keyframes: {
				"fog-drift": {
					"0%": { transform: "translate3d(-8%, 0, 0)" },
					"100%": { transform: "translate3d(8%, 0, 0)" },
				},
				"scroll-cue": {
					"0%": { transform: "scaleY(0)", transformOrigin: "top" },
					"45%": { transform: "scaleY(1)", transformOrigin: "top" },
					"55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
					"100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
				},
			},
			animation: {
				"fog-drift": "fog-drift 18s ease-in-out infinite alternate",
				"scroll-cue": "scroll-cue 2.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
			},
		},
	},
	plugins: [],
};
