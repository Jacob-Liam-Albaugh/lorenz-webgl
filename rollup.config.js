import postcss from 'rollup-plugin-postcss';

export default {
  input: 'lorenz.css',
  output: {
    file: 'dist/styles.css'
  },
  plugins: [
    postcss({
      extract: true,
      minimize: true
    })
  ]
}; 