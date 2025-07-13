import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.OPENWEATHER_API_KEY = 'test-openweather-key';
  
  // Silence console logs during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(async () => {
  // Cleanup after all tests
});

beforeEach(async () => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Cleanup after each test
});

// Mock external dependencies
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
    ping: jest.fn().mockResolvedValue('PONG'),
    disconnect: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  }));
});

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  })),
}));

jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue(undefined),
  connection: {
    db: {
      admin: () => ({
        ping: jest.fn().mockResolvedValue({}),
      }),
    },
  },
}));

// Mock rate limiter
jest.mock('rate-limiter-flexible', () => ({
  RateLimiterRedis: jest.fn().mockImplementation(() => ({
    consume: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getWaiting: jest.fn().mockResolvedValue([]),
    getActive: jest.fn().mockResolvedValue([]),
    getCompleted: jest.fn().mockResolvedValue([]),
    getFailed: jest.fn().mockResolvedValue([]),
    getJob: jest.fn().mockResolvedValue(null),
    clean: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    isPaused: jest.fn().mockResolvedValue(false),
    on: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined),
    isRunning: jest.fn().mockReturnValue(true),
    on: jest.fn(),
  })),
}));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://bucket.s3.amazonaws.com/key',
        Key: 'key',
        ETag: '"etag"',
      }),
    }),
    getObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Body: Buffer.from('test content'),
        ContentLength: 12,
        ContentType: 'text/plain',
        LastModified: new Date(),
        ETag: '"etag"',
      }),
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
    listObjectsV2: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Contents: [],
      }),
    }),
  })),
}));

// Mock IPFS
jest.mock('ipfs-http-client', () => ({
  create: jest.fn().mockReturnValue({
    add: jest.fn().mockResolvedValue({
      cid: { toString: () => 'QmTest123' },
      path: 'test.txt',
      size: 12,
    }),
    cat: jest.fn().mockImplementation(async function* () {
      yield Buffer.from('test content');
    }),
    pin: {
      add: jest.fn().mockResolvedValue(undefined),
      rm: jest.fn().mockResolvedValue(undefined),
    },
  }),
}));

// Mock Arweave
jest.mock('arweave', () => ({
  init: jest.fn().mockReturnValue({
    createTransaction: jest.fn().mockResolvedValue({
      id: 'mock-tx-id',
      addTag: jest.fn(),
      anchor: 'mock-anchor',
      tags: [],
    }),
    transactions: {
      sign: jest.fn().mockResolvedValue(undefined),
      post: jest.fn().mockResolvedValue({ status: 200 }),
      getData: jest.fn().mockResolvedValue(Buffer.from('test content')),
      getStatus: jest.fn().mockResolvedValue({
        status: 200,
        confirmed: { number_of_confirmations: 10 },
      }),
      getPrice: jest.fn().mockResolvedValue('1000000000'),
    },
    ar: {
      winstonToAr: jest.fn().mockReturnValue('0.001'),
    },
  }),
}));

// Mock TensorFlow
jest.mock('@tensorflow/tfjs-node', () => ({}));

// Mock ML libraries
jest.mock('ml-matrix', () => ({
  Matrix: jest.fn(),
}));

jest.mock('simple-statistics', () => ({
  mean: jest.fn(),
  standardDeviation: jest.fn(),
  median: jest.fn(),
}));

// Export common test utilities
export const createMockServiceRequest = (overrides = {}) => ({
  id: 'test-request-id',
  serviceType: 'weather_api',
  endpoint: '/weather',
  parameters: { location: 'London' },
  estimatedCost: 0.0015,
  maxBudget: 1.0,
  priority: 'medium',
  userId: 'test-user-id',
  status: 'pending',
  createdAt: new Date(),
  ...overrides,
});

export const createMockServiceProvider = (overrides = {}) => ({
  id: 'test-provider-id',
  name: 'Test Provider',
  type: 'weather_api',
  baseUrl: 'https://api.example.com',
  apiKey: 'test-api-key',
  pricingModel: {
    type: 'per_request',
    basePrice: 0.0015,
    currency: 'USD',
  },
  qualityMetrics: {
    uptime: 99.9,
    avgResponseTime: 200,
    reliabilityScore: 95,
    dataAccuracy: 95,
    lastUpdated: new Date(),
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCostAnalysis = (overrides = {}) => ({
  serviceType: 'weather_api',
  providers: [
    {
      providerId: 'test-provider-id',
      providerName: 'Test Provider',
      estimatedCost: 0.0015,
      qualityScore: 85,
      reliabilityScore: 95,
      responseTime: 200,
      pros: ['Low cost', 'High reliability'],
      cons: ['Limited features'],
      rank: 1,
    },
  ],
  recommendation: {
    primary: 'test-provider-id',
    backup: [],
    reasoning: 'Best cost-performance ratio',
    confidenceLevel: 85,
    expectedSavings: 0.002,
  },
  analysis: {
    costSavings: 0.002,
    reliabilityScore: 95,
    performanceScore: 90,
    riskAssessment: 'Low',
  },
  timestamp: new Date(),
  ...overrides,
});

// Test database helpers
export const setupTestDatabase = async () => {
  // In a real implementation, this would set up a test database
  // with clean state for each test
};

export const cleanupTestDatabase = async () => {
  // In a real implementation, this would clean up test data
};

// Mock data generators
export const generateMockWeatherData = (overrides = {}) => ({
  location: {
    name: 'London',
    country: 'GB',
    lat: 51.5074,
    lon: -0.1278,
  },
  current: {
    temperature: 15.5,
    feels_like: 14.2,
    humidity: 72,
    pressure: 1013,
    visibility: 10,
    wind_speed: 3.5,
    wind_direction: 180,
    weather_code: 800,
    weather_description: 'clear sky',
    icon: '01d',
  },
  timestamp: new Date(),
  provider: 'Test Provider',
  requestCost: 0.0015,
  ...overrides,
});

// Async test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await waitFor(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};