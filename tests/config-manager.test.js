const ConfigManager = require('../src/utils/config-manager')

describe('ConfigManager', () => {
  let configManager

  beforeEach(() => {
    configManager = new ConfigManager()
    configManager.providers = {}
  })

  describe('addProvider', () => {
    test('should add new provider successfully', async () => {
      const provider = await configManager.addProvider('test', {
        base_url: 'https://api.test.com/v1',
        vendor: 'test'
      })

      expect(provider.alias).toBe('test')
      expect(provider.base_url).toBe('https://api.test.com/v1')
      expect(provider.vendor).toBe('test')
      expect(provider.created_at).toBeDefined()
      expect(provider.updated_at).toBeDefined()
    })

    test('should handle duplicate alias', async () => {
      await configManager.addProvider('test', { base_url: 'https://api.test.com/v1' })
      
      const provider = await configManager.addProvider('test', {
        base_url: 'https://api.updated.com/v1'
      })
      
      expect(provider.base_url).toBe('https://api.updated.com/v1')
    })
  })

  describe('getProvider', () => {
    test('should return null for non-existent provider', async () => {
      const provider = await configManager.getProvider('nonexistent')
      expect(provider).toBeNull()
    })

    test('should return existing provider', async () => {
      await configManager.addProvider('test', { base_url: 'https://api.test.com/v1' })
      
      const provider = await configManager.getProvider('test')
      expect(provider.alias).toBe('test')
      expect(provider.base_url).toBe('https://api.test.com/v1')
    })
  })

  describe('removeProvider', () => {
    test('should remove existing provider', async () => {
      await configManager.addProvider('test', { base_url: 'https://api.test.com/v1' })
      
      const removed = await configManager.removeProvider('test')
      expect(removed.alias).toBe('test')
      
      const provider = await configManager.getProvider('test')
      expect(provider).toBeNull()
    })

    test('should throw error for non-existent provider', async () => {
      await expect(configManager.removeProvider('nonexistent'))
        .rejects
        .toThrow("Provider 'nonexistent' not found")
    })
  })

  describe('getAllProviders', () => {
    test('should return empty object when no providers', async () => {
      const providers = await configManager.getAllProviders()
      expect(providers).toEqual({})
    })

    test('should return all providers', async () => {
      await configManager.addProvider('test1', { base_url: 'https://api1.test.com/v1' })
      await configManager.addProvider('test2', { base_url: 'https://api2.test.com/v1' })
      
      const providers = await configManager.getAllProviders()
      expect(Object.keys(providers)).toHaveLength(2)
      expect(providers.test1.base_url).toBe('https://api1.test.com/v1')
      expect(providers.test2.base_url).toBe('https://api2.test.com/v1')
    })
  })

  describe('hasProvider', () => {
    test('should return false for non-existent provider', async () => {
      const exists = await configManager.hasProvider('nonexistent')
      expect(exists).toBe(false)
    })

    test('should return true for existing provider', async () => {
      await configManager.addProvider('test', { base_url: 'https://api.test.com/v1' })
      
      const exists = await configManager.hasProvider('test')
      expect(exists).toBe(true)
    })
  })

  describe('export/import', () => {
    test('should export providers without tokens', async () => {
      await configManager.addProvider('test', {
        base_url: 'https://api.test.com/v1',
        vendor: 'test'
      })

      const exported = await configManager.exportProviders()
      expect(exported).toContain('test:')
      expect(exported).toContain('base_url: https://api.test.com/v1')
      expect(exported).toContain('vendor: test')
    })

    test('should import providers successfully', async () => {
      const yamlContent = `
test:
  alias: test
  base_url: https://api.test.com/v1
  vendor: test
`

      const count = await configManager.importProviders(yamlContent)
      expect(count).toBe(1)

      const providers = await configManager.getAllProviders()
      expect(providers.test.base_url).toBe('https://api.test.com/v1')
    })
  })

  describe('getEnvironmentConfig', () => {
    test('should return empty object when env file does not exist', async () => {
      const config = await configManager.getEnvironmentConfig('nonexistent')
      expect(config).toEqual({})
    })
  })
})