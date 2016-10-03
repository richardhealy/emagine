module.exports = {
  target:'web',
  entry: [
    './app/bootstrap.js'
  ],
  output: {
      publicPath: '/',
      filename: './dist/app.js'
  },
  debug: true,
  devtool: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query:
        {
          "presets": ["es2015"]
        }
      },
      {
        loader: 'script',
        test: /(pixi|phaser).js/
      }
    ]
  },
  resolve: {
    extensions: ['', '.js']
  },
};