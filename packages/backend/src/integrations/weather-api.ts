import axios, { AxiosResponse } from 'axios';
import { ServiceProvider, ServiceRequest, PricingModel, QualityMetrics } from '../types';

export interface WeatherData {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temperature: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    visibility: number;
    wind_speed: number;
    wind_direction: number;
    weather_code: number;
    weather_description: string;
    icon: string;
  };
  forecast?: {
    date: string;
    high: number;
    low: number;
    weather_code: number;
    weather_description: string;
    precipitation_probability: number;
  }[];
  timestamp: Date;
  provider: string;
  requestCost: number;
}

export interface WeatherAPIConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheTTL: number;
}

/**
 * OpenWeatherMap API Adapter
 */
export class OpenWeatherMapAdapter {
  private config: WeatherAPIConfig;
  private provider: ServiceProvider;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private totalResponseTime: number = 0;

  constructor(provider: ServiceProvider, config: WeatherAPIConfig) {
    this.provider = provider;
    this.config = config;
  }

  async getCurrentWeather(location: string): Promise<WeatherData> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const url = `${this.config.baseUrl}/weather`;
      const params = {
        q: location,
        appid: this.config.apiKey,
        units: 'metric'
      };

      const response: AxiosResponse = await axios.get(url, {
        params,
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      const cost = this.calculateCost('current_weather', 1);
      
      return this.formatCurrentWeather(response.data, cost, responseTime);
    } catch (error) {
      this.errorCount++;
      throw new Error(`OpenWeatherMap API error: ${error}`);
    }
  }

  async getForecast(location: string, days: number = 5): Promise<WeatherData> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const url = `${this.config.baseUrl}/forecast`;
      const params = {
        q: location,
        appid: this.config.apiKey,
        units: 'metric',
        cnt: days * 8 // 8 forecasts per day (3-hour intervals)
      };

      const response: AxiosResponse = await axios.get(url, {
        params,
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      const cost = this.calculateCost('forecast', days);
      
      return this.formatForecastWeather(response.data, cost, responseTime);
    } catch (error) {
      this.errorCount++;
      throw new Error(`OpenWeatherMap forecast API error: ${error}`);
    }
  }

  async getHistoricalWeather(location: string, date: Date): Promise<WeatherData> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      const timestamp = Math.floor(date.getTime() / 1000);
      const url = `${this.config.baseUrl}/onecall/timemachine`;
      
      // First get coordinates for the location
      const geoUrl = `${this.config.baseUrl}/geo/1.0/direct`;
      const geoResponse = await axios.get(geoUrl, {
        params: {
          q: location,
          limit: 1,
          appid: this.config.apiKey
        }
      });

      if (!geoResponse.data || geoResponse.data.length === 0) {
        throw new Error('Location not found');
      }

      const { lat, lon } = geoResponse.data[0];

      const params = {
        lat,
        lon,
        dt: timestamp,
        appid: this.config.apiKey,
        units: 'metric'
      };

      const response: AxiosResponse = await axios.get(url, {
        params,
        timeout: this.config.timeout
      });

      const responseTime = Date.now() - startTime;
      this.totalResponseTime += responseTime;

      const cost = this.calculateCost('historical', 1);
      
