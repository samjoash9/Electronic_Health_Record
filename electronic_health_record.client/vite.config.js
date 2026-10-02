import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';
import tailwindcss from '@tailwindcss/vite';

const certificateName = "electronic_health_record.client";

// The dev server needs an HTTPS certificate; a production build does not. This
// runs only when the dev server is actually being started, because generating
// one requires the .NET SDK -- a build agent or IIS deployment box that only
// runs `npm run build` has no `dotnet dev-certs` to call and would fail here.
function devServerHttps() {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;

    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, { recursive: true });
    }

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        if (0 !== child_process.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password',
        ], { stdio: 'inherit', }).status) {
            throw new Error("Could not create certificate.");
        }
    }

    return {
        key: fs.readFileSync(keyFilePath),
        cert: fs.readFileSync(certFilePath),
    };
}

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7165';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    // loadEnv, not process.env: Vite reads .env.<mode> into import.meta.env for
    // application code, but it does not put those values on process.env, so the
    // config file cannot see VITE_APP_BASE_URL without loading it explicitly.
    //
    // `base` must be set here rather than left to the app, because it is what
    // rewrites the asset URLs in the generated index.html. Under the IIS
    // application alias (/ehr) an unset base emits /assets/... which resolves
    // against the server root and 404s.
    const fileEnv = loadEnv(mode, process.cwd(), '');

    // Vite requires a trailing slash on a non-root base; a value of '/ehr'
    // would otherwise produce '/ehrassets/index.js'.
    const rawBase = fileEnv.VITE_APP_BASE_URL || '/';
    const basePath = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

    return {
        plugins: [
            plugin(),
            tailwindcss()
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            proxy: {
                '^/weatherforecast': {
                    target,
                    secure: false
                },
                '^/api': {
                    target,
                    secure: false
                }
            },
            port: parseInt(env.DEV_SERVER_PORT || '53807'),
            https: command === 'serve' ? devServerHttps() : undefined
        },
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: './src/test/setup.js',
        },

        base: basePath
    };
})