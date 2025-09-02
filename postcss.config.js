module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-import': {},
    'postcss-preset-env': {
      stage: 3,
      features: {
        'custom-properties': false, // Let CSS vars work naturally
        'nesting-rules': true
      }
    },
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true
          },
          reduceIdents: false, // Keep keyframe names for debugging
          zindex: false // Preserve z-index values
        }]
      }
    })
  }
}