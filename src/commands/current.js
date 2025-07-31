const chalk = require('chalk')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')

async function currentCommand(options) {
  try {
    const configManager = new ConfigManager()
    const securityManager = new SecurityManager()

    if (options.env) {
      // Show environment configuration
      const envConfig = await configManager.getEnvironmentConfig(options.env)
      
      if (Object.keys(envConfig).length === 0) {
        console.log(chalk.yellow(`ℹ️  No configuration found for environment: ${options.env}`))
        return
      }

      console.log(chalk.blue(`📋 Environment configuration for: ${options.env}`))
      console.log()
      
      Object.entries(envConfig).forEach(([key, value]) => {
        console.log(`   ${chalk.bold(key)}: ${chalk.cyan(value)}`)
      })
      
    } else {
      // Show current active configuration
      const currentProvider = await configManager.getCurrentProvider()
      
      if (!currentProvider) {
        console.log(chalk.yellow('⚠️  No configuration is currently active'))
        console.log(chalk.dim('   Add a configuration with: cca add <alias>'))
        return
      }

      const token = await securityManager.getToken(currentProvider.alias)
      
      console.log(chalk.blue('🎯 Current active configuration:'))
      console.log()
      console.log(`   Alias: ${chalk.bold(currentProvider.alias)}`)
      console.log(`   URL: ${chalk.cyan(currentProvider.base_url)}`)
      console.log(`   Vendor: ${chalk.magenta(currentProvider.vendor || 'unknown')}`)
      console.log(`   Token: ${token ? chalk.green('✅ Set') : chalk.red('❌ Missing')}`)
      console.log(`   Created: ${chalk.dim(currentProvider.created_at)}`)
      console.log(`   Updated: ${chalk.dim(currentProvider.updated_at)}`)
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to get current configuration:'), error.message)
    process.exit(1)
  }
}

module.exports = currentCommand