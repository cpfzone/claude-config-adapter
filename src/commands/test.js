const chalk = require('chalk')
const ora = require('ora')
const axios = require('axios')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')

async function testCommand(alias, options) {
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

    // Test configuration
    const spinner = ora('Testing API connectivity...').start()

    try {
      const startTime = Date.now()

      const response = await axios.post(
        `${provider.base_url}/messages`,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: parseInt(options.timeout)
        }
      )

      const endTime = Date.now()
      const responseTime = endTime - startTime

      spinner.succeed(chalk.green('✅ API connectivity test passed'))

      console.log(chalk.blue('\n📊 Test Results:'))
      console.log(`   URL: ${chalk.cyan(provider.base_url)}`)
      console.log(`   Status: ${chalk.green(response.status)} ${response.statusText}`)
      console.log(`   Response Time: ${chalk.green(responseTime + 'ms')}`)
      console.log(`   Token: ${chalk.green('Valid')} (${securityManager.maskToken(token)})`)

      if (response.data?.model) {
        console.log(`   Model: ${chalk.magenta(response.data.model)}`)
      }
    } catch (error) {
      spinner.fail(chalk.red('❌ API connectivity test failed'))

      console.log(chalk.red('\n📊 Error Details:'))

      if (error.response) {
        // Server responded with error
        console.log(`   Status: ${chalk.red(error.response.status)} ${error.response.statusText}`)
        if (error.response.status === 401) {
          console.log(`   Error: ${chalk.red('Invalid token')}`)
          console.log(`   Suggestion: ${chalk.yellow('Use "cca rotate ' + alias + '" to update token')}`)
        } else {
          console.log(`   Error: ${chalk.red(error.response.data?.error?.message || 'Unknown error')}`)
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // Network error
        console.log(`   Error: ${chalk.red('Network connection failed')}`)
        console.log(`   Suggestion: ${chalk.yellow('Check your internet connection and proxy settings')}`)
      } else if (error.code === 'ETIMEDOUT') {
        // Timeout
        console.log(`   Error: ${chalk.red('Request timeout')}`)
        console.log(`   Suggestion: ${chalk.yellow('Increase timeout with --timeout option')}`)
      } else {
        // Other errors
        console.log(`   Error: ${chalk.red(error.message)}`)
      }

      console.log(`   URL: ${chalk.cyan(provider.base_url)}`)
      process.exit(1)
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to test configuration:'), error.message)
    process.exit(1)
  }
}

module.exports = testCommand
