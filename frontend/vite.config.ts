import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, "index.html"),
                e200: path.resolve(__dirname, "200.html"),
            },
        },
        // outDir: "../dist",
        // emptyOutDir: true,
    },
    plugins: [
        react(),
        tailwindcss(),
        viteStaticCopy({
            targets: [{ src: path.resolve(__dirname, "./CNAME"), dest: path.resolve(__dirname, "./dist") }],
        }),
    ],
});
