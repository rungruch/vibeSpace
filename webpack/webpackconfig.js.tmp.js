const path = require('path');
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const mode = 'development'
const title = 'Geography Location'

module.exports = {
    mode: mode,
    entry: "./src/index.js",
    output: {
        path: path.join(__dirname, 'public'),
        filename: 'bundle.js'
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
            titleName: title,
            headScripts: [
                'http://localhost:8080/Common/libs/jsPlugin_3/playctrl/jsPlugin-3.0.0.min.js',
            ]
        }),
        new webpack.DefinePlugin({
            'process.env': {
                'BASE_NAME': JSON.stringify(''),
                'DEV_MODE': JSON.stringify(mode)
            }
        })
    ],
    devServer: {
        static: [{
            directory: path.join(__dirname, 'public')
        }, {
            directory: './assets/js/Common/libs/jsPlugin_3/',
            publicPath: '/Common/libs/jsPlugin_3/'
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
        }
    },
}