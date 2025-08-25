import {
  isPhoneDevice,
  isTabletDevice,
  isMobileDevice,
  getDeviceInfo,
  getDeviceType,
  shouldRedirectToMobile
} from '../../../src/mobile/utils/deviceDetection'

describe('Device Detection Utils', () => {
  // Test User Agent strings for different devices
  const userAgents = {
    // iPhone devices
    iphone13: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    iphoneX: 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
    
    // Android phones
    androidPhone: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36',
    samsungGalaxy: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36',
    
    // iPad devices (tablets)
    ipadPro: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    ipadAir: 'Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/80.0.3987.95 Mobile/15E148 Safari/604.1',
    
    // Android tablets
    androidTablet: 'Mozilla/5.0 (Linux; Android 9; SM-T820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
    kindleFire: 'Mozilla/5.0 (Linux; Android 7.1.1; KFKAWI Build/NS6264) AppleWebKit/537.36 (KHTML, like Gecko) Silk/44.1.54 like Chrome/44.0.2403.63 Safari/537.36',
    
    // Desktop browsers
    chromeDesktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    safariMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    firefoxWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    
    // Edge cases
    blackberry: 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+',
    windowsPhone: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 822)',
    
    // Unusual/problematic cases
    ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    empty: '',
    undefined: undefined as unknown as string
  }

  describe('isPhoneDevice', () => {
    it('should detect iPhone devices as phones', () => {
      expect(isPhoneDevice(userAgents.iphone13)).toBe(true)
      expect(isPhoneDevice(userAgents.iphoneX)).toBe(true)
    })

    it('should detect Android phones as phones', () => {
      expect(isPhoneDevice(userAgents.androidPhone)).toBe(true)
      expect(isPhoneDevice(userAgents.samsungGalaxy)).toBe(true)
    })

    it('should not detect tablets as phones', () => {
      expect(isPhoneDevice(userAgents.ipadPro)).toBe(false)
      expect(isPhoneDevice(userAgents.ipadAir)).toBe(false)
      expect(isPhoneDevice(userAgents.androidTablet)).toBe(false)
      expect(isPhoneDevice(userAgents.kindleFire)).toBe(false)
    })

    it('should not detect desktop browsers as phones', () => {
      expect(isPhoneDevice(userAgents.chromeDesktop)).toBe(false)
      expect(isPhoneDevice(userAgents.safariMac)).toBe(false)
      expect(isPhoneDevice(userAgents.firefoxWindows)).toBe(false)
    })

    it('should detect legacy mobile devices as phones', () => {
      expect(isPhoneDevice(userAgents.blackberry)).toBe(true)
      expect(isPhoneDevice(userAgents.windowsPhone)).toBe(true)
    })

    it('should handle edge cases safely', () => {
      expect(isPhoneDevice(userAgents.empty)).toBe(false)
      expect(isPhoneDevice(userAgents.undefined)).toBe(false)
      expect(isPhoneDevice(userAgents.ipadDesktopMode)).toBe(false)
    })
  })

  describe('isTabletDevice', () => {
    it('should detect iPad devices as tablets', () => {
      expect(isTabletDevice(userAgents.ipadPro)).toBe(true)
      expect(isTabletDevice(userAgents.ipadAir)).toBe(true)
    })

    it('should detect Android tablets as tablets', () => {
      expect(isTabletDevice(userAgents.androidTablet)).toBe(true)
      expect(isTabletDevice(userAgents.kindleFire)).toBe(true)
    })

    it('should not detect phones as tablets', () => {
      expect(isTabletDevice(userAgents.iphone13)).toBe(false)
      expect(isTabletDevice(userAgents.androidPhone)).toBe(false)
      expect(isTabletDevice(userAgents.blackberry)).toBe(false)
    })

    it('should not detect desktop browsers as tablets', () => {
      expect(isTabletDevice(userAgents.chromeDesktop)).toBe(false)
      expect(isTabletDevice(userAgents.safariMac)).toBe(false)
      expect(isTabletDevice(userAgents.firefoxWindows)).toBe(false)
    })

    it('should handle edge cases safely', () => {
      expect(isTabletDevice(userAgents.empty)).toBe(false)
      expect(isTabletDevice(userAgents.undefined)).toBe(false)
    })
  })

  describe('isMobileDevice', () => {
    it('should detect phones as mobile', () => {
      expect(isMobileDevice(userAgents.iphone13)).toBe(true)
      expect(isMobileDevice(userAgents.androidPhone)).toBe(true)
      expect(isMobileDevice(userAgents.blackberry)).toBe(true)
    })

    it('should detect tablets as mobile', () => {
      expect(isMobileDevice(userAgents.ipadPro)).toBe(true)
      expect(isMobileDevice(userAgents.androidTablet)).toBe(true)
    })

    it('should not detect desktop as mobile', () => {
      expect(isMobileDevice(userAgents.chromeDesktop)).toBe(false)
      expect(isMobileDevice(userAgents.safariMac)).toBe(false)
      expect(isMobileDevice(userAgents.firefoxWindows)).toBe(false)
    })
  })

  describe('getDeviceInfo', () => {
    it('should return correct info for phones', () => {
      const info = getDeviceInfo(userAgents.iphone13)
      expect(info.isPhone).toBe(true)
      expect(info.isTablet).toBe(false)
      expect(info.isMobile).toBe(true)
      expect(info.userAgent).toBe(userAgents.iphone13)
    })

    it('should return correct info for tablets', () => {
      const info = getDeviceInfo(userAgents.ipadPro)
      expect(info.isPhone).toBe(false)
      expect(info.isTablet).toBe(true)
      expect(info.isMobile).toBe(true)
      expect(info.userAgent).toBe(userAgents.ipadPro)
    })

    it('should return correct info for desktop', () => {
      const info = getDeviceInfo(userAgents.chromeDesktop)
      expect(info.isPhone).toBe(false)
      expect(info.isTablet).toBe(false)
      expect(info.isMobile).toBe(false)
      expect(info.userAgent).toBe(userAgents.chromeDesktop)
    })
  })

  describe('getDeviceType', () => {
    it('should return "phone" for phone devices', () => {
      expect(getDeviceType(userAgents.iphone13)).toBe('phone')
      expect(getDeviceType(userAgents.androidPhone)).toBe('phone')
      expect(getDeviceType(userAgents.blackberry)).toBe('phone')
    })

    it('should return "tablet" for tablet devices', () => {
      expect(getDeviceType(userAgents.ipadPro)).toBe('tablet')
      expect(getDeviceType(userAgents.androidTablet)).toBe('tablet')
    })

    it('should return "desktop" for desktop browsers', () => {
      expect(getDeviceType(userAgents.chromeDesktop)).toBe('desktop')
      expect(getDeviceType(userAgents.safariMac)).toBe('desktop')
      expect(getDeviceType(userAgents.firefoxWindows)).toBe('desktop')
    })
  })

  describe('shouldRedirectToMobile', () => {
    it('should redirect phones to mobile', () => {
      expect(shouldRedirectToMobile(userAgents.iphone13)).toBe(true)
      expect(shouldRedirectToMobile(userAgents.androidPhone)).toBe(true)
      expect(shouldRedirectToMobile(userAgents.blackberry)).toBe(true)
    })

    it('should not redirect tablets to mobile', () => {
      expect(shouldRedirectToMobile(userAgents.ipadPro)).toBe(false)
      expect(shouldRedirectToMobile(userAgents.androidTablet)).toBe(false)
    })

    it('should not redirect desktop to mobile', () => {
      expect(shouldRedirectToMobile(userAgents.chromeDesktop)).toBe(false)
      expect(shouldRedirectToMobile(userAgents.safariMac)).toBe(false)
    })

    it('should handle edge cases safely', () => {
      expect(shouldRedirectToMobile(userAgents.empty)).toBe(false)
      expect(shouldRedirectToMobile(userAgents.undefined)).toBe(false)
    })
  })

  describe('Critical iPad detection edge cases', () => {
    it('should not confuse iPad desktop mode with iPhone', () => {
      // This is a critical test for iPads presenting as desktop Safari
      expect(isPhoneDevice(userAgents.ipadDesktopMode)).toBe(false)
      expect(isTabletDevice(userAgents.ipadDesktopMode)).toBe(false) // Desktop mode iPad
      expect(shouldRedirectToMobile(userAgents.ipadDesktopMode)).toBe(false)
    })

    it('should correctly identify actual iPad user agents', () => {
      expect(isTabletDevice(userAgents.ipadPro)).toBe(true)
      expect(isPhoneDevice(userAgents.ipadPro)).toBe(false)
      expect(shouldRedirectToMobile(userAgents.ipadPro)).toBe(false)
    })
  })
})