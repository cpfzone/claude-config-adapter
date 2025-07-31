const keytar = require('keytar')
const crypto = require('crypto')

const SERVICE_NAME = 'claude-config-adapter'

class SecurityManager {
  constructor() {
    this.service = SERVICE_NAME
  }

  async storeToken(alias, token) {
    try {
      await keytar.setPassword(this.service, alias, token)
      return true
    } catch (error) {
      throw new Error(`Failed to store token: ${error.message}`)
    }
  }

  async getToken(alias) {
    try {
      return await keytar.getPassword(this.service, alias)
    } catch (error) {
      throw new Error(`Failed to retrieve token: ${error.message}`)
    }
  }

  async removeToken(alias) {
    try {
      return await keytar.deletePassword(this.service, alias)
    } catch (error) {
      throw new Error(`Failed to remove token: ${error.message}`)
    }
  }

  async hasToken(alias) {
    try {
      const token = await keytar.getPassword(this.service, alias)
      return !!token
    } catch (error) {
      return false
    }
  }

  async rotateToken(alias, newToken) {
    try {
      // Remove old token
      await this.removeToken(alias)
      
      // Store new token
      await this.storeToken(alias, newToken)
      
      return true
    } catch (error) {
      throw new Error(`Failed to rotate token: ${error.message}`)
    }
  }

  async validateToken(token, baseUrl) {
    try {
      const axios = require('axios')
      
      const response = await axios.post(
        `${baseUrl}/messages`,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      )
      
      return response.status === 200
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid token')
      }
      throw new Error(`Token validation failed: ${error.message}`)
    }
  }

  maskToken(token) {
    if (!token) return '****'
    if (token.length <= 8) return '****'
    
    const prefix = token.substring(0, 4)
    const suffix = token.substring(token.length - 4)
    return `${prefix}****${suffix}`
  }

  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }
}

module.exports = SecurityManager