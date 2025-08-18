const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
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
            cacheGroups: {
                react: {
                    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                    name: 'react',
                    priority: 50,
                    enforce: true,
                },
                survey: {
                    test: /[\\/]node_modules[\\/](survey-core|survey-react-ui)[\\/]/,
                    name: 'survey',
                    priority: 45,
                    enforce: true,
                },
                mui: {
                    test: /[\\/]node_modules[\\/]@mui[\\/](?!x-charts)/,
                    name: 'mui',
                    priority: 42,
                    enforce: true,
                },
                antd: {
                    test: /[\\/]node_modules[\\/]antd[\\/]/,
                    name: 'antd',
                    priority: 41,
                    enforce: true,
                },
                charts: {
                    test: /[\\/]node_modules[\\/]@mui[\\/]x-charts[\\/]/,
                    name: 'charts',
                    priority: 40,
                    enforce: true,
                },
                editor: {
                    test: /[\\/]node_modules[\\/]@editorjs[\\/]/,
                    name: 'editor',
                    priority: 38,
                    enforce: true,
                },
                xlsxlib: {
                    test: /[\\/]node_modules[\\/](xlsx)[\\/]/,
                    name: 'xlsx-lib',
                    priority: 37,
                    enforce: true,
                },
                docviewer: {
                    test: /[\\/]node_modules[\\/]@cyntler[\\/]react-doc-viewer[\\/]/,
                    name: 'doc-viewer-lib',
                    priority: 36,
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
                "css-loader",
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