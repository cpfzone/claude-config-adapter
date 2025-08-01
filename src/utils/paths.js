const path = require('path')
const os = require('os')

const CCA_DIR = path.join(os.homedir(), '.cca')
const PROVIDERS_FILE = path.join(CCA_DIR, 'providers.json')
const ENVS_DIR = path.join(CCA_DIR, 'envs')
const TEMPLATES_DIR = path.join(CCA_DIR, 'templates')
const AUDIT_LOG = path.join(CCA_DIR, 'audit.log')
const CURRENT_FILE = path.join(CCA_DIR, 'current.json')

const CLAUDE_CONFIG_DIR = path.join(os.homedir(), '.claude')
const CLAUDE_SETTINGS_FILE = path.join(CLAUDE_CONFIG_DIR, 'settings.json')

module.exports = {
  CCA_DIR,
  PROVIDERS_FILE,
  ENVS_DIR,
  TEMPLATES_DIR,
  AUDIT_LOG,
  CURRENT_FILE,
  CLAUDE_CONFIG_DIR,
  CLAUDE_SETTINGS_FILE
}
