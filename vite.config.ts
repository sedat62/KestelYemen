import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        tailwindcss(),
        {
            name: 'table-rewrite',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const match = req.url?.match(/^\/masa\d+(\/.*)?$/);
                    if (match) {
                        const subPath = match[1];
                        if (!subPath || subPath === '/') {
                            req.url = '/index.html';
                        } else {
                            req.url = subPath;
                        }
                    }
                    next();
                });
            },
        },
    ],
    base: '/KestelYemen/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                yemekler: resolve(__dirname, 'yemekler.html'),
                icecekler: resolve(__dirname, 'icecekler.html'),
                nargile: resolve(__dirname, 'nargile.html'),
                admin: resolve(__dirname, 'admin.html'),
            },
        },
    },
})
