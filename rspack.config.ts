import { defineConfig } from '@rspack/cli';
import { rspack } from '@rspack/core';
import { resolve } from "path";
import * as RefreshPlugin from '@rspack/plugin-react-refresh';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
    context: __dirname,
    entry: {
        content: './src/content/index.tsx',
        popup: './src/popup/index.tsx',
        inject: './src/inject/index.ts',
    },
    resolve: {
        extensions: ['...', '.ts', '.tsx', '.jsx'],
        alias: {
            share: resolve(__dirname, './src/share'),
        },
    },
    module: {
        rules: [
            {
                test: /\.svg$/,
                type: 'asset',
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: {
                                    tailwindcss: {},
                                    autoprefixer: {},
                                },
                            },
                        },
                    },
                ],
                type: 'css',
            },
            {
                test: /\.(jsx?|tsx?)$/,
                use: [
                    {
                        loader: 'builtin:swc-loader',
                        options: {
                            jsc: {
                                parser: {
                                    syntax: 'typescript',
                                    tsx: true,
                                },
                                transform: {
                                    react: {
                                        runtime: 'automatic',
                                        development: isDev,
                                        refresh: isDev,
                                    },
                                },
                            },
                            env: {
                                targets: [
                                    'chrome >= 87',
                                    'edge >= 88',
                                    'firefox >= 78',
                                    'safari >= 14',
                                ],
                            },
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new rspack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
        new rspack.CopyRspackPlugin({
            patterns: [
                {
                    from: 'public',
                },
            ],
        }),
        new rspack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
        new rspack.ProgressPlugin({}),
        isDev ? new RefreshPlugin() : null,
    ].filter(Boolean),
    experiments: {
        css: true,
    },
    output: {
        clean: true,
    },
    devtool: false,
    performance: {
        maxAssetSize: 1 * 1024 * 1000,
        maxEntrypointSize: 1 * 1024 * 1000,
    },
});
