import { defineConfig } from 'vite';
import { resolve } from 'path';
import { globSync } from 'fast-glob';

const htmlFiles = globSync('src/**/*.html').reduce((acc, file) => {
  const name = file.replace(/src\/|\.html/g, '').replace(/\//g, '_');
  acc[name] = resolve(__dirname, file);
  return acc;
}, {});

export default defineConfig({
  root: 'src',
  build: {
    rollupOptions: {
      input: htmlFiles,
      output: {
        dir: resolve(__dirname, 'dist'),
      },
    },
  },
  publicDir: 'public',
});
