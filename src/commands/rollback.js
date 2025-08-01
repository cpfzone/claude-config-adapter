const chalk = require('chalk')
const inquirer = require('inquirer')
const RollbackManager = require('../utils/rollback-manager')

async function rollbackCommand(options) {
  try {
    const rollbackManager = new RollbackManager()

    // Get available backups
    const backups = await rollbackManager.getAvailableBackups()

    if (backups.length === 0) {
      console.log(chalk.yellow('ℹ️  No backups available for rollback'))
      return
    }

    console.log(chalk.blue(`📊 Found ${backups.length} backup(s):\n`))

    backups.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString()
      console.log(`${index + 1}. ${chalk.bold(backup.name)} - ${chalk.dim(date)}`)
    })

    if (options.force) {
      // Auto-rollback to latest
      console.log(chalk.blue('\n🔄 Rolling back to latest backup...'))
      await rollbackManager.rollback()
      console.log(chalk.green('✅ Successfully rolled back to previous configuration'))
    } else {
      // Interactive rollback
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Rollback to the most recent backup?',
          default: false
        }
      ])

      if (!confirm) {
        console.log(chalk.blue('🚪 Operation cancelled'))
        return
      }

      console.log(chalk.blue('🔄 Rolling back configuration...'))
      await rollbackManager.rollback()
      console.log(chalk.green('✅ Successfully rolled back to previous configuration'))
    }

    console.log(chalk.dim('\n🔄 Restart Claude Desktop to apply changes'))
  } catch (error) {
    console.error(chalk.red('❌ Failed to rollback:'), error.message)
    process.exit(1)
  }
}

module.exports = rollbackCommand
