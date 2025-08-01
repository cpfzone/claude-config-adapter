#!/usr/bin/env node

const { program } = require('commander')
const chalk = require('chalk')
const packageJson = require('../package.json')

// Import commands
const initCommand = require('../src/commands/init')
const listCommand = require('../src/commands/list')
const addCommand = require('../src/commands/add')
const useCommand = require('../src/commands/use')
const deleteCommand = require('../src/commands/delete')
const testCommand = require('../src/commands/test')
const rotateCommand = require('../src/commands/rotate')
const exportCommand = require('../src/commands/export')
const importCommand = require('../src/commands/import')
const auditCommand = require('../src/commands/audit')
const templateCommand = require('../src/commands/template')

program
  .name('cca')
  .description('Claude Config Adapter - Enterprise-grade API configuration management')
  .version(packageJson.version)

// Register commands
program
  .command('init')
  .description('Initialize CCA directory and configuration files')
  .option('-f, --force', 'Force overwrite existing configuration')
  .action(initCommand)

program
  .command('list')
  .description('List all configurations')
  .option('-v, --verbose', 'Show detailed information')
  .action(listCommand)

program
  .command('add <alias>')
  .description('Add a new configuration')
  .option('--url <url>', 'API base URL')
  .option('--token <token>', 'API token')
  .action(addCommand)

program
  .command('use <alias>')
  .description('Switch to a configuration')
  .option('--env <environment>', 'Environment (prod/test)', 'prod')
  .action(useCommand)

program
  .command('delete <alias>')
  .description('Delete a configuration')
  .option('-f, --force', 'Skip confirmation')
  .action(deleteCommand)

program
  .command('test <alias>')
  .description('Test API connectivity')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '5000')
  .action(testCommand)

program
  .command('rotate <alias>')
  .description('Rotate API token for a configuration')
  .action(rotateCommand)

program
  .command('export')
  .description('Export configurations (without tokens)')
  .option('-f, --file <path>', 'Export file path')
  .action(exportCommand)

program
  .command('import')
  .description('Import configurations from file')
  .option('-f, --file <path>', 'Import file path')
  .action(importCommand)

program
  .command('audit')
  .description('Audit operations')
  .option('--export', 'Export audit log')
  .option('-f, --file <path>', 'Export file path')
  .action(auditCommand)

program
  .command('template')
  .description('Manage configuration templates')
  .option('--list', 'List available templates')
  .option('--apply <name>', 'Apply a template')
  .action(templateCommand)

program
  .command('current')
  .description('Show current active configuration')
  .option('--env <environment>', 'Show environment configuration')
  .action(require('../src/commands/current'))

// Error handling
program.configureOutput({
  writeErr: (str) => process.stdout.write(chalk.red(str))
})

program.exitOverride()

try {
  program.parse()
} catch (err) {
  if (err.code === 'commander.version') {
    console.log(chalk.blue(`CCA v${packageJson.version}`))
  } else if (err.code === 'commander.help') {
    // Help already displayed
  } else {
    console.error(chalk.red('Error:', err.message))
    process.exit(1)
  }
}
