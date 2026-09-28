import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * The original reference artwork lives in /public/assets/references so the
 * asset pipeline (scripts/) can read it, but the site only ever loads the
 * optimised versions. Vite copies all of /public into the build, so drop the
 * multi-megabyte originals from the output: they are never deployed.
 */
function excludeReferenceArt(): Plugin {
  let outDir = '';
  return {
    name: 'ga:exclude-reference-art',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      fs.rmSync(path.join(outDir, 'assets/references'), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), excludeReferenceArt()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    sourcemap: false,
    // Cinematic media is served from /public and loaded on demand via the media
    // manifest (src/config/media.ts); only tiny files are inlined.
    assetsInlineLimit: 2048,
    rolldownOptions: {
      output: {
        // Libraries (React, GSAP, Lenis) change rarely: their own chunk stays
        // cached across content deploys. The black-hole renderer and the
        // soundscape are split on their own via dynamic imports.
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules/ }],
        },
      },
    },
  },
});