      return this.formatHistoricalWeather(response.data, cost, responseTime);
    } catch (error) {
      this.errorCount++;
      throw new Error(`OpenWeatherMap historical API error: ${error}`);
    }
  }

  calculateCost(requestType: string, dataPoints: number): number {
    const pricing = this.provider.pricingModel;
    
    // OpenWeatherMap pricing tiers
    const pricingTiers = {
      current_weather: 0.0015, // $0.0015 per call
      forecast: 0.0015,
      historical: 0.0015,
      bulk: 0.001
    };

    const basePrice = pricingTiers[requestType as keyof typeof pricingTiers] || 0.0015;
    
    // Check free tier limits
    if (pricing.freeTier && pricing.freeTier.requestsPerDay) {
      const dailyRequests = this.getDailyRequestCount();
      if (dailyRequests < pricing.freeTier.requestsPerDay) {
        return 0; // Free tier
      }
    }

    return basePrice * dataPoints;
  }

  getQualityMetrics(): QualityMetrics {
    const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
    const successRate = this.requestCount > 0 ? ((this.requestCount - this.errorCount) / this.requestCount) * 100 : 100;
    
    return {
      uptime: 99.9, // OpenWeatherMap SLA
      avgResponseTime,
      reliabilityScore: successRate,
      dataAccuracy: 95, // Industry standard for weather data
      lastUpdated: new Date()
    };
  }

  private formatCurrentWeather(data: any, cost: number, responseTime: number): WeatherData {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      current: {
        temperature: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility / 1000, // Convert to km
        wind_speed: data.wind.speed,
        wind_direction: data.wind.deg,
        weather_code: data.weather[0].id,
        weather_description: data.weather[0].description,
        icon: data.weather[0].icon
      },
      timestamp: new Date(),
      provider: this.provider.name,
      requestCost: cost
    };
  }

  private formatForecastWeather(data: any, cost: number, responseTime: number): WeatherData {
    const forecast = data.list.map((item: any) => ({
      date: new Date(item.dt * 1000).toISOString().split('T')[0],
      high: item.main.temp_max,
      low: item.main.temp_min,
      weather_code: item.weather[0].id,
      weather_description: item.weather[0].description,
      precipitation_probability: item.pop * 100
    }));

    // Group by date and get daily highs/lows
    const dailyForecast = this.groupForecastByDay(forecast);

    return {
      location: {
        name: data.city.name,
        country: data.city.country,
        lat: data.city.coord.lat,
        lon: data.city.coord.lon
      },
      current: {
        temperature: data.list[0].main.temp,
        feels_like: data.list[0].main.feels_like,
        humidity: data.list[0].main.humidity,
        pressure: data.list[0].main.pressure,
        visibility: data.list[0].visibility / 1000,
        wind_speed: data.list[0].wind.speed,
        wind_direction: data.list[0].wind.deg,
        weather_code: data.list[0].weather[0].id,
        weather_description: data.list[0].weather[0].description,
        icon: data.list[0].weather[0].icon
      },
      forecast: dailyForecast,
      timestamp: new Date(),
      provider: this.provider.name,
      requestCost: cost
    };
  }

  private formatHistoricalWeather(data: any, cost: number, responseTime: number): WeatherData {
    const current = data.current || data.data[0];
    
    return {
      location: {
        name: 'Historical Location',
        country: '',
        lat: data.lat,
        lon: data.lon
      },
      current: {
        temperature: current.temp,
        feels_like: current.feels_like,
        humidity: current.humidity,
        pressure: current.pressure,
        visibility: current.visibility / 1000,
        wind_speed: current.wind_speed,
        wind_direction: current.wind_deg,
        weather_code: current.weather[0].id,
        weather_description: current.weather[0].description,
        icon: current.weather[0].icon
      },
      timestamp: new Date(),
      provider: this.provider.name,
      requestCost: cost
    };
  }

  private groupForecastByDay(forecast: any[]): any[] {
    const grouped = new Map();
    
    forecast.forEach(item => {
      const date = item.date;
      if (!grouped.has(date)) {
        grouped.set(date, {
          date,
          high: item.high,
          low: item.low,
          weather_code: item.weather_code,
          weather_description: item.weather_description,
          precipitation_probability: item.precipitation_probability
        });
      } else {
        const existing = grouped.get(date);
        existing.high = Math.max(existing.high, item.high);
        existing.low = Math.min(existing.low, item.low);
      }
    });
    
    return Array.from(grouped.values());
  }

  private getDailyRequestCount(): number {
    // In a real implementation, this would query a database or cache
    // For now, return current session count
    return this.requestCount;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/weather`, {
        params: {
          q: 'London',
          appid: this.config.apiKey
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      avgResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
    };
  }
}

/**
 * WeatherAPI.com Adapter (Alternative provider)
 */
export class WeatherAPIAdapter {
  private config: WeatherAPIConfig;
  private provider: ServiceProvider;

  constructor(provider: ServiceProvider, config: WeatherAPIConfig) {
    this.provider = provider;
    this.config = config;
  }

  async getCurrentWeather(location: string): Promise<WeatherData> {
    try {
      const url = `${this.config.baseUrl}/current.json`;
      const params = {
        key: this.config.apiKey,
        q: location,
        aqi: 'no'
      };

      const response = await axios.get(url, { params, timeout: this.config.timeout });
      const cost = this.calculateCost('current_weather', 1);
      
      return this.formatWeatherAPIResponse(response.data, cost);
    } catch (error) {
      throw new Error(`WeatherAPI error: ${error}`);
    }
  }

  calculateCost(requestType: string, dataPoints: number): number {
    // WeatherAPI.com pricing
    const pricingTiers = {
      current_weather: 0.004, // $0.004 per call
      forecast: 0.004,
      historical: 0.006
    };

    return pricingTiers[requestType as keyof typeof pricingTiers] * dataPoints;
  }

  private formatWeatherAPIResponse(data: any, cost: number): WeatherData {
    return {
      location: {
        name: data.location.name,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon
      },
      current: {
        temperature: data.current.temp_c,
        feels_like: data.current.feelslike_c,
        humidity: data.current.humidity,
        pressure: data.current.pressure_mb,
        visibility: data.current.vis_km,
        wind_speed: data.current.wind_kph,
        wind_direction: data.current.wind_degree,
        weather_code: data.current.condition.code,
        weather_description: data.current.condition.text,
        icon: data.current.condition.icon
      },
      timestamp: new Date(),
      provider: this.provider.name,
      requestCost: cost
    };
  }
}

/**
 * Weather Service Manager - Handles multiple providers
 */
export class WeatherServiceManager {
  private providers: Map<string, OpenWeatherMapAdapter | WeatherAPIAdapter> = new Map();
  private fallbackOrder: string[] = [];

  addProvider(id: string, adapter: OpenWeatherMapAdapter | WeatherAPIAdapter): void {
    this.providers.set(id, adapter);
    this.fallbackOrder.push(id);
  }

  async getCurrentWeather(location: string, preferredProvider?: string): Promise<WeatherData> {
    const providersToTry = preferredProvider 
      ? [preferredProvider, ...this.fallbackOrder.filter(p => p !== preferredProvider)]
      : this.fallbackOrder;

    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        return await provider.getCurrentWeather(location);
      } catch (error) {
        console.warn(`Provider ${providerId} failed:`, error);
        continue;
      }
    }

    throw new Error('All weather providers failed');
  }

  async compareProviders(location: string): Promise<{
    provider: string;
    data: WeatherData;
    responseTime: number;
    cost: number;
  }[]> {
    const results = [];

    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const startTime = Date.now();
        const data = await provider.getCurrentWeather(location);
        const responseTime = Date.now() - startTime;

        results.push({
          provider: providerId,
          data,
          responseTime,
          cost: data.requestCost
        });
      } catch (error) {
        console.warn(`Provider ${providerId} failed during comparison:`, error);
      }
    }

    return results.sort((a, b) => a.cost - b.cost); // Sort by cost
  }
}