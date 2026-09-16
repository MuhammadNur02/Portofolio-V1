/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			backdropBlur: {
				sm: '4px',
			},
			fontFamily: {
				sans: ['Poppins', 'system-ui', 'sans-serif'],
				display: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
			},
			colors: {
				brand: {
					bg: '#030014',
					cyan: '#00d2ff',
					blue: '#3b82f6',
					surface: 'rgba(255,255,255,0.05)',
					border: 'rgba(255,255,255,0.1)',
				},
			},
			boxShadow: {
				'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
				'glow-cyan-lg': '0 0 40px rgba(6, 182, 212, 0.25)',
			},
			keyframes: {
				'grid-scroll': {
					'0%': { backgroundPosition: '0 0' },
					'100%': { backgroundPosition: '0 64px' },
				},
				scanline: {
					'0%': { transform: 'translateY(-100%)' },
					'100%': { transform: 'translateY(100vh)' },
				},
				'glow-pulse': {
					'0%, 100%': { opacity: '0.4' },
					'50%': { opacity: '0.9' },
				},
			},
			animation: {
				'grid-scroll': 'grid-scroll 6s linear infinite',
				scanline: 'scanline 6s linear infinite',
				'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
			},
		},
	},
	plugins: [],
}
