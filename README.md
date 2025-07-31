# Claude Config Adapter (CCA)

Enterprise-grade Claude API configuration management tool with multi-provider support.

## 🚀 Features

- **🔐 Enterprise Security**: Token encryption using system keychain
- **⚡ Fast Switching**: Switch configurations in under 3 seconds  
- **🌍 Multi-Provider**: Support for Kimi, Qwen, Anthropic, OpenAI
- **📝 Audit Logging**: Complete operation history with compliance reports
- **🔄 Automatic Rollback**: Configuration backup and restore
- **👥 Team Collaboration**: Share configurations without exposing tokens
- **🎯 Environment Support**: Separate dev/test/prod configurations

## 📦 Installation

### Global Installation
```bash
npm install -g claude-config-adapter
```

### Local Development
```bash
git clone https://github.com/anthropics/claude-config-adapter.git
cd claude-config-adapter
npm install
npm link
```

## 🎯 Quick Start

### 1. Initialize
```bash
cca init
```

### 2. Add Configuration
```bash
# Interactive mode
cca add my-kimi

# Non-interactive mode
cca add my-kimi --url https://api.moonshot.cn/v1 --token sk-xxx
```

### 3. Test Configuration
```bash
cca test my-kimi
```

### 4. Use Configuration
```bash
cca use my-kimi
```

## 📋 Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `cca init` | Initialize CCA directory | `cca init --force` |
| `cca list` | List all configurations | `cca list --verbose` |
| `cca add` | Add new configuration | `cca add kimi --url=https://api.moonshot.cn` |
| `cca use` | Switch configuration | `cca use kimi --env=prod` |
| `cca delete` | Remove configuration | `cca delete obsolete --force` |
| `cca test` | Test API connectivity | `cca test kimi --timeout=3000` |
| `cca rotate` | Update API token | `cca rotate kimi` |

### Utility Commands

| Command | Description | Example |
|---------|-------------|---------|
| `cca export` | Export configurations | `cca export > backup.yaml` |
| `cca import` | Import configurations | `cca import < backup.yaml` |
| `cca audit` | View audit log | `cca audit --export > audit.yaml` |
| `cca template` | Manage templates | `cca template --list` |
| `cca current` | Show active config | `cca current --env=test` |
| `cca rollback` | Restore from backup | `cca rollback --force` |

## 🏗️ Architecture

### Directory Structure
```
~/.cca/
├── providers.json      # Configuration registry
├── envs/               # Environment-specific configs
│   ├── prod.json
│   └── test.json
├── templates/          # Pre-configured vendor templates
├── audit.log          # Operation audit trail
└── current.json       # Active configuration pointer
```

### Security Model
- **Token Storage**: Encrypted in system keychain (macOS Keychain, Windows Credential Vault)
- **Access Control**: Directory permissions set to 700 (Unix-like systems)
- **Audit Trail**: All operations logged with timestamp, user, and details
- **Backup System**: Automatic configuration backups before changes

## 🔧 Configuration Examples

### Kimi (Moonshot)
```bash
cca add kimi \
  --url https://api.moonshot.cn/v1 \
  --token sk-your-token-here
```

### Qwen (Alibaba)
```bash
cca add qwen \
  --url https://dashscope.aliyuncs.com/compatible-mode/v1 \
  --token your-dashscope-token
```

### Anthropic Direct
```bash
cca add anthropic \
  --url https://api.anthropic.com/v1 \
  --token sk-ant-your-token
```

### OpenAI Compatible
```bash
cca add openai \
  --url https://api.openai.com/v1 \
  --token sk-your-openai-token
```

## 🌍 Environment Support

### Development vs Production
```bash
# Use test environment
cca use my-kimi --env=test

# Use production environment  
cca use my-kimi --env=prod
```

### Environment Configuration
Each environment can have different settings:
- **prod.json**: Production settings
- **test.json**: Development/testing settings

## 👥 Team Collaboration

### Export Configuration (No Tokens)
```bash
cca export --file team-config.yaml
```

### Import Shared Configuration
```bash
cca import --file team-config.yaml
```

### Add Tokens Securely
```bash
cca rotate kimi  # Each team member adds their own token
```

## 🔍 Troubleshooting

### Common Issues

#### Token Validation Failed
```bash
# Check token validity
cca test my-config

# Update token
cca rotate my-config
```

#### Configuration Not Found
```bash
# List available configurations
cca list

# Add missing configuration
cca add my-config
```

#### Claude Desktop Not Restarting
- **macOS**: Manually quit and restart Claude Desktop
- **Windows**: Restart from Start Menu or taskbar
- **Linux**: Restart your Claude client manually

### Backup and Recovery
```bash
# View available backups
cca rollback

# Force rollback to latest backup
cca rollback --force
```

## 📊 Monitoring

### View Audit Log
```bash
cca audit
```

### Export Audit Report
```bash
cca audit --export --file audit-report.yaml
```

### Check Current Configuration
```bash
cca current
cca current --env=test
```

## 🧪 Testing

### Run Tests
```bash
npm test
npm test -- --coverage
```

### Manual Testing
```bash
# Test all commands
cca init --force
cca add test --url https://api.example.com/v1 --token test-token
cca test test
cca list --verbose
cca export
cca delete test --force
```

## 🔄 Development

### Setup Development Environment
```bash
git clone https://github.com/anthropics/claude-config-adapter.git
cd claude-config-adapter
npm install

# Link for local testing
npm link

# Run with debug output
DEBUG=cca cca list
```

### Project Structure
```
src/
├── commands/          # CLI command implementations
├── utils/            # Core utilities and managers
├── templates/        # Vendor templates
└── tests/           # Unit tests
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure test coverage >= 85%
5. Submit a pull request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anthropics/claude-config-adapter/issues)
- **Documentation**: This README and `cca help [command]`
- **Examples**: Check `src/templates/` for configuration examples