import { OpenWeatherMapAdapter, WeatherServiceManager } from '../integrations/weather-api';
import { ServiceProvider } from '../types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OpenWeatherMapAdapter', () => {
  let adapter: OpenWeatherMapAdapter;
  let mockProvider: ServiceProvider;

  beforeEach(() => {
    mockProvider = {
      id: 'owm-1',
      name: 'OpenWeatherMap',
      type: 'weather_api' as any,
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      apiKey: 'test-api-key',
      pricingModel: {
        type: 'per_request',
        basePrice: 0.0015,
        currency: 'USD',
        freeTier: { requestsPerDay: 1000 }
      },
      qualityMetrics: {
        uptime: 99.9,
        avgResponseTime: 200,
        reliabilityScore: 95,
        dataAccuracy: 95,
        lastUpdated: new Date()
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    adapter = new OpenWeatherMapAdapter(mockProvider, {
      apiKey: 'test-key',
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      timeout: 5000,
      retryAttempts: 3,
      cacheTTL: 300
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentWeather', () => {
    test('should fetch current weather successfully', async () => {
      const mockResponse = {
        data: {
          name: 'London',
          sys: { country: 'GB' },
          coord: { lat: 51.5074, lon: -0.1278 },
          main: {
            temp: 15.5,
            feels_like: 14.2,
            humidity: 72,
            pressure: 1013
          },
          visibility: 10000,
          wind: { speed: 3.5, deg: 180 },
          weather: [{ id: 800, description: 'clear sky', icon: '01d' }]
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await adapter.getCurrentWeather('London');

      expect(result.location.name).toBe('London');
      expect(result.location.country).toBe('GB');
      expect(result.current.temperature).toBe(15.5);
      expect(result.current.humidity).toBe(72);
      expect(result.provider).toBe('OpenWeatherMap');
      expect(result.requestCost).toBeGreaterThanOrEqual(0);
    });

    test('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(adapter.getCurrentWeather('InvalidLocation'))
        .rejects.toThrow('OpenWeatherMap API error');
    });

    test('should calculate costs correctly', () => {
      const cost = adapter.calculateCost('current_weather', 1);
      expect(cost).toBe(0.0015);
    });

    test('should respect free tier limits', () => {
      // Mock daily request count to be under free tier
      jest.spyOn(adapter as any, 'getDailyRequestCount').mockReturnValue(500);
      
      const cost = adapter.calculateCost('current_weather', 1);
      expect(cost).toBe(0);
    });
  });

  describe('getForecast', () => {
    test('should fetch forecast data successfully', async () => {
      const mockResponse = {
        data: {
          city: {
            name: 'London',
            country: 'GB',
            coord: { lat: 51.5074, lon: -0.1278 }
          },
          list: [
            {
              dt: 1640995200,
              main: {
                temp: 15.5,
                feels_like: 14.2,
                humidity: 72,
                pressure: 1013,
                temp_max: 16.0,
                temp_min: 14.0
              },
              visibility: 10000,
              wind: { speed: 3.5, deg: 180 },
              weather: [{ id: 800, description: 'clear sky', icon: '01d' }],
              pop: 0.2
            }
          ]
        },
        status: 200
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await adapter.getForecast('London', 5);

      expect(result.location.name).toBe('London');
      expect(result.forecast).toBeDefined();
      expect(Array.isArray(result.forecast)).toBe(true);
    });
  });

  describe('healthCheck', () => {
    test('should return true for healthy service', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200 });

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(true);
    });

    test('should return false for unhealthy service', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Service down'));

      const isHealthy = await adapter.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('getQualityMetrics', () => {
    test('should return current quality metrics', () => {
      const metrics = adapter.getQualityMetrics();

      expect(metrics.uptime).toBe(99.9);
      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(metrics.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(metrics.dataAccuracy).toBe(95);
    });
  });
});

describe('WeatherServiceManager', () => {
  let manager: WeatherServiceManager;
  let mockAdapter1: OpenWeatherMapAdapter;
  let mockAdapter2: OpenWeatherMapAdapter;

  beforeEach(() => {
    manager = new WeatherServiceManager();
    
    // Create mock adapters
    mockAdapter1 = {
      getCurrentWeather: jest.fn(),
      calculateCost: jest.fn(),
    } as any;
    
    mockAdapter2 = {
      getCurrentWeather: jest.fn(),
      calculateCost: jest.fn(),
    } as any;

    manager.addProvider('provider1', mockAdapter1);
    manager.addProvider('provider2', mockAdapter2);
  });

  describe('getCurrentWeather', () => {
    test('should use preferred provider when specified', async () => {
      const mockWeatherData = {
        location: { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
        current: { temperature: 15.5, humidity: 72 } as any,
        timestamp: new Date(),
        provider: 'provider1',
        requestCost: 0.0015
      };

      (mockAdapter1.getCurrentWeather as jest.Mock).mockResolvedValueOnce(mockWeatherData);

      const result = await manager.getCurrentWeather('London', 'provider1');

      expect(mockAdapter1.getCurrentWeather).toHaveBeenCalledWith('London');
      expect(result.provider).toBe('provider1');
    });

    test('should fallback to other providers when preferred fails', async () => {
      const mockWeatherData = {
        location: { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
        current: { temperature: 15.5, humidity: 72 } as any,
        timestamp: new Date(),
        provider: 'provider2',
        requestCost: 0.004
      };

      (mockAdapter1.getCurrentWeather as jest.Mock).mockRejectedValueOnce(new Error('Provider1 failed'));
      (mockAdapter2.getCurrentWeather as jest.Mock).mockResolvedValueOnce(mockWeatherData);

      const result = await manager.getCurrentWeather('London', 'provider1');

      expect(mockAdapter1.getCurrentWeather).toHaveBeenCalled();
      expect(mockAdapter2.getCurrentWeather).toHaveBeenCalled();
      expect(result.provider).toBe('provider2');
    });

    test('should throw error when all providers fail', async () => {
      (mockAdapter1.getCurrentWeather as jest.Mock).mockRejectedValueOnce(new Error('Provider1 failed'));
      (mockAdapter2.getCurrentWeather as jest.Mock).mockRejectedValueOnce(new Error('Provider2 failed'));

      await expect(manager.getCurrentWeather('InvalidLocation'))
        .rejects.toThrow('All weather providers failed');
    });
  });

  describe('compareProviders', () => {
    test('should compare multiple providers and return sorted results', async () => {
      const mockData1 = {
        location: { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
        current: { temperature: 15.5 } as any,
        timestamp: new Date(),
        provider: 'provider1',
        requestCost: 0.0015
      };

      const mockData2 = {
        location: { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
        current: { temperature: 15.3 } as any,
        timestamp: new Date(),
        provider: 'provider2',
        requestCost: 0.004
      };

      (mockAdapter1.getCurrentWeather as jest.Mock).mockResolvedValueOnce(mockData1);
      (mockAdapter2.getCurrentWeather as jest.Mock).mockResolvedValueOnce(mockData2);

      const results = await manager.compareProviders('London');

      expect(results).toHaveLength(2);
      expect(results[0].cost).toBeLessThanOrEqual(results[1].cost); // Sorted by cost
    });
  });
});