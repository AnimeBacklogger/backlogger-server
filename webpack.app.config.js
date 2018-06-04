'use strict';

const path = require('path');
/*/ // FIXME: download the plugin
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
//*/

module.exports = {
    entry: {
        app: './src/app/demoApp.js'
    },
    devtool: 'source-map',
    output: {
        filename: 'app.bundle.js',
        path: path.resolve(__dirname, './dist')
    },
    resolve: {
        extensions: ['.js', '.json', '.jsx', '*']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            'babel-preset-env',
                            'babel-preset-react'
                        ]
                    }
                }
            },
            {
                test: /\.scss$/,
                exclude: /(node_modules)/,
                use: [
                    /*/ // FIXME: download the plugin
                    MiniCssExtractPlugin.loader,
                    /*/
                    'style-loader',
                    //*/                    
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[path][name]__[local]--[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    /*/ // FIXME: download the plugin
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        })
    ],
    //*/
};
