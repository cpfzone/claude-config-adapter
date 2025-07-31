const fs = require('fs-extra')
const chalk = require('chalk')
const { AUDIT_LOG } = require('../utils/paths')

async function auditCommand(options) {
  try {
    if (options.export) {
      await exportAuditLog(options.file)
    } else {
      await showAuditLog()
    }
  } catch (error) {
    console.error(chalk.red('❌ Failed to process audit log:'), error.message)
    process.exit(1)
  }
}

async function showAuditLog() {
  try {
    if (!(await fs.pathExists(AUDIT_LOG))) {
      console.log(chalk.yellow('ℹ️  No audit log found'))
      return
    }

    const auditEntries = await fs.readJson(AUDIT_LOG)
    
    if (auditEntries.length === 0) {
      console.log(chalk.yellow('ℹ️  Audit log is empty'))
      return
    }

    console.log(chalk.blue(`📊 Audit Log (${auditEntries.length} entries):\n`))

    auditEntries.forEach((entry, index) => {
      const timestamp = new Date(entry.timestamp).toLocaleString()
      const action = entry.action.padEnd(10)
      const user = (entry.user || 'unknown').padEnd(15)
      const details = entry.details

      console.log(`${chalk.dim(timestamp)} [${chalk.cyan(action)}] ${chalk.yellow(user)} ${details}`)
    })

  } catch (error) {
    console.error(chalk.red('❌ Failed to read audit log:'), error.message)
  }
}

async function exportAuditLog(filePath) {
  try {
    if (!(await fs.pathExists(AUDIT_LOG))) {
      console.log(chalk.yellow('ℹ️  No audit log found'))
      return
    }

    const auditEntries = await fs.readJson(AUDIT_LOG)
    const yaml = require('yaml')
    const exportData = yaml.stringify(auditEntries)

    if (filePath) {
      await fs.writeFile(filePath, exportData, 'utf-8')
      console.log(chalk.green(`✅ Audit log exported to: ${filePath}`))
    } else {
      console.log(exportData)
    }

    console.log(chalk.blue(`📊 Exported ${auditEntries.length} audit entries`))

  } catch (error) {
    console.error(chalk.red('❌ Failed to export audit log:'), error.message)
  }
}

module.exports = auditCommand