const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                // options...
              }
            }
          ]
      },
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
  target:"web",
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/styles.css'
    }),
  ]
};