const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const buildFileDest = path.resolve(__dirname, '../app/public');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const copyTemplateFileDest = path.resolve(__dirname, '../app/view');

module.exports = (env) => {
  return {
    mode: 'production',
    context: path.resolve(__dirname, '../webpack'),
    entry: './index.js',
    output: {
      path: buildFileDest,
      filename: 'bundle.[fullhash:8].js',
      publicPath: env.production?'http://my-lego-backend.oss-cn-chengdu.aliyuncs.com/h5-assets/':'/public/',
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: '[name].[fullhash:8].css',
      }),
      new HtmlWebpackPlugin({
        filename: 'page.nj',
        template: path.resolve(__dirname, './template.html'),
      }),
      new FileManagerPlugin({
        events: {
          onEnd: {
            copy: [
              {
                source: path.join(buildFileDest, 'page.nj'),
                destination: path.join(copyTemplateFileDest, 'page.nj'),
              },
            ],
          },
        },
      }),
    ],
  };
};
