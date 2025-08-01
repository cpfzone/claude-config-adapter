const chalk = require('chalk')
const inquirer = require('inquirer')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')

async function deleteCommand(alias, options) {
  try {
    const configManager = new ConfigManager()
    const securityManager = new SecurityManager()

    // Check if provider exists
    const provider = await configManager.getProvider(alias)
    if (!provider) {
      console.log(chalk.red(`❌ Configuration '${alias}' not found`))
      return
    }

    // Check if this is the current active configuration
    const currentProvider = await configManager.getCurrentProvider()
    const isCurrent = currentProvider?.alias === alias

    if (isCurrent) {
      console.log(chalk.yellow(`⚠️  '${alias}' is currently active. Deactivating first...`))
    }

    // Confirm deletion
    if (!options.force) {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete '${alias}'? This will also remove the stored token.`,
          default: false
        }
      ])

      if (!confirm) {
        console.log(chalk.blue('🚪 Operation cancelled'))
        return
      }
    }

    // Remove token from keychain
    const tokenRemoved = await securityManager.removeToken(alias)
    if (tokenRemoved) {
      console.log(chalk.green('🔐 Token removed from keychain'))
    }

    // Remove configuration
    await configManager.removeProvider(alias)
    console.log(chalk.green(`✅ Configuration '${alias}' deleted`))

    // If this was the current provider, clear current.json
    if (isCurrent) {
      const fs = require('fs-extra')
      const { CURRENT_FILE } = require('../utils/paths')

      try {
        await fs.remove(CURRENT_FILE)
        console.log(chalk.yellow('⚠️  No configuration is now active'))
        console.log(chalk.dim('   Add a new configuration with: cca add <alias>'))
      } catch (error) {
        console.warn(chalk.yellow('⚠️  Could not clear current configuration'))
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to delete configuration:'), error.message)
    process.exit(1)
  }
}

module.exports = deleteCommand
