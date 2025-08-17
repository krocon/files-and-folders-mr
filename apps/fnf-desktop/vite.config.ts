import {defineConfig} from 'vite';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

export default defineConfig(({command}) => {
  const isDev = command === 'serve';

  return {
    appType: 'custom',
    build: {
      outDir: 'dist-electron',
      emptyOutDir: true,
      sourcemap: isDev ? 'inline' : false,
      minify: isDev ? false : 'esbuild',
    },
    plugins: [
      electron({
        main: {
          entry: 'electron-main/main.ts',
          onstart({startup}) {
            startup();
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                output: {
                  entryFileNames: 'main.js',
                  chunkFileNames: 'chunks/[name]-[hash].js',
                  assetFileNames: 'assets/[name]-[hash][extname]'
                }
              }
            }
          }
        },
        preload: {
          input: {
            preload: path.join(__dirname, 'electron-preload/preload.ts')
          },
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                output: {
                  entryFileNames: '[name].js'
                }
              }
            }
          }
        }
      })
    ]
  };
});
