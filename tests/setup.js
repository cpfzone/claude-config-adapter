// Test setup
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}

// Mock keytar for unit tests
jest.mock('keytar', () => ({
  setPassword: jest.fn(),
  getPassword: jest.fn(),
  deletePassword: jest.fn()
}))

// Mock axios for API tests
jest.mock('axios')

// Mock child_process for restart tests
jest.mock('child_process', () => ({
  execSync: jest.fn()
}))

// Mock inquirer for interactive tests
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}))