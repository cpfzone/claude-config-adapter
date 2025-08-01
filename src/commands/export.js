const fs = require('fs-extra')
const chalk = require('chalk')
const ConfigManager = require('../utils/config-manager')

async function exportCommand(options) {
  try {
    const configManager = new ConfigManager()

    // Get all configurations
    const exportData = await configManager.exportProviders(false) // false = exclude tokens

    if (options.file) {
      // Export to file
      await fs.writeFile(options.file, exportData, 'utf-8')
      console.log(chalk.green(`✅ Configurations exported to: ${options.file}`))
    } else {
      // Export to stdout
      console.log(exportData)
    }

    // Show summary
    const providers = await configManager.getAllProviders()
    const count = Object.keys(providers).length

    if (options.file) {
      console.log(chalk.blue(`📊 Exported ${count} configuration(s) without tokens`))
      console.log(chalk.dim('   Tokens are excluded for security reasons'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to export configurations:'), error.message)
    process.exit(1)
  }
}

module.exports = exportCommand
