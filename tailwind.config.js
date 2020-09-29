module.exports = {
  purge: ['./src/**/*.vue'],
  theme: {
    extend: {
      flex: {
        '1-0-auto': '1 0 auto',
      },
      borderWidth: {
        '3': '3px',
      },
      margin: {
        '0-auto': '0 auto',
      },
      width: {
        max: 'max-content',
        min: 'min-content',
        fit: 'fit-content',
      },
    },
  },
  corePlugins: {
    float: false,
  },
  variants: { borderStyle: ['responsive', 'hover', 'focus'] },
  future: {
    removeDeprecatedGapUtilities: true,
  },
  experimental: {
    applyComplexClasses: true,
  },
}
