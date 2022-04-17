module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
  target:"web"
};