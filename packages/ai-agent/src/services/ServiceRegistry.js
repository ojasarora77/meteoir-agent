import axios from 'axios';

/**
 * Service Registry - Manages available service providers and their capabilities
 */
export class ServiceRegistry {
    constructor() {
        this.providers = new Map();
        this.serviceTypes = new Set();
        this.discoveryQueue = [];
        this.lastDiscovery = 0;
        
        console.log('🏪 Service Registry initialized');
    }

    /**
     * Initialize registry with default providers
     */
    async initialize() {
        console.log('🚀 Initializing service registry...');
        
        // Add default service providers
        await this.addDefaultProviders();
        
        console.log(`✅ Registry initialized with ${this.providers.size} providers`);
    }

    /**
     * Add default service providers
     */
    async addDefaultProviders() {
        const defaultProviders = [
            {
                id: 'openweathermap',
                name: 'OpenWeatherMap',
                serviceType: 'weather',
                address: '0x1111111111111111111111111111111111111111', // Mock address
                apiEndpoint: 'https://api.openweathermap.org/data/2.5',
                costPerCall: 0.0001, // 0.0001 ETH per call
                apiKey: process.env.OPENWEATHER_API_KEY,
                active: true,
                capabilities: ['current', 'forecast', 'historical'],
                rateLimit: 1000 // calls per hour
            },
            {
                id: 'weatherapi',
                name: 'WeatherAPI',
                serviceType: 'weather',
                address: '0x2222222222222222222222222222222222222222',
                apiEndpoint: 'https://api.weatherapi.com/v1',
                costPerCall: 0.00008,
                apiKey: process.env.WEATHERAPI_KEY,
                active: true,
                capabilities: ['current', 'forecast'],
                rateLimit: 1000
            },
            {
                id: 'ipfs-pinata',
                name: 'IPFS-Pinata',
                serviceType: 'storage',
                address: '0x3333333333333333333333333333333333333333',
                apiEndpoint: 'https://api.pinata.cloud',
                costPerCall: 0.0002, // Per MB stored
                apiKey: process.env.PINATA_API_KEY,
                active: true,
                capabilities: ['pin', 'unpin', 'list'],
                rateLimit: 200
            },
            {
                id: 'coingecko',
                name: 'CoinGecko',
                serviceType: 'price-data',
                address: '0x4444444444444444444444444444444444444444',
                apiEndpoint: 'https://api.coingecko.com/api/v3',
                costPerCall: 0.00005,
                apiKey: process.env.COINGECKO_API_KEY,
                active: true,
                capabilities: ['price', 'market-data', 'historical'],
                rateLimit: 50 // Free tier limit
            }
        ];

        for (const provider of defaultProviders) {
            await this.registerProvider(provider);
        }
    }

    /**
     * Register a new service provider
     */
    async registerProvider(providerData) {
        try {
            // Create provider instance
            const provider = new ServiceProvider(providerData);
            
            // Test provider availability
            const isAvailable = await provider.testConnection();
            if (!isAvailable) {
                console.warn(`⚠️ Provider ${provider.name} is not available, registering anyway`);
            }

            // Store provider
            this.providers.set(provider.address, provider);
            this.serviceTypes.add(provider.serviceType);

            console.log(`✅ Registered provider: ${provider.name} (${provider.serviceType})`);
            return provider;

        } catch (error) {
            console.error(`❌ Failed to register provider:`, error);
            throw error;
        }
    }

    /**
     * Find providers for a specific service type
     */
    async findProviders(serviceType, filters = {}) {
        const providers = Array.from(this.providers.values())
            .filter(provider => provider.serviceType === serviceType)
            .filter(provider => provider.active)
            .filter(provider => this.applyFilters(provider, filters));

        console.log(`🔍 Found ${providers.length} providers for ${serviceType}`);
        return providers;
    }

    /**
     * Get providers by service type (alias for findProviders for compatibility)
     */
    getProvidersByType(serviceType) {
        return this.findProviders(serviceType);
    }

    /**
     * Apply filters to provider selection
     */
    applyFilters(provider, filters) {
        if (filters.maxCost && provider.costPerCall > filters.maxCost) {
            return false;
        }

        if (filters.capabilities && !filters.capabilities.every(cap => provider.capabilities.includes(cap))) {
            return false;
        }

        if (filters.minRating && provider.rating < filters.minRating) {
            return false;
        }

        return true;
    }

    /**
     * Get all providers
     */
    getAllProviders() {
        return Array.from(this.providers.values());
    }

