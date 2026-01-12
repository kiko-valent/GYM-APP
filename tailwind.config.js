/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{js,jsx}',
		'./components/**/*.{js,jsx}',
		'./app/**/*.{js,jsx}',
		'./src/**/*.{js,jsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				// New Dark Modern Theme Colors
				'dark': {
					'bg': '#0B1116',
					'card': '#161C22',
					'card-lighter': '#1E262E',
					'border': '#2A323C',
				},
				'lime': {
					DEFAULT: '#D2FF00',
					'dark': '#B8E000',
					'glow': 'rgba(210, 255, 0, 0.3)',
				},
				'cyan': {
					DEFAULT: '#00C2FF',
					'dark': '#00A3D9',
					'glow': 'rgba(0, 194, 255, 0.3)',
				},
				// Legacy shadcn/ui colors (keeping for compatibility)
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				'lg': 'var(--radius)',
				'md': 'calc(var(--radius) - 2px)',
				'sm': 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.25rem',
				'4xl': '1.5rem',
			},
			fontSize: {
				'giant': ['6rem', { lineHeight: '1' }],
				'huge': ['4.5rem', { lineHeight: '1' }],
			},
			boxShadow: {
				'lime-glow': '0 0 30px rgba(210, 255, 0, 0.4)',
				'cyan-glow': '0 0 30px rgba(0, 194, 255, 0.4)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(210, 255, 0, 0.3)' },
					'50%': { boxShadow: '0 0 40px rgba(210, 255, 0, 0.6)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};