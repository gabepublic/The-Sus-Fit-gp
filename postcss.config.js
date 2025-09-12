module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-import': {},
    'postcss-preset-env': {
      stage: 1, // More modern features support
      features: {
        'custom-properties': false, // Let CSS vars work naturally
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
        'logical-properties-and-values': true,
        'container-queries': true, // Enable container queries
        'has-pseudo-class': true, // Enable :has() selector
        'focus-visible-pseudo-class': true,
        'color-functional-notation': true
      },
      // Enable modern CSS features for mobile browsers
      browsers: [
        'last 2 Chrome versions',
        'last 2 Firefox versions',
        'last 2 Safari versions',
        'last 2 iOS versions',
        'last 2 Android versions'
      ]
    },
    autoprefixer: {
      // Mobile-focused autoprefixer configuration
      overrideBrowserslist: [
        'last 2 Chrome versions',
        'last 2 Firefox versions', 
        'last 2 Safari versions',
        'last 2 iOS versions',
        'last 2 Android versions'
      ],
      grid: 'autoplace' // Enable CSS Grid autoprefixing
    },
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true
          },
          reduceIdents: false, // Keep keyframe names for debugging
          zindex: false, // Preserve z-index values
          cssDeclarationSorter: false, // Preserve logical property order
          normalizeWhitespace: true,
          // Preserve modern CSS features
          reduceTransforms: false,
          mergeLonghand: false // Keep logical properties separate
        }]
      }
    })
  }
}