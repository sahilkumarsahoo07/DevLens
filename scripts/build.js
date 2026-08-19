import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

const __dirname = resolve();
const distDir = resolve(__dirname, 'dist');

async function runBuild() {
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  console.log('📋 Step 1: Copying Manifest & Icons...');
  fs.copyFileSync(resolve(__dirname, 'public/manifest.json'), resolve(distDir, 'manifest.json'));
  fs.cpSync(resolve(__dirname, 'public/icons'), resolve(distDir, 'icons'), { recursive: true });

  console.log('🖥️ Step 2: Building Extension UI & Background Worker...');
  await build({
    configFile: false,
    base: './',
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          options: resolve(__dirname, 'src/options/index.html'),
          background: resolve(__dirname, 'src/background/service-worker.ts')
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') return 'background.js';
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  });

  console.log('⚙️ Step 3: Building Self-Contained Content Script (IIFE - Zero Imports)...');
  await build({
    configFile: false,
    base: './',
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/content/index.ts'),
        name: 'DevLensContentScript',
        fileName: () => 'content.js',
        formats: ['iife']
      }
    }
  });

  console.log('⚙️ Step 4: Building MAIN World Network Interceptor (IIFE)...');
  await build({
    configFile: false,
    base: './',
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, 'src/content/mainWorldInterceptor.ts'),
        name: 'DevLensMainWorldInterceptor',
        fileName: () => 'mainWorldInterceptor.js',
        formats: ['iife']
      }
    }
  });

  console.log('🎉 SUCCESS! Extension built cleanly. All content scripts built successfully.');
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
