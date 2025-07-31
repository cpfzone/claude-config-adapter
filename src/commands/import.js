const fs = require('fs-extra')
const chalk = require('chalk')
const inquirer = require('inquirer')
const ConfigManager = require('../utils/config-manager')

async function importCommand(options) {
  try {
    const configManager = new ConfigManager()
    
    let importData
    
    if (options.file) {
      // Import from file
      if (!(await fs.pathExists(options.file))) {
        console.log(chalk.red(`❌ File not found: ${options.file}`))
        return
      }
      importData = await fs.readFile(options.file, 'utf-8')
    } else {
      // Import from stdin
      console.log(chalk.blue('📋 Reading configuration from stdin...'))
      console.log(chalk.dim('   Paste your YAML configuration and press Ctrl+D (Unix) or Ctrl+Z (Windows)'))
      
      // Read from stdin
      let input = ''
      process.stdin.setEncoding('utf8')
      
      for await (const chunk of process.stdin) {
        input += chunk
      }
      
      importData = input
    }
    
    if (!importData.trim()) {
      console.log(chalk.red('❌ No configuration data provided'))
      return
    }
    
    // Show preview and confirm
    console.log(chalk.blue('\n📊 Preview of configurations to import:'))
    
    const yaml = require('yaml')
    const configs = yaml.parse(importData)
    
    Object.keys(configs).forEach(alias => {
      console.log(`   - ${chalk.bold(alias)}: ${configs[alias].base_url}`)
    })
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Import ${Object.keys(configs).length} configuration(s)?`,
        default: true
      }
    ])
    
    if (!confirm) {
      console.log(chalk.blue('🚪 Operation cancelled'))
      return
    }
    
    // Import configurations
    const importedCount = await configManager.importProviders(importData)
    
    console.log(chalk.green(`✅ Successfully imported ${importedCount} configuration(s)`))
    
    // Show next steps
    if (importedCount > 0) {
      console.log(chalk.dim('\n📋 Next steps:'))
      console.log(chalk.dim('   1. Add tokens with: cca rotate <alias>'))
      console.log(chalk.dim('   2. Test configurations with: cca test <alias>'))
      console.log(chalk.dim('   3. Activate with: cca use <alias>'))
    }

  } catch (error) {
    console.error(chalk.red('❌ Failed to import configurations:'), error.message)
    process.exit(1)
  }
}

module.exports = importCommand