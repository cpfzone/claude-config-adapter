const chalk = require('chalk')
const inquirer = require('inquirer')
const { execSync } = require('child_process')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')
const { CLAUDE_SETTINGS_FILE } = require('../utils/paths')

async function useCommand(alias, options) {
  try {
    const configManager = new ConfigManager()
    const securityManager = new SecurityManager()

    // Check if provider exists
    const provider = await configManager.getProvider(alias)
    if (!provider) {
      console.log(chalk.red(`❌ Configuration '${alias}' not found`))
      
      // Show available configurations
      const providers = await configManager.getAllProviders()
      if (Object.keys(providers).length > 0) {
        console.log(chalk.blue('Available configurations:'))
        Object.keys(providers).forEach(p => console.log(`  - ${p}`))
      } else {
        console.log(chalk.yellow('No configurations found. Add one with: cca add <alias>'))
      }
      return
    }

    // Check if token exists
    const token = await securityManager.getToken(alias)
    if (!token) {
      console.log(chalk.red(`❌ No token found for '${alias}'. Add a token with: cca rotate ${alias}`))
      return
    }

    // Get environment config
    const envConfig = await configManager.getEnvironmentConfig(options.env)
    
    // Backup current Claude config
    await backupClaudeConfig()

    // Update Claude configuration
    console.log(chalk.blue('🔄 Updating Claude configuration...'))
    await updateClaudeConfig(provider, token, envConfig)

    // Set current provider
    await configManager.setCurrentProvider(alias)

    // Restart Claude service
    console.log(chalk.blue('🔄 Restarting Claude service...'))
    await restartClaudeService()

    console.log(chalk.green(`✅ Successfully switched to '${alias}' (${options.env})`))
    console.log(chalk.dim(`   URL: ${provider.base_url}`))
    console.log(chalk.dim(`   Vendor: ${provider.vendor || 'unknown'}`))
    console.log(chalk.dim(`   Environment: ${options.env}`))

  } catch (error) {
    console.error(chalk.red('❌ Failed to switch configuration:'), error.message)
    
    // Offer rollback
    const { rollback } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'rollback',
        message: 'Configuration failed. Attempt to rollback?',
        default: true
      }
    ])

    if (rollback) {
      try {
        await rollbackClaudeConfig()
        console.log(chalk.green('✅ Rolled back to previous configuration'))
      } catch (rollbackError) {
        console.error(chalk.red('❌ Failed to rollback:'), rollbackError.message)
      }
    }
    
    process.exit(1)
  }
}

async function backupClaudeConfig() {
  const fs = require('fs-extra')
  const path = require('path')
  
  if (await fs.pathExists(CLAUDE_SETTINGS_FILE)) {
    const backupPath = `${CLAUDE_SETTINGS_FILE}.backup.${Date.now()}`
    await fs.copy(CLAUDE_SETTINGS_FILE, backupPath)
    return backupPath
  }
  return null
}

async function updateClaudeConfig(provider, token, envConfig) {
  const fs = require('fs-extra')
  
  // Ensure Claude config directory exists
  await fs.ensureDir(path.dirname(CLAUDE_SETTINGS_FILE))
  
  let settings = {}
  
  // Load existing settings if file exists
  if (await fs.pathExists(CLAUDE_SETTINGS_FILE)) {
    try {
      settings = await fs.readJson(CLAUDE_SETTINGS_FILE)
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not parse existing settings.json, creating new one'))
    }
  }

  // Ensure settings structure
  if (!settings.env) settings.env = {}
  
  // Update configuration
  settings.env.ANTHROPIC_BASE_URL = provider.base_url
  settings.env.ANTHROPIC_AUTH_TOKEN = token
  
  // Merge environment-specific config
  Object.keys(envConfig).forEach(key => {
    if (key !== 'anthropic_auth_token') { // Don't overwrite token from env config
      settings.env[key.toUpperCase()] = envConfig[key]
    }
  })

  // Add CCA metadata
  settings.cca = {
    active_provider: provider.alias,
    last_updated: new Date().toISOString(),
    environment: 'prod' // This would come from options.env
  }

  await fs.writeJson(CLAUDE_SETTINGS_FILE, settings, { spaces: 2 })
}

async function restartClaudeService() {
  try {
    // Try to restart Claude Desktop
    const platform = process.platform
    
    if (platform === 'darwin') {
      // macOS
      execSync('osascript -e \'tell application "Claude" to quit\' && sleep 2 && open -a Claude', { stdio: 'inherit' })
    } else if (platform === 'win32') {
      // Windows
      try {
        execSync('taskkill /f /im Claude.exe && timeout 2 && start "" "%USERPROFILE%\AppData\Local\AnthropicClaude\Claude.exe"', { stdio: 'inherit' })
      } catch {
        console.log(chalk.yellow('⚠️  Could not automatically restart Claude. Please restart Claude Desktop manually.'))
      }
    } else {
      // Linux/WSL
      console.log(chalk.yellow('⚠️  Please restart your Claude client manually'))
    }
    
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not automatically restart Claude. Please restart Claude Desktop manually.'))
  }
}

async function rollbackClaudeConfig() {
  const fs = require('fs-extra')
  const path = require('path')
  
  // Find the most recent backup
  const configDir = path.dirname(CLAUDE_SETTINGS_FILE)
  const files = await fs.readdir(configDir)
  const backups = files.filter(f => f.startsWith('settings.json.backup.'))
  
  if (backups.length > 0) {
    backups.sort().reverse()
    const latestBackup = path.join(configDir, backups[0])
    await fs.copy(latestBackup, CLAUDE_SETTINGS_FILE)
    await fs.remove(latestBackup)
  }
}

module.exports = useCommand