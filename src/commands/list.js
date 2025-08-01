const chalk = require('chalk')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')

async function listCommand(options) {
  try {
    const configManager = new ConfigManager()
    const securityManager = new SecurityManager()

    const providers = await configManager.getAllProviders()
    const currentProvider = await configManager.getCurrentProvider()

    if (Object.keys(providers).length === 0) {
      console.log(chalk.yellow('ℹ️  No configurations found. Add one with: cca add <alias>'))
      return
    }

    console.log(chalk.blue(`📋 Found ${Object.keys(providers).length} configuration(s):\n`))

    for (const [alias, provider] of Object.entries(providers)) {
      const isCurrent = currentProvider?.alias === alias
      const tokenExists = await securityManager.hasToken(alias)

      if (options.verbose) {
        console.log(chalk.bold(`${isCurrent ? '🟢' : '⚪'} ${alias}`))
        console.log(`   URL: ${chalk.cyan(provider.base_url)}`)
        console.log(`   Vendor: ${chalk.magenta(provider.vendor || 'unknown')}`)
        console.log(`   Token: ${tokenExists ? chalk.green('✅ Set') : chalk.red('❌ Missing')}`)
        console.log(`   Created: ${chalk.dim(provider.created_at)}`)
        console.log(`   Updated: ${chalk.dim(provider.updated_at)}`)
        console.log()
      } else {
        const status = isCurrent ? chalk.green('(active)') : ''
        const tokenStatus = tokenExists ? '✅' : '❌'
        console.log(`${isCurrent ? '🟢' : '⚪'} ${chalk.bold(alias)} ${status}`)
        console.log(`   ${chalk.cyan(provider.base_url)} ${tokenStatus}`)
      }
    }

    if (currentProvider) {
      console.log(chalk.green(`\n🎯 Current active: ${currentProvider.alias}`))
    } else {
      console.log(chalk.yellow('\n⚠️  No configuration is currently active'))
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to list configurations:'), error.message)
    process.exit(1)
  }
}

module.exports = listCommand
