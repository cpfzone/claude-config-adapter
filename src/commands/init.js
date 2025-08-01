const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { CCA_DIR, ENVS_DIR, TEMPLATES_DIR, AUDIT_LOG, PROVIDERS_FILE } = require('../utils/paths')

async function initCommand(options) {
  try {
    console.log(chalk.blue('🚀 Initializing Claude Config Adapter...'))

    // Check if directory already exists
    if (await fs.pathExists(CCA_DIR)) {
      if (!options.force) {
        console.log(chalk.yellow('⚠️  CCA directory already exists. Use --force to overwrite.'))
        return
      }
      console.log(chalk.yellow('⚠️  Overwriting existing configuration...'))
      await fs.remove(CCA_DIR)
    }

    // Create directory structure
    console.log(chalk.blue('📁 Creating directory structure...'))
    await fs.ensureDir(CCA_DIR)
    await fs.ensureDir(ENVS_DIR)
    await fs.ensureDir(TEMPLATES_DIR)

    // Create initial providers.json
    const providers = {}
    await fs.writeFile(PROVIDERS_FILE, JSON.stringify(providers, null, 2))

    // Create environment templates
    const envTemplate = {
      anthropic_base_url: 'https://api.anthropic.com/v1',
      anthropic_auth_token: '',
      default_model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.7
    }

    await fs.writeFile(path.join(ENVS_DIR, 'prod.json'), JSON.stringify(envTemplate, null, 2))
    await fs.writeFile(path.join(ENVS_DIR, 'test.json'), JSON.stringify({
      ...envTemplate,
      anthropic_base_url: 'https://api.anthropic.com/v1',
      default_model: 'claude-3-haiku-20240307',
      temperature: 0.5
    }, null, 2))

    // Create vendor templates
    const templates = {
      kimi: {
        base_url: 'https://api.moonshot.cn/v1',
        vendor: 'kimi',
        description: 'Moonshot AI Kimi API'
      },
      qwen: {
        base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        vendor: 'qwen',
        description: 'Alibaba Qwen API'
      },
      anthropic: {
        base_url: 'https://api.anthropic.com/v1',
        vendor: 'anthropic',
        description: 'Anthropic Claude API'
      },
      openai: {
        base_url: 'https://api.openai.com/v1',
        vendor: 'openai',
        description: 'OpenAI API'
      }
    }

    for (const [name, template] of Object.entries(templates)) {
      await fs.writeFile(
        path.join(TEMPLATES_DIR, `${name}.json`),
        JSON.stringify(template, null, 2)
      )
    }

    // Create initial audit log
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'INIT',
      user: process.env.USER || process.env.USERNAME || 'unknown',
      details: 'CCA initialized'
    }
    await fs.writeFile(AUDIT_LOG, JSON.stringify([auditEntry], null, 2))

    // Set directory permissions (Unix-like systems)
    if (process.platform !== 'win32') {
      await fs.chmod(CCA_DIR, 0o700)
    }

    console.log(chalk.green('✅ CCA initialized successfully!'))
    console.log(chalk.dim(`📂 Configuration directory: ${CCA_DIR}`))
    console.log(chalk.dim('📝 Next steps:'))
    console.log(chalk.dim('   1. Run: cca add <alias> to add your first configuration'))
    console.log(chalk.dim('   2. Run: cca list to view configurations'))
    console.log(chalk.dim('   3. Run: cca use <alias> to activate a configuration'))
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize CCA:'), error.message)
    process.exit(1)
  }
}

module.exports = initCommand