    /**
     * Get all pricing information
     */
    getAllPricing() {
        const pricing = {};
        this.providers.forEach((provider, address) => {
            pricing[address] = {
                name: provider.name,
                serviceType: provider.serviceType,
                costPerCall: provider.costPerCall,
                lastUpdated: provider.lastPriceUpdate
            };
        });
        return pricing;
    }

    /**
     * Update provider ranking
     */
    async updateProviderRanking(address, ranking) {
        const provider = this.providers.get(address);
        if (provider) {
            provider.ranking = ranking;
            provider.lastRankingUpdate = Date.now();
            console.log(`📊 Updated ranking for ${provider.name}: ${ranking.toFixed(3)}`);
        }
    }

    /**
     * Discover new services automatically
     */
    async discoverNewServices() {
        console.log('🔍 Starting service discovery...');
        
        // This is a simplified discovery process
        // In production, this could scan various service directories, APIs, etc.
        
        const discoveryTargets = [
            'https://api.github.com/search/repositories?q=weather+api',
            'https://api.github.com/search/repositories?q=storage+api',
            'https://api.github.com/search/repositories?q=price+oracle'
        ];

        for (const target of discoveryTargets) {
            try {
                await this.scanDiscoveryTarget(target);
            } catch (error) {
                console.error(`❌ Discovery scan failed for ${target}:`, error.message);
            }
        }

        this.lastDiscovery = Date.now();
        console.log('✅ Service discovery completed');
    }

    /**
     * Scan a discovery target for new services
     */
    async scanDiscoveryTarget(url) {
        try {
            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Agentic-Stablecoin-Discovery/1.0'
                }
            });

            // This is a mock implementation
            // Real implementation would parse the response and extract service information
            console.log(`📡 Scanned ${url} - found ${response.data.total_count || 0} potential services`);
            
        } catch (error) {
            console.error(`❌ Failed to scan ${url}:`, error.message);
        }
    }

    /**
     * Get registry statistics
     */
    getStatistics() {
        const serviceTypeCounts = {};
        this.serviceTypes.forEach(type => {
            serviceTypeCounts[type] = Array.from(this.providers.values())
                .filter(p => p.serviceType === type).length;
        });

        const activeProviders = Array.from(this.providers.values()).filter(p => p.active).length;

        return {
            totalProviders: this.providers.size,
            activeProviders,
            serviceTypes: Array.from(this.serviceTypes),
            serviceTypeCounts,
            lastDiscovery: this.lastDiscovery
        };
    }
}

/**
 * Individual Service Provider class
 */
class ServiceProvider {
    constructor(data) {
        this.name = data.name;
        this.serviceType = data.serviceType;
        this.address = data.address;
        this.apiEndpoint = data.apiEndpoint;
        this.costPerCall = data.costPerCall;
        this.apiKey = data.apiKey;
        this.active = data.active !== false;
        this.capabilities = data.capabilities || [];
        this.rateLimit = data.rateLimit || 100;
        
        // Performance metrics
        this.rating = 85; // Start with neutral rating
        this.ranking = 0.5;
        this.uptime = 95;
        this.averageResponseTime = 2000;
        this.totalCalls = 0;
        this.successfulCalls = 0;
        
        // Timestamps
        this.createdAt = Date.now();
        this.lastUsed = null;
        this.lastPriceUpdate = Date.now();
        this.lastRankingUpdate = Date.now();
    }

    /**
     * Calculate cost for a specific request
     */
    calculateCost(request) {
        let cost = this.costPerCall;

        // Adjust cost based on request complexity
        if (request.priority === 'high') {
            cost *= 1.5;
        } else if (request.priority === 'low') {
            cost *= 0.8;
        }

        // Bulk discounts
        if (request.bulk && request.bulk > 10) {
            cost *= 0.9; // 10% discount for bulk requests
        }

        return cost;
    }

    /**
     * Test provider connection and availability
     */
    async testConnection() {
        try {
            const testUrl = this.getTestEndpoint();
            const response = await axios.get(testUrl, {
                timeout: 5000,
                headers: this.getHeaders()
            });

            this.uptime = 100; // Connection successful
            return response.status === 200;

        } catch (error) {
            console.warn(`⚠️ Connection test failed for ${this.name}:`, error.message);
            this.uptime = Math.max(0, this.uptime - 10); // Decrease uptime
            return false;
        }
    }

    /**
     * Get test endpoint for connection testing
     */
    getTestEndpoint() {
        switch (this.serviceType) {
            case 'weather':
                if (this.name === 'OpenWeatherMap') {
                    return `${this.apiEndpoint}/weather?q=London&appid=${this.apiKey}`;
                } else if (this.name === 'WeatherAPI') {
                    return `${this.apiEndpoint}/current.json?key=${this.apiKey}&q=London`;
                }
                break;
            case 'price-data':
                return `${this.apiEndpoint}/ping`;
            case 'storage':
                return `${this.apiEndpoint}/data/testAuthentication`;
            default:
                return this.apiEndpoint;
        }
    }

