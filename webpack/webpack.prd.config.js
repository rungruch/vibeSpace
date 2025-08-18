const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
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
                "css-loader",
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
        ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false, reportFilename: 'report-prod.html' })] : [])
    ]
}
