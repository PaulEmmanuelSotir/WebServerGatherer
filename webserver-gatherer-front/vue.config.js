const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  devServer: {
    disableHostCheck: true,
    headers: { "Access-Control-Allow-Origin": "*" },
    https: false,
    watchContentBase: true,
    watchOptions: {
      poll: true,
      aggregateTimeout: 600,
      ignored: /node_modules/
    },
    hot: true // enable HMR
  },

  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  },

  configureWebpack: {
    devtool: "source-map",
    plugins: [new MonacoWebpackPlugin()],
    module: {
      rules: [
        // {
        //   test: /\.css$/i,
        //   use: ["style-loader", "css-loader"]
        // },
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
    }
  },

  transpileDependencies: ["vuetify"]
};
