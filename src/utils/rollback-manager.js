const fs = require('fs-extra')
const path = require('path')
const { CLAUDE_SETTINGS_FILE } = require('./paths')

class RollbackManager {
  constructor() {
    this.backups = []
  }

  async createBackup() {
    try {
      if (await fs.pathExists(CLAUDE_SETTINGS_FILE)) {
        const backupPath = `${CLAUDE_SETTINGS_FILE}.backup.${Date.now()}`
        await fs.copy(CLAUDE_SETTINGS_FILE, backupPath)

        // Keep only last 5 backups
        await this.cleanupOldBackups()

        return backupPath
      }
      return null
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`)
    }
  }

  async rollback() {
    try {
      const backups = await this.getAvailableBackups()

      if (backups.length === 0) {
        throw new Error('No backups available for rollback')
      }

      // Use most recent backup
      const latestBackup = backups[0]
      await fs.copy(latestBackup.path, CLAUDE_SETTINGS_FILE)

      // Remove the backup after successful rollback
      await fs.remove(latestBackup.path)

      return true
    } catch (error) {
      throw new Error(`Failed to rollback: ${error.message}`)
    }
  }

  async getAvailableBackups() {
    try {
      const configDir = path.dirname(CLAUDE_SETTINGS_FILE)
      const files = await fs.readdir(configDir)

      const backups = files
        .filter(f => f.startsWith('settings.json.backup.'))
        .map(f => ({
          name: f,
          path: path.join(configDir, f),
          timestamp: parseInt(f.split('.').pop())
        }))
        .sort((a, b) => b.timestamp - a.timestamp)

      return backups
    } catch (error) {
      return []
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await this.getAvailableBackups()

      // Keep only last 5 backups
      const backupsToRemove = backups.slice(5)

      for (const backup of backupsToRemove) {
        await fs.remove(backup.path)
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error.message)
    }
  }

  async removeAllBackups() {
    try {
      const backups = await this.getAvailableBackups()

      for (const backup of backups) {
        await fs.remove(backup.path)
      }
    } catch (error) {
      console.warn('Failed to remove all backups:', error.message)
    }
  }
}

module.exports = RollbackManager