    /**
     * Get HTTP headers for API calls
     */
    getHeaders() {
        const headers = {
            'User-Agent': 'Agentic-Stablecoin/1.0'
        };

        if (this.apiKey) {
            switch (this.serviceType) {
                case 'storage':
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                    break;
                default:
                    // Most APIs use the API key in the URL
                    break;
            }
        }

        return headers;
    }

    /**
     * Call the actual service
     */
    async callService(requestData) {
        const startTime = Date.now();
        
        try {
            this.totalCalls++;
            
            let result;
            switch (this.serviceType) {
                case 'weather':
                    result = await this.callWeatherService(requestData);
                    break;
                case 'price-data':
                    result = await this.callPriceService(requestData);
                    break;
                case 'storage':
                    result = await this.callStorageService(requestData);
                    break;
                default:
                    throw new Error(`Unsupported service type: ${this.serviceType}`);
            }

            this.successfulCalls++;
            this.lastUsed = Date.now();
            
            const responseTime = Date.now() - startTime;
            this.updatePerformanceMetrics(responseTime, true);

            return {
                success: true,
                data: result,
                responseTime,
                provider: this.name
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.updatePerformanceMetrics(responseTime, false);
            
            console.error(`❌ Service call failed for ${this.name}:`, error.message);
            
            return {
                success: false,
                error: error.message,
                responseTime,
                provider: this.name
            };
        }
    }

    /**
     * Call weather service
     */
    async callWeatherService(requestData) {
        const { location, fields } = requestData;
        
        let url;
        if (this.name === 'OpenWeatherMap') {
            url = `${this.apiEndpoint}/weather?q=${location}&appid=${this.apiKey}&units=metric`;
        } else if (this.name === 'WeatherAPI') {
            url = `${this.apiEndpoint}/current.json?key=${this.apiKey}&q=${location}`;
        } else {
            throw new Error('Unknown weather provider');
        }

        const response = await axios.get(url, {
            timeout: 10000,
            headers: this.getHeaders()
        });

        // Normalize response format
        if (this.name === 'OpenWeatherMap') {
            return {
                temperature: response.data.main.temp,
                humidity: response.data.main.humidity,
                pressure: response.data.main.pressure,
                description: response.data.weather[0].description,
                location: response.data.name
            };
        } else if (this.name === 'WeatherAPI') {
            return {
                temperature: response.data.current.temp_c,
                humidity: response.data.current.humidity,
                pressure: response.data.current.pressure_mb,
                description: response.data.current.condition.text,
                location: response.data.location.name
            };
        }
    }

    /**
     * Call price service
     */
    async callPriceService(requestData) {
        const { symbols } = requestData;
        const symbolList = Array.isArray(symbols) ? symbols.join(',') : symbols;
        
        const url = `${this.apiEndpoint}/simple/price?ids=${symbolList}&vs_currencies=usd`;
        
        const response = await axios.get(url, {
            timeout: 10000,
            headers: this.getHeaders()
        });

        return response.data;
    }

    /**
     * Call storage service
     */
    async callStorageService(requestData) {
        const { action, data } = requestData;
        
        switch (action) {
            case 'pin':
                // Mock IPFS pinning
                return {
                    ipfsHash: 'QmX' + Math.random().toString(36).substr(2, 44),
                    pinSize: data.length || 1024,
                    timestamp: Date.now()
                };
            case 'list':
                return {
                    pins: [],
                    count: 0
                };
            default:
                throw new Error(`Unsupported storage action: ${action}`);
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(responseTime, success) {
        // Update average response time (exponential moving average)
        this.averageResponseTime = this.averageResponseTime * 0.8 + responseTime * 0.2;
        
        // Update success rate
        const successRate = this.successfulCalls / this.totalCalls;
        this.rating = successRate * 100;
        
        // Update uptime based on recent performance
        if (success) {
            this.uptime = Math.min(100, this.uptime + 0.1);
        } else {
            this.uptime = Math.max(0, this.uptime - 1);
        }
    }

    /**
     * Get provider status summary
     */
    getStatus() {
        return {
            name: this.name,
            serviceType: this.serviceType,
            active: this.active,
            rating: this.rating,
            uptime: this.uptime,
            averageResponseTime: this.averageResponseTime,
            totalCalls: this.totalCalls,
            successRate: this.totalCalls > 0 ? (this.successfulCalls / this.totalCalls) * 100 : 0,
            lastUsed: this.lastUsed
        };
    }
}
