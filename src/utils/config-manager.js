const fs = require('fs-extra')
const path = require('path')
const yaml = require('yaml')
const { PROVIDERS_FILE, ENVS_DIR, CURRENT_FILE } = require('./paths')

class ConfigManager {
  constructor() {
    this.providers = {}
    this.loadProviders()
  }

  async loadProviders() {
    try {
      if (await fs.pathExists(PROVIDERS_FILE)) {
        const content = await fs.readFile(PROVIDERS_FILE, 'utf-8')
        if (content.trim()) {
          this.providers = JSON.parse(content)
        } else {
          this.providers = {}
        }
      }
    } catch (error) {
      if (error.name === 'SyntaxError') {
        this.providers = {}
      } else {
        throw new Error(`Failed to load providers: ${error.message}`)
      }
    }
  }

  async saveProviders() {
    try {
      await fs.ensureDir(path.dirname(PROVIDERS_FILE))
      await fs.writeFile(PROVIDERS_FILE, JSON.stringify(this.providers, null, 2))
    } catch (error) {
      throw new Error(`Failed to save providers: ${error.message}`)
    }
  }

  async addProvider(alias, config) {
    this.providers[alias] = {
      ...config,
      alias,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    await this.saveProviders()
    return this.providers[alias]
  }

  async removeProvider(alias) {
    if (!this.providers[alias]) {
      throw new Error(`Provider '${alias}' not found`)
    }

    const provider = this.providers[alias]
    delete this.providers[alias]
    await this.saveProviders()
    return provider
  }

  async getProvider(alias) {
    return this.providers[alias] || null
  }

  async getAllProviders() {
    return this.providers
  }

  async hasProvider(alias) {
    return !!this.providers[alias]
  }

  async getCurrentProvider() {
    try {
      if (await fs.pathExists(CURRENT_FILE)) {
        const content = await fs.readFile(CURRENT_FILE, 'utf-8')
        const current = JSON.parse(content)
        return this.getProvider(current.alias)
      }
    } catch (error) {
      return null
    }
    return null
  }

  async setCurrentProvider(alias) {
    const provider = await this.getProvider(alias)
    if (!provider) {
      throw new Error(`Provider '${alias}' not found`)
    }

    await fs.ensureDir(path.dirname(CURRENT_FILE))
    await fs.writeFile(CURRENT_FILE, JSON.stringify({ alias }, null, 2))
    return provider
  }

  async exportProviders(includeTokens = false) {
    const exportData = {}

    for (const [alias, provider] of Object.entries(this.providers)) {
      exportData[alias] = {
        alias: provider.alias,
        base_url: provider.base_url,
        vendor: provider.vendor,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      }
    }

    return yaml.stringify(exportData)
  }

  async importProviders(yamlContent) {
    try {
      const importData = yaml.parse(yamlContent)
      let importedCount = 0

      for (const [alias, config] of Object.entries(importData)) {
        if (await this.hasProvider(alias)) {
          console.warn(`Provider '${alias}' already exists, skipping...`)
          continue
        }

        await this.addProvider(alias, config)
        importedCount++
      }

      return importedCount
    } catch (error) {
      throw new Error(`Failed to import providers: ${error.message}`)
    }
  }

  async getEnvironmentConfig(environment) {
    const envFile = path.join(ENVS_DIR, `${environment}.json`)

    try {
      if (await fs.pathExists(envFile)) {
        const content = await fs.readFile(envFile, 'utf-8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn(`Failed to load environment config: ${error.message}`)
    }

    return {}
  }

  async saveEnvironmentConfig(environment, config) {
    await fs.ensureDir(ENVS_DIR)
    const envFile = path.join(ENVS_DIR, `${environment}.json`)
    await fs.writeFile(envFile, JSON.stringify(config, null, 2))
  }
}

module.exports = ConfigManager
