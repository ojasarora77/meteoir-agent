// Core types for the agentic stablecoin system

export interface ServiceProvider {
  id: string;
  name: string;
  type: ServiceType;
  baseUrl: string;
  apiKey: string;
  pricingModel: PricingModel;
  qualityMetrics: QualityMetrics;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceType {
  WEATHER_API = 'weather_api',
  CLOUD_STORAGE = 'cloud_storage',
  COMPUTE_SERVICE = 'compute_service',
  DATA_FEED = 'data_feed',
  GPU_RENTAL = 'gpu_rental',
  SERVERLESS = 'serverless'
}

export interface PricingModel {
  type: 'per_request' | 'per_mb' | 'per_hour' | 'subscription';
  basePrice: number;
  currency: 'USD' | 'USDC' | 'USDT';
  tierPricing?: TierPricing[];
  minimumCharge?: number;
  freeTier?: FreeTier;
}

export interface TierPricing {
  minUsage: number;
  maxUsage: number;
  pricePerUnit: number;
}

export interface FreeTier {
  requestsPerDay?: number;
  requestsPerMonth?: number;
  dataLimitMB?: number;
}

export interface QualityMetrics {
  uptime: number; // percentage
  avgResponseTime: number; // milliseconds
  reliabilityScore: number; // 0-100
  dataAccuracy: number; // percentage
  lastUpdated: Date;
}

export interface ServiceRequest {
  id: string;
  serviceType: ServiceType;
  endpoint: string;
  parameters: Record<string, any>;
  estimatedCost: number;
  maxBudget: number;
  priority: Priority;
  userId: string;
  createdAt: Date;
  status: RequestStatus;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface PaymentRecord {
  id: string;
  serviceRequestId: string;
  serviceProviderId: string;
  amount: number;
  currency: string;
  transactionHash?: string;
  status: PaymentStatus;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface UserBudget {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  currentDailySpent: number;
  currentMonthlySpent: number;
  emergencyStopThreshold: number;
  lastResetDate: Date;
  serviceTypeLimits: Record<ServiceType, number>;
}

export interface CostAnalysis {
  serviceType: ServiceType;
  providers: ProviderAnalysis[];
  recommendation: ProviderRecommendation;
  analysis: {
    costSavings: number;
    reliabilityScore: number;
    performanceScore: number;
    riskAssessment: string;
  };
  timestamp: Date;
}

export interface ProviderAnalysis {
  providerId: string;
  providerName: string;
  estimatedCost: number;
  qualityScore: number;
  reliabilityScore: number;
  responseTime: number;
  pros: string[];
  cons: string[];
  rank: number;
}

export interface ProviderRecommendation {
  primary: string;
  backup: string[];
  reasoning: string;
  confidenceLevel: number;
  expectedSavings: number;
}

export interface UsagePrediction {
  serviceType: ServiceType;
  predictedUsage: {
    hourly: number[];
    daily: number[];
    monthly: number[];
  };
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  seasonalFactors: Record<string, number>;
  trendAnalysis: {
    direction: 'increasing' | 'decreasing' | 'stable';
    magnitude: number;
  };
  lastUpdated: Date;
}

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details: Record<string, any>;
  serviceProviderId?: string;
  userId?: string;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export enum AlertType {
  SERVICE_DOWN = 'service_down',
  BUDGET_EXCEEDED = 'budget_exceeded',
  COST_SPIKE = 'cost_spike',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  PAYMENT_FAILED = 'payment_failed',
  SECURITY_ISSUE = 'security_issue'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
  requestId: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  details: Record<string, any>;
}

export interface PerformanceMetrics {
  timestamp: Date;
  serviceType: ServiceType;
  providerId: string;
  metrics: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  };
}

export interface ConfigurationSettings {
  userId: string;
  preferences: {
    costOptimization: boolean;
    performancePriority: boolean;
    reliabilityThreshold: number;
    maxCostPerRequest: number;
    preferredProviders: string[];
    blockedProviders: string[];
  };
  notifications: {
    budgetAlerts: boolean;
    performanceAlerts: boolean;
    costOptimizationSuggestions: boolean;
    emailNotifications: boolean;
    slackIntegration?: {
      webhookUrl: string;
      channel: string;
    };
  };
  automation: {
    autoApproveUnder: number;
    emergencyStopEnabled: boolean;
    failoverEnabled: boolean;
    retryAttempts: number;
  };
}