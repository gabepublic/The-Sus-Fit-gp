import {
  getMobileRoute,
  getMobileRouteString,
  hasMobileMapping,
  extractRouteParams,
  substituteRouteParams,
  matchesWildcardPattern,
  getRouteMappingsByType,
  addRouteMapping,
  removeRouteMapping,
  staticRouteMappings,
  parameterizedRouteMappings,
  wildcardRouteMappings
} from '../../../src/mobile/utils/routeMapping'

describe('Route Mapping System', () => {
  describe('Static Route Mappings', () => {
    it('should map root path to mobile home', () => {
      const result = getMobileRoute('/')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/m/home')
      expect(result?.mapping.description).toBe('Home page')
    })

    it('should map upload-angle to mobile upload-angle', () => {
      const result = getMobileRoute('/upload-angle')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/m/upload-angle')
    })

    it('should map all static routes correctly', () => {
      const staticMappings = [
        { from: '/', to: '/m/home' },
        { from: '/upload-angle', to: '/m/upload-angle' },
        { from: '/upload-fit', to: '/m/upload-fit' },
        { from: '/tryon', to: '/m/tryon' },
        { from: '/share', to: '/m/share' }
      ]

      staticMappings.forEach(({ from, to }) => {
        const result = getMobileRoute(from)
        expect(result?.route).toBe(to)
      })
    })

    it('should return null for unmapped static routes', () => {
      const result = getMobileRoute('/unknown-route')
      expect(result).toBeNull()
    })
  })

  describe('Parameterized Route Mappings', () => {
    it('should extract parameters correctly', () => {
      const params = extractRouteParams('/user/:id', '/user/123')
      expect(params).toEqual({ id: '123' })
    })

    it('should extract multiple parameters', () => {
      const params = extractRouteParams('/user/:userId/post/:postId', '/user/123/post/456')
      expect(params).toEqual({ userId: '123', postId: '456' })
    })

    it('should return null for non-matching parameterized routes', () => {
      const params = extractRouteParams('/user/:id', '/admin/123')
      expect(params).toBeNull()
    })

    it('should return null for wrong number of segments', () => {
      const params = extractRouteParams('/user/:id', '/user/123/extra')
      expect(params).toBeNull()
    })

    it('should substitute parameters correctly', () => {
      const result = substituteRouteParams('/m/user/:id', { id: '123' })
      expect(result).toBe('/m/user/123')
    })

    it('should substitute multiple parameters', () => {
      const result = substituteRouteParams('/m/user/:userId/post/:postId', { 
        userId: '123', 
        postId: '456' 
      })
      expect(result).toBe('/m/user/123/post/456')
    })

    it('should map parameterized routes correctly', () => {
      const result = getMobileRoute('/user/123')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/m/user/123')
      expect(result?.params).toEqual({ id: '123' })
    })

    it('should map tryon with ID correctly', () => {
      const result = getMobileRoute('/tryon/abc123')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/m/tryon/abc123')
      expect(result?.params).toEqual({ id: 'abc123' })
    })

    it('should map share with ID correctly', () => {
      const result = getMobileRoute('/share/def456')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/m/share/def456')
      expect(result?.params).toEqual({ id: 'def456' })
    })
  })

  describe('Wildcard Route Mappings', () => {
    it('should match simple wildcard patterns', () => {
      expect(matchesWildcardPattern('/admin/*', '/admin/users')).toBe(true)
      expect(matchesWildcardPattern('/admin/*', '/admin/dashboard')).toBe(true)
      expect(matchesWildcardPattern('/admin/*', '/admin/settings/profile')).toBe(true)
    })

    it('should not match non-wildcard patterns', () => {
      expect(matchesWildcardPattern('/admin/*', '/user/dashboard')).toBe(false)
      expect(matchesWildcardPattern('/api/*', '/web/endpoint')).toBe(false)
    })

    it('should match exact patterns without wildcards', () => {
      expect(matchesWildcardPattern('/exact', '/exact')).toBe(true)
      expect(matchesWildcardPattern('/exact', '/different')).toBe(false)
    })

    it('should handle admin routes (stay on main)', () => {
      const result = getMobileRoute('/admin/users')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/admin/users') // No mobile version
    })

    it('should handle API routes (stay as-is)', () => {
      const result = getMobileRoute('/api/v1/users')
      expect(result).not.toBeNull()
      expect(result?.route).toBe('/api/v1/users') // No redirection
    })
  })

  describe('Helper Functions', () => {
    it('getMobileRouteString should return route string only', () => {
      expect(getMobileRouteString('/')).toBe('/m/home')
      expect(getMobileRouteString('/upload-angle')).toBe('/m/upload-angle')
      expect(getMobileRouteString('/user/123')).toBe('/m/user/123')
      expect(getMobileRouteString('/unknown')).toBeNull()
    })

    it('hasMobileMapping should check mapping existence', () => {
      expect(hasMobileMapping('/')).toBe(true)
      expect(hasMobileMapping('/upload-angle')).toBe(true)
      expect(hasMobileMapping('/user/123')).toBe(true)
      expect(hasMobileMapping('/admin/users')).toBe(true)
      expect(hasMobileMapping('/unknown')).toBe(false)
    })

    it('getRouteMappingsByType should return correct mappings', () => {
      const staticMappings = getRouteMappingsByType('static')
      const paramMappings = getRouteMappingsByType('parameterized')
      const wildcardMappings = getRouteMappingsByType('wildcard')
      const allMappings = getRouteMappingsByType('all')

      expect(staticMappings).toEqual(staticRouteMappings)
      expect(paramMappings).toEqual(parameterizedRouteMappings)
      expect(wildcardMappings).toEqual(wildcardRouteMappings)
      expect(allMappings.length).toBe(
        staticMappings.length + paramMappings.length + wildcardMappings.length
      )
    })

    it('should return empty array for unknown type', () => {
      // @ts-expect-error Testing invalid input
      const result = getRouteMappingsByType('invalid')
      expect(result).toEqual([])
    })
  })

  describe('Dynamic Route Management', () => {
    beforeEach(() => {
      // Reset mappings to original state
      staticRouteMappings.length = 0
      staticRouteMappings.push(
        { from: '/', to: '/m/home', description: 'Home page' },
        { from: '/upload-angle', to: '/m/upload-angle', description: 'Upload angle/photo page' },
        { from: '/upload-fit', to: '/m/upload-fit', description: 'Upload garment/fit page' },
        { from: '/tryon', to: '/m/tryon', description: 'Virtual try-on results page' },
        { from: '/share', to: '/m/share', description: 'Share results page' }
      )
    })

    it('should add new static route mapping', () => {
      const newMapping = {
        from: '/new-feature',
        to: '/m/new-feature',
        description: 'New feature page'
      }

      addRouteMapping(newMapping, 'static')
      
      const result = getMobileRoute('/new-feature')
      expect(result?.route).toBe('/m/new-feature')
      expect(result?.mapping.description).toBe('New feature page')
    })

    it('should add new parameterized route mapping', () => {
      const newMapping = {
        from: '/product/:id',
        to: '/m/product/:id',
        parametrized: true,
        description: 'Product detail page'
      }

      addRouteMapping(newMapping, 'parameterized')
      
      const result = getMobileRoute('/product/123')
      expect(result?.route).toBe('/m/product/123')
      expect(result?.params).toEqual({ id: '123' })
    })

    it('should add new wildcard route mapping', () => {
      const newMapping = {
        from: '/docs/*',
        to: '/m/docs/*',
        wildcard: true,
        description: 'Documentation pages'
      }

      addRouteMapping(newMapping, 'wildcard')
      
      const result = getMobileRoute('/docs/getting-started')
      expect(result?.route).toBe('/m/docs/getting-started')
    })

    it('should remove route mapping', () => {
      // Verify route exists
      expect(hasMobileMapping('/upload-angle')).toBe(true)
      
      // Remove it
      const removed = removeRouteMapping('/upload-angle', 'static')
      expect(removed).toBe(true)
      
      // Verify it's gone
      expect(hasMobileMapping('/upload-angle')).toBe(false)
    })

    it('should return false when removing non-existent route', () => {
      const removed = removeRouteMapping('/non-existent', 'static')
      expect(removed).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty paths', () => {
      const result = getMobileRoute('')
      expect(result).toBeNull()
    })

    it('should handle paths with trailing slashes', () => {
      // Note: Our current implementation is strict about exact matches
      const result = getMobileRoute('/upload-angle/')
      expect(result).toBeNull() // Current behavior - could be enhanced
    })

    it('should handle paths with query strings', () => {
      // Query strings should be handled at the middleware level
      const result = getMobileRoute('/upload-angle?param=value')
      expect(result).toBeNull() // Current behavior - query strings not part of route
    })

    it('should handle complex parameterized routes', () => {
      // Add a complex route for testing
      addRouteMapping({
        from: '/user/:userId/gallery/:galleryId/photo/:photoId',
        to: '/m/user/:userId/gallery/:galleryId/photo/:photoId',
        parametrized: true
      }, 'parameterized')

      const result = getMobileRoute('/user/123/gallery/abc/photo/def')
      expect(result?.route).toBe('/m/user/123/gallery/abc/photo/def')
      expect(result?.params).toEqual({
        userId: '123',
        galleryId: 'abc',
        photoId: 'def'
      })
    })

    it('should handle wildcard with no match correctly', () => {
      const result = matchesWildcardPattern('/specific/path', '/different/path')
      expect(result).toBe(false)
    })

    it('should handle parameter extraction with special characters', () => {
      const params = extractRouteParams('/user/:id', '/user/user-123_test')
      expect(params).toEqual({ id: 'user-123_test' })
    })
  })

  describe('Priority and Precedence', () => {
    it('should prioritize static routes over parameterized routes', () => {
      // Add a conflicting parameterized route
      addRouteMapping({
        from: '/share/:type',
        to: '/m/share-type/:type',
        parametrized: true
      }, 'parameterized')

      // Static route '/share' should still take precedence
      const result = getMobileRoute('/share')
      expect(result?.route).toBe('/m/share') // Static mapping wins
    })

    it('should process routes in correct order: static -> parameterized -> wildcard', () => {
      // This test verifies the order of processing
      // Static routes should be checked first, then parameterized, then wildcard
      
      // The existing '/admin/*' wildcard should match
      const wildcardResult = getMobileRoute('/admin/users')
      expect(wildcardResult?.mapping.wildcard).toBe(true)

      // A static route should override wildcard if added
      addRouteMapping({
        from: '/admin/users',
        to: '/m/admin/users'
      }, 'static')

      const staticResult = getMobileRoute('/admin/users')
      expect(staticResult?.mapping.wildcard).toBeUndefined() // Not a wildcard match
    })
  })
})