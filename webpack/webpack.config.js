const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const mode = 'development'
const title = 'Nano OK E-Learning'

module.exports = {
    mode: mode,
    entry: { main: "./src/index.js" },
    output: {
        path: path.join(__dirname, '../dist'),
        filename: '[name].js', // use entry chunk name
        chunkFilename: '[name].chunk.js', // ensure splitChunks get unique filenames
        publicPath: '/',
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            // encourage splitting very large vendor modules into smaller chunks during dev too
            maxSize: 256000,
            cacheGroups: {
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    priority: 70,
                    enforce: true,
                },
                charts: {
                    test: /[\\/]node_modules[\\/]@mui[\\/]x-charts[\\/]/,
                    name: 'charts',
                    priority: 60,
                    enforce: true,
                },
                pdfjs: {
                    test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
                    name: 'pdfjs',
                    priority: 59,
                },
                framer: {
                    test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
                    name: 'framer',
                    priority: 58,
                },
                survey: {
                    test: /[\\/]node_modules[\\/](survey-core|survey-react-ui)[\\/]/,
                    name: 'survey',
                    priority: 55,
                },
                mui: {
                    test: /[\\/]node_modules[\\/]@mui[\\/](?!x-charts)/,
                    name: 'mui',
                    priority: 54,
                    enforce: true,
                },
                antd: {
                    test: /[\\/]node_modules[\\/](antd|@ant-design|rc-.*)[\\/]/,
                    name: 'antd',
                    priority: 53,
                    enforce: true,
                },
                editor: {
                    test: /[\\/]node_modules[\\/]@editorjs[\\/]/,
                    name: 'editor',
                    priority: 52,
                },
                xlsxlib: {
                    test: /[\\/]node_modules[\\/](xlsx)[\\/]/,
                    name: 'xlsx-lib',
                    priority: 51,
                },
                docviewer: {
                    test: /[\\/]node_modules[\\/]@cyntler[\\/]react-doc-viewer[\\/]/,
                    name: 'doc-viewer-lib',
                    priority: 50,
                },
                // isolate large rc-* helper packages if present
                'rc-picker': {
                    test: /[\\/]node_modules[\\/]rc-picker[\\/]/,
                    name: 'rc-picker',
                    priority: 49,
                    enforce: true,
                },
                'rc-field-form': {
                    test: /[\\/]node_modules[\\/]rc-field-form[\\/]/,
                    name: 'rc-field-form',
                    priority: 48,
                    enforce: true,
                },
                'rc-table': {
                    test: /[\\/]node_modules[\\/]rc-table[\\/]/,
                    name: 'rc-table',
                    priority: 47,
                    enforce: true,
                },
                'rc-select': {
                    test: /[\\/]node_modules[\\/]rc-select[\\/]/,
                    name: 'rc-select',
                    priority: 46,
                    enforce: true,
                },
                'rc-virtual-list': {
                    test: /[\\/]node_modules[\\/]rc-virtual-list[\\/]/,
                    name: 'rc-virtual-list',
                    priority: 45,
                    enforce: true,
                },
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 10,
                    reuseExistingChunk: true,
                },
                common: {
                    name: 'common',
                    minChunks: 2,
                    priority: 0,
                    reuseExistingChunk: true,
                }
            }
        }
    },
    devtool: "inline-source-map",
    module: {
        rules: [{
            test: /\.?(js|jsx|ts|tsx)$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']
                }
            }
        }, {
            test: /\.css$/i,
            use: ["style-loader", "css-loader", "postcss-loader"],
        }, {
            test: /\.s[ac]ss$/i,
            use: [
                // Creates `style` nodes from JS strings
                "style-loader",
                // Translates CSS into CommonJS
                {
                    loader: "css-loader",
                    options: {
                        modules: {
                            auto: true, // Enable modules for files with .module. in the name
                            localIdentName: '[name]__[local]___[hash:base64:5]'
                        }
                    }
                },
                // Process Tailwind CSS
                "postcss-loader",
                // Compiles Sass to CSS
                "sass-loader",
            ],
        }, {
            test: /\.(png|jp(e*)g|svg|gif|ico)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[path][hash:10].[ext]',
                    emitFile: true,
                    esModule: false
                }
            }]
        }, {
            test: /\.m?js/,
            resolve: {
                fullySpecified: false
            }
        }]
    },
    plugins: [
        new CleanWebpackPlugin(),
            new ForkTsCheckerWebpackPlugin({
                async: true,
                typescript: {
                    diagnosticOptions: {
                        semantic: true,
                        syntactic: true
                    }
                }
            }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser'
        }),
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            publicPath: '/',
            titleName: title
        }),
    new BundleAnalyzerPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'BASE_NAME': JSON.stringify(''),
                'DEV_MODE': JSON.stringify(mode)
            }
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
                    to: 'pdf.worker.min.js',
                },
            ],
        })
    ],
    devServer: {
        static: [{
            directory: path.join(__dirname, '../dist')
        }],
        compress: true,
        port: process.env.DEV_PORT,
        historyApiFallback: true,
        allowedHosts: 'all',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'credentialless'
        },
        proxy: [
            {
                context: ['/elearning'],
                target: "http://localhost:4080",
                changeOrigin: true,
            }
        ]
    }
}