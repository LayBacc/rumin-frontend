// this file is no longer used
// var path = require('path');

// module.exports = {
//   entry: './src/index.tsx',
//   module: {
//     rules: [      
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/,
//       },
//       {
//         test: /\.css$/,
//         use: [
//           // 'style-loader',
//           'css-loader'
//         ]
//       },
//       {
//         test: /\.js$/,
//         exclude: /node_modules/,
//         // use: {
//         //   loader: "babel-loader"
//         // }
//         loader: 'babel-loader',
//         options: {
//           presets: ['@babel/preset-env',
//                     '@babel/react',{
//                     'plugins': ['@babel/plugin-proposal-class-properties']}]
//         }
//       }
//     ],
//   },
//   resolve: {
//     extensions: [ '.tsx', '.ts', '.js' ],
//   },
//   output: {
//     filename: 'main2.js',
//     path: path.resolve(__dirname, 'static/frontend'),
//   },
//   watch: true,
//     watchOptions: {
//     poll: true,
//     ignored: /node_modules/
//   }
// };
