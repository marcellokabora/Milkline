import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// DEPLOY_TARGET=pages builds a static single-page app for GitHub Pages, served under /<repo>/.
const pages = process.env.DEPLOY_TARGET === 'pages';
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	define: { __MOCK_IN_BROWSER__: JSON.stringify(pages) },
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: pages ? adapterStatic({ fallback: 'index.html' }) : adapterNode(),
			paths: { base },
			inspector: true,
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
