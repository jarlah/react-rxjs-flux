import typescript from 'rollup-plugin-typescript'
import jsx from 'rollup-plugin-jsx'
const pkg = require('./package.json')

export default {
  input: 'src/react-rxjs.ts',
  output: [
    {
      name: 'umd',
      file: pkg.main,
      format: 'umd'
    },
    {
      name: 'es',
      file: pkg.module,
      format: 'es'
    }
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    typescript({
      typescript: require('typescript'),
    }),
    jsx( {factory: 'React.createElement'} )
  ]
}
