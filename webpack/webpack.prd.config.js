const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const mode = 'production'
const basename = 'elearning2'
const title = 'Nano OK E-Learning'

module.exports = {
    mode: mode,
    entry: {
        index: "./src/index.js",
    },
    output: {
        // hashed entry for long-term caching; chunk names for splitChunks
        filename: './assets/js/[contenthash:10].js',
        chunkFilename: './assets/js/[name].chunk.js',
        path: path.join(__dirname, '../dist'),
        publicPath: `/${basename}/`,
        clean: true
    },
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
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        url: false
                    }
                },
                "postcss-loader"
            ]
        }, {
            test: /\.s[ac]ss$/i,
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: "css-loader",
                    options: {
                        modules: {
                            auto: true, // Enable modules for files with .module. in the name
                            localIdentName: '[name]__[local]___[hash:base64:5]'
                        }
                    }
                },
                "postcss-loader",
                "sass-loader",
            ],
        }, {
            test: /\.(png|jp(e*)g|svg|gif|ico)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[path][contenthash:10].[ext]',
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
    optimization: {
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin({
                extractComments: false
            })
        ],
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            // encourage splitting very large vendor modules into smaller chunks
            maxSize: 256000,
            cacheGroups: {
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    priority: 70,
                    enforce: true,
                },
                // charting lib used only on analytics pages
                charts: {
                    test: /[\\/]node_modules[\\/]@mui[\\/]x-charts[\\/]/,
                    name: 'charts',
                    priority: 60,
                    enforce: true,
                },
                // pdf engine - make it a separate chunk so viewers can lazy-load it
                pdfjs: {
                    test: /[\\/]node_modules[\\/]pdfjs-dist[\\/]/,
                    name: 'pdfjs',
                    priority: 59,
                },
                // framer-motion is large; isolate it
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
                // include rc-* helper packages and @ant-design helpers in the antd chunk
                antd: {
                    test: /[\\/]node_modules[\\/](antd|@ant-design|rc-.*)[\\/]/,
                    name: 'antd',
                    priority: 53,
                    enforce: true,
                },
                // isolate large rc-* helper packages that still ended up in vendors
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
    plugins: [
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
        }),
        new HtmlWebpackPlugin({
            template: "./src/index.html",
            publicPath: `/${basename}`,
            titleName: title,
            headScripts: [
                'http://tc001mfds1p/scripts/expired/session-expired.js',
            ]
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'BASE_NAME': `"${basename}"`,
                'DEV_MODE': JSON.stringify(mode)
            }
        }),
        new MiniCssExtractPlugin({
            filename: './assets/css/[contenthash:10].css'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
                    to: 'pdf.worker.min.js',
                },
            ],
        }),
        ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false, reportFilename: 'report-prod.html' })] : [])
    ]
}
