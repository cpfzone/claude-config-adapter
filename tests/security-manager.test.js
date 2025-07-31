const keytar = require('keytar')
const SecurityManager = require('../src/utils/security-manager')
const axios = require('axios')

describe('SecurityManager', () => {
  let securityManager

  beforeEach(() => {
    securityManager = new SecurityManager()
    jest.clearAllMocks()
  })

  describe('token operations', () => {
    test('should store token successfully', async () => {
      keytar.setPassword.mockResolvedValue(true)

      const result = await securityManager.storeToken('test', 'sk-123456')
      expect(result).toBe(true)
      expect(keytar.setPassword).toHaveBeenCalledWith(
        'claude-config-adapter',
        'test',
        'sk-123456'
      )
    })

    test('should retrieve token successfully', async () => {
      keytar.getPassword.mockResolvedValue('sk-123456')

      const token = await securityManager.getToken('test')
      expect(token).toBe('sk-123456')
      expect(keytar.getPassword).toHaveBeenCalledWith(
        'claude-config-adapter',
        'test'
      )
    })

    test('should return null for missing token', async () => {
      keytar.getPassword.mockResolvedValue(null)

      const token = await securityManager.getToken('nonexistent')
      expect(token).toBeNull()
    })

    test('should remove token successfully', async () => {
      keytar.deletePassword.mockResolvedValue(true)

      const result = await securityManager.removeToken('test')
      expect(result).toBe(true)
      expect(keytar.deletePassword).toHaveBeenCalledWith(
        'claude-config-adapter',
        'test'
      )
    })

    test('should check if token exists', async () => {
      keytar.getPassword.mockResolvedValue('sk-123456')

      const exists = await securityManager.hasToken('test')
      expect(exists).toBe(true)
    })

    test('should return false for missing token', async () => {
      keytar.getPassword.mockResolvedValue(null)

      const exists = await securityManager.hasToken('nonexistent')
      expect(exists).toBe(false)
    })

    test('should rotate token successfully', async () => {
      keytar.deletePassword.mockResolvedValue(true)
      keytar.setPassword.mockResolvedValue(true)

      const result = await securityManager.rotateToken('test', 'new-token')
      expect(result).toBe(true)
      expect(keytar.deletePassword).toHaveBeenCalledWith(
        'claude-config-adapter',
        'test'
      )
      expect(keytar.setPassword).toHaveBeenCalledWith(
        'claude-config-adapter',
        'test',
        'new-token'
      )
    })
  })

  describe('token masking', () => {
    test('should mask long tokens correctly', () => {
      const token = 'sk-1234567890abcdef1234567890abcdef'
      const masked = securityManager.maskToken(token)
      expect(masked).toBe('sk-1****cdef')
    })

    test('should mask short tokens', () => {
      const token = 'sk-1234'
      const masked = securityManager.maskToken(token)
      expect(masked).toBe('****')
    })

    test('should handle empty token', () => {
      const masked = securityManager.maskToken('')
      expect(masked).toBe('****')
    })

    test('should handle null token', () => {
      const masked = securityManager.maskToken(null)
      expect(masked).toBe('****')
    })
  })

  describe('token validation', () => {
    test('should validate successful API response', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: { model: 'claude-3-sonnet-20240229' }
      })

      const isValid = await securityManager.validateToken('sk-123', 'https://api.test.com/v1')
      expect(isValid).toBe(true)
    })

    test('should handle invalid token error', async () => {
      axios.post.mockRejectedValue({
        response: { status: 401 }
      })

      await expect(securityManager.validateToken('invalid', 'https://api.test.com/v1'))
        .rejects
        .toThrow('Invalid token')
    })

    test('should handle network errors', async () => {
      axios.post.mockRejectedValue(new Error('Network error'))

      await expect(securityManager.validateToken('sk-123', 'https://api.test.com/v1'))
        .rejects
        .toThrow('Token validation failed: Network error')
    })
  })

  describe('secure token generation', () => {
    test('should generate tokens with correct length', () => {
      const token = securityManager.generateSecureToken(32)
      expect(token).toHaveLength(64) // hex doubles the length
      expect(typeof token).toBe('string')
    })

    test('should generate tokens with custom length', () => {
      const token = securityManager.generateSecureToken(16)
      expect(token).toHaveLength(32)
    })
  })
})