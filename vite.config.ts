import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        tailwindcss(),
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
