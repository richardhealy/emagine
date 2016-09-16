module.exports = {
  entry: [
    'babel-polyfill',
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
          presets:['es2015']
        }
      }
    ]
  },
  resolve: {
    extensions: ['', '.js', '.es6'],
  },
};