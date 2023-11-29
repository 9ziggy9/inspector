const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "production",
    entry: "./src/main.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "./native")
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                options: {
                    configFile: path.resolve(__dirname, "./tsconfig.json"),
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            "fs": false,
            "path": require.resolve("path-browserify")
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: false,
            template: "./electron.html",
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "style.css", to: "style.css"},
            ]
        })
    ]
};
