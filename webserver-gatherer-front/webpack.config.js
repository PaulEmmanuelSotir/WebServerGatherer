const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const path = require("path");

module.exports = {
  watch: true,
  watchOptions: {
    poll: true,
    aggregateTimeout: 600,
    ignored: /node_modules/
  },

  mode: "development",
  target: "electron-main",

  entry: "./src/main.js",

  output: {
    path: path.resolve(__dirname, "./dev_build"),
    filename: "bundle.js"
  },

  plugins: [
    new CompressionPlugin(),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      title: "WebServer Gatherer",
      template: path.resolve(__dirname, "./public/index.html"),
      favicon: path.resolve(__dirname, "./public/favicon.ico")
    }),
    new MonacoWebpackPlugin()
  ],

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader"
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]?[hash]"
        }
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {
          // eslint options (if necessary)
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]?[hash]",
              outputPath: "fonts/"
            }
          }
        ]
      }
    ]
  },

  resolve: {
    alias: {
      //vue: "vue/dist/vue.js",
      vue$: "vue/dist/vue.esm.js",
      // Relative path to your root dir (adjust accordingly)
      "@": path.resolve(__dirname, "./src")
    },
    extensions: ["*", ".js", ".vue", ".json"]
  }
};
