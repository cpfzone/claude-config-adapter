const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')
const { default: inquirer } = require('inquirer')
const { TEMPLATES_DIR } = require('../utils/paths')

async function templateCommand(options) {
  try {
    if (options.list) {
      await listTemplates()
    } else if (options.apply) {
      await applyTemplate(options.apply)
    } else {
      // Default: show available templates
      await listTemplates()
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to process templates:'), error.message)
    process.exit(1)
  }
}

async function listTemplates() {
  try {
    if (!(await fs.pathExists(TEMPLATES_DIR))) {
      console.log(chalk.yellow('ℹ️  No templates found'))
      return
    }

    const templateFiles = await fs.readdir(TEMPLATES_DIR)
    const templates = templateFiles.filter(f => f.endsWith('.json'))

    if (templates.length === 0) {
      console.log(chalk.yellow('ℹ️  No templates found'))
      return
    }

    console.log(chalk.blue(`📋 Available templates (${templates.length}):\n`))

    for (const templateFile of templates) {
      const templatePath = path.join(TEMPLATES_DIR, templateFile)
      const template = await fs.readJson(templatePath)
      const name = path.basename(templateFile, '.json')

      console.log(`${chalk.bold(name)}:`)
      console.log(`   URL: ${chalk.cyan(template.base_url)}`)
      console.log(`   Vendor: ${chalk.magenta(template.vendor)}`)
      if (template.description) {
        console.log(`   Description: ${chalk.dim(template.description)}`)
      }
      console.log()
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to list templates:'), error.message)
  }
}

async function applyTemplate(templateName) {
  try {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.json`)

    if (!(await fs.pathExists(templatePath))) {
      console.log(chalk.red(`❌ Template '${templateName}' not found`))

      // Show available templates
      const templates = await fs.readdir(TEMPLATES_DIR)
      const available = templates.filter(f => f.endsWith('.json')).map(f => path.basename(f, '.json'))

      if (available.length > 0) {
        console.log(chalk.blue('Available templates:'))
        available.forEach(t => console.log(`  - ${t}`))
      }
      return
    }

    const template = await fs.readJson(templatePath)

    // Ask for configuration alias
    const { alias } = await inquirer.prompt([
      {
        type: 'input',
        name: 'alias',
        message: 'Configuration alias:',
        validate: (input) => {
          if (!input.trim()) {
            return 'Alias is required'
          }
          if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
            return 'Alias can only contain letters, numbers, underscores, and hyphens'
          }
          return true
        }
      }
    ])

    // Check if alias already exists
    const ConfigManager = require('../utils/config-manager')
    const configManager = new ConfigManager()

    if (await configManager.hasProvider(alias)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Configuration '${alias}' already exists. Overwrite?`,
          default: false
        }
      ])

      if (!overwrite) {
        console.log(chalk.blue('🚪 Operation cancelled'))
        return
      }
    }

    // Add configuration
    await configManager.addProvider(alias, {
      base_url: template.base_url,
      vendor: template.vendor
    })

    console.log(chalk.green(`✅ Template '${templateName}' applied as '${alias}'`))
    console.log(chalk.dim(`   URL: ${template.base_url}`))
    console.log(chalk.dim(`   Vendor: ${template.vendor}`))
    console.log()
    console.log(chalk.dim('📋 Next steps:'))
    console.log(chalk.dim('   1. Add token with: cca rotate ' + alias))
    console.log(chalk.dim('   2. Test with: cca test ' + alias))
    console.log(chalk.dim('   3. Activate with: cca use ' + alias))
  } catch (error) {
    console.error(chalk.red('❌ Failed to apply template:'), error.message)
  }
}

module.exports = templateCommand
