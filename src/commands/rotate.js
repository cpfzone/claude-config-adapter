const { default: inquirer } = require('inquirer')
const chalk = require('chalk')
const ora = require('ora')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')

async function rotateCommand(alias) {
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

    // Show current token info
    const currentToken = await securityManager.getToken(alias)
    if (currentToken) {
      console.log(chalk.dim(`Current token: ${securityManager.maskToken(currentToken)}`))
    }

    // Get new token
    const { newToken } = await inquirer.prompt([
      {
        type: 'password',
        name: 'newToken',
        message: 'Enter new API token:',
        mask: '*',
        validate: (input) => {
          if (!input.trim()) {
            return 'Token is required'
          }
          return true
        }
      }
    ])

    // Validate new token
    const spinner = ora('Validating new token...').start()

    try {
      await securityManager.validateToken(newToken, provider.base_url)
      spinner.succeed(chalk.green('✅ New token validated'))
    } catch (error) {
      spinner.fail(chalk.red('❌ Token validation failed'))

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Token validation failed. Do you want to proceed anyway?',
          default: false
        }
      ])

      if (!proceed) {
        console.log(chalk.blue('🚪 Operation cancelled'))
        return
      }
    }

    // Rotate token
    console.log(chalk.blue('🔄 Rotating token...'))
    await securityManager.rotateToken(alias, newToken)

    // Update provider timestamp
    await configManager.addProvider(alias, {
      ...provider,
      updated_at: new Date().toISOString()
    })

    console.log(chalk.green(`✅ Token rotated successfully for '${alias}'`))
    console.log(chalk.dim(`New token: ${securityManager.maskToken(newToken)}`))

    // Ask if user wants to test the new token
    const { test } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'test',
        message: 'Test the new token now?',
        default: true
      }
    ])

    if (test) {
      const testCommand = require('./test')
      await testCommand(alias, { timeout: '5000' })
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to rotate token:'), error.message)
    process.exit(1)
  }
}

module.exports = rotateCommand
