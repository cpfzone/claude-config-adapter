const inquirer = require('inquirer')
const chalk = require('chalk')
const ConfigManager = require('../utils/config-manager')
const SecurityManager = require('../utils/security-manager')

async function addCommand(alias, options) {
  try {
    const configManager = new ConfigManager()
    const securityManager = new SecurityManager()

    // Check if alias already exists
    if (await configManager.hasProvider(alias)) {
      console.log(chalk.red(`❌ Configuration '${alias}' already exists`))
      return
    }

    let baseUrl, token, vendor

    if (options.url && options.token) {
      // Non-interactive mode
      baseUrl = options.url
      token = options.token
      vendor = detectVendor(baseUrl)
    } else {
      // Interactive mode
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'baseUrl',
          message: 'API Base URL:',
          default: 'https://api.anthropic.com/v1',
          validate: (input) => {
            if (!input.startsWith('http')) {
              return 'Please enter a valid URL'
            }
            return true
          }
        },
        {
          type: 'password',
          name: 'token',
          message: 'API Token:',
          mask: '*',
          validate: (input) => {
            if (!input.trim()) {
              return 'Token is required'
            }
            return true
          }
        },
        {
          type: 'list',
          name: 'vendor',
          message: 'Select vendor:',
          choices: [
            { name: 'Anthropic (auto-detected)', value: 'auto' },
            { name: 'Kimi (Moonshot)', value: 'kimi' },
            { name: 'Qwen (Alibaba)', value: 'qwen' },
            { name: 'OpenAI', value: 'openai' },
            { name: 'Custom', value: 'custom' }
          ],
          default: 'auto'
        }
      ])

      baseUrl = answers.baseUrl
      token = answers.token
      vendor = answers.vendor === 'auto' ? detectVendor(answers.baseUrl) : answers.vendor
    }

    // Validate token
    console.log(chalk.blue('🔐 Validating token...'))
    try {
      await securityManager.validateToken(token, baseUrl)
      console.log(chalk.green('✅ Token validated successfully'))
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Token validation failed: ${error.message}`))
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Do you want to proceed anyway?',
          default: false
        }
      ])

      if (!proceed) {
        console.log(chalk.blue('🚪 Operation cancelled'))
        return
      }
    }

    // Save configuration
    await configManager.addProvider(alias, {
      base_url: baseUrl,
      vendor
    })

    // Store token securely
    await securityManager.storeToken(alias, token)

    console.log(chalk.green(`✅ Configuration '${alias}' added successfully`))
    console.log(chalk.dim(`   URL: ${baseUrl}`))
    console.log(chalk.dim(`   Vendor: ${vendor}`))
    console.log(chalk.dim(`   Token: ${securityManager.maskToken(token)}`))

    // Ask if user wants to activate this configuration
    if (!options.url || !options.token) {
      const { activate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'activate',
          message: 'Activate this configuration now?',
          default: true
        }
      ])

      if (activate) {
        const useCommand = require('./use')
        await useCommand(alias, { env: 'prod' })
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to add configuration:'), error.message)
    process.exit(1)
  }
}

function detectVendor(url) {
  const urlLower = url.toLowerCase()

  if (urlLower.includes('moonshot.cn')) return 'kimi'
  if (urlLower.includes('aliyuncs.com') || urlLower.includes('dashscope')) return 'qwen'
  if (urlLower.includes('anthropic.com')) return 'anthropic'
  if (urlLower.includes('openai.com')) return 'openai'

  return 'custom'
}

module.exports = addCommand
