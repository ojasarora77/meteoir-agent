-- Agentic Stablecoin Database Schema
-- PostgreSQL schema for autonomous payment system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service providers table
CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('weather_api', 'cloud_storage', 'compute_service', 'data_feed', 'gpu_rental', 'serverless')),
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT,
    pricing_model JSONB NOT NULL,
    quality_metrics JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service requests table
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type VARCHAR(50) NOT NULL,
    endpoint TEXT NOT NULL,
    parameters JSONB DEFAULT '{}',
    estimated_cost DECIMAL(12, 6) NOT NULL,
    actual_cost DECIMAL(12, 6),
    max_budget DECIMAL(12, 6) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    user_id UUID,
    provider_id UUID REFERENCES service_providers(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    response_data JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Payment records table
CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_request_id UUID REFERENCES service_requests(id),
    service_provider_id UUID REFERENCES service_providers(id),
    amount DECIMAL(12, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
    transaction_hash VARCHAR(255),
    blockchain_network VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    gas_fee DECIMAL(12, 6),
    confirmation_blocks INTEGER,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User budgets table
CREATE TABLE user_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    daily_limit DECIMAL(12, 6) NOT NULL DEFAULT 100.00,
    monthly_limit DECIMAL(12, 6) NOT NULL DEFAULT 2000.00,
    current_daily_spent DECIMAL(12, 6) DEFAULT 0.00,
    current_monthly_spent DECIMAL(12, 6) DEFAULT 0.00,
    emergency_stop_threshold DECIMAL(12, 6) NOT NULL DEFAULT 50.00,
    service_type_limits JSONB DEFAULT '{}',
    last_reset_date DATE DEFAULT CURRENT_DATE,
    is_emergency_stopped BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health checks table
CREATE TABLE health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES service_providers(id),
    is_healthy BOOLEAN NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER,
    error_message TEXT,
    check_type VARCHAR(50) DEFAULT 'automated',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID REFERENCES service_providers(id),
    service_type VARCHAR(50) NOT NULL,
    timestamp_hour TIMESTAMP WITH TIME ZONE NOT NULL,
    avg_response_time DECIMAL(8, 2),
    throughput_requests_per_hour INTEGER,
    error_rate_percentage DECIMAL(5, 2),
    availability_percentage DECIMAL(5, 2),
    cost_per_request DECIMAL(12, 6),
    data_points_collected INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System alerts table
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('service_down', 'budget_exceeded', 'cost_spike', 'performance_degradation', 'payment_failed', 'security_issue')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    service_provider_id UUID REFERENCES service_providers(id),
    user_id UUID,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Cost analysis cache table
CREATE TABLE cost_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type VARCHAR(50) NOT NULL,
    request_parameters JSONB NOT NULL,
    analysis_data JSONB NOT NULL,
    recommendation_provider_id UUID REFERENCES service_providers(id),
    estimated_savings DECIMAL(12, 6),
    confidence_level DECIMAL(5, 2),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usage predictions table
CREATE TABLE usage_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    prediction_date DATE NOT NULL,
    predicted_requests INTEGER,
    predicted_cost DECIMAL(12, 6),
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,
    seasonal_factors JSONB DEFAULT '{}',
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('increasing', 'decreasing', 'stable')),
    trend_magnitude DECIMAL(5, 2),
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configuration settings table
CREATE TABLE user_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    preferences JSONB NOT NULL DEFAULT '{}',
    notifications JSONB NOT NULL DEFAULT '{}',
    automation JSONB NOT NULL DEFAULT '{}',
    api_keys JSONB DEFAULT '{}', -- Encrypted API keys for external services
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Queue jobs table for payment processing
CREATE TABLE queue_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics aggregations table
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    user_id UUID,
    service_type VARCHAR(50),
    provider_id UUID REFERENCES service_providers(id),
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    total_cost DECIMAL(12, 6) DEFAULT 0.00,
    avg_response_time DECIMAL(8, 2),
    cost_savings DECIMAL(12, 6) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, user_id, service_type, provider_id)
);

-- Indexes for performance
CREATE INDEX idx_service_providers_type ON service_providers(type);
CREATE INDEX idx_service_providers_active ON service_providers(is_active);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_created_at ON service_requests(created_at);
CREATE INDEX idx_payment_records_status ON payment_records(status);
CREATE INDEX idx_payment_records_created_at ON payment_records(created_at);
CREATE INDEX idx_health_checks_provider_id ON health_checks(provider_id);
CREATE INDEX idx_health_checks_created_at ON health_checks(created_at);
CREATE INDEX idx_performance_metrics_provider_id ON performance_metrics(provider_id);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp_hour);
CREATE INDEX idx_system_alerts_resolved ON system_alerts(is_resolved);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX idx_cost_analyses_service_type ON cost_analyses(service_type);
CREATE INDEX idx_cost_analyses_expires_at ON cost_analyses(expires_at);
CREATE INDEX idx_usage_predictions_user_service ON usage_predictions(user_id, service_type);
CREATE INDEX idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX idx_queue_jobs_scheduled_at ON queue_jobs(scheduled_at);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX idx_analytics_daily_user_id ON analytics_daily(user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_budgets_updated_at BEFORE UPDATE ON user_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_configurations_updated_at BEFORE UPDATE ON user_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily budgets
CREATE OR REPLACE FUNCTION reset_daily_budgets()
RETURNS void AS $$
BEGIN
    UPDATE user_budgets 
    SET current_daily_spent = 0.00,
        last_reset_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly budgets
CREATE OR REPLACE FUNCTION reset_monthly_budgets()
RETURNS void AS $$
BEGIN
    UPDATE user_budgets 
    SET current_monthly_spent = 0.00,
        updated_at = CURRENT_TIMESTAMP
    WHERE DATE_TRUNC('month', last_reset_date) < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old records
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS void AS $$
BEGIN
    -- Delete health checks older than 30 days
    DELETE FROM health_checks 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    -- Delete resolved alerts older than 7 days
    DELETE FROM system_alerts 
    WHERE is_resolved = true 
    AND resolved_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Delete expired cost analyses
    DELETE FROM cost_analyses 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete completed queue jobs older than 24 hours
    DELETE FROM queue_jobs 
    WHERE status = 'completed' 
    AND completed_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
    
    -- Delete performance metrics older than 90 days
    DELETE FROM performance_metrics 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Views for common queries
CREATE VIEW provider_health_summary AS
SELECT 
    sp.id,
    sp.name,
    sp.type,
    sp.is_active,
    COUNT(hc.id) as total_checks,
    COUNT(CASE WHEN hc.is_healthy THEN 1 END) as healthy_checks,
    ROUND(AVG(hc.response_time_ms), 2) as avg_response_time,
    ROUND(
        COUNT(CASE WHEN hc.is_healthy THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(hc.id), 0) * 100, 2
    ) as uptime_percentage
FROM service_providers sp
LEFT JOIN health_checks hc ON sp.id = hc.provider_id 
    AND hc.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY sp.id, sp.name, sp.type, sp.is_active;

CREATE VIEW daily_cost_summary AS
SELECT 
    DATE(sr.created_at) as date,
    sr.user_id,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as successful_requests,
    SUM(COALESCE(sr.actual_cost, sr.estimated_cost)) as total_cost,
    AVG(sr.execution_time_ms) as avg_execution_time
FROM service_requests sr
WHERE sr.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(sr.created_at), sr.user_id
ORDER BY date DESC, user_id;

CREATE VIEW budget_status AS
SELECT 
    ub.user_id,
    ub.daily_limit,
    ub.monthly_limit,
    ub.current_daily_spent,
    ub.current_monthly_spent,
    ROUND((ub.current_daily_spent / ub.daily_limit) * 100, 2) as daily_usage_percentage,
    ROUND((ub.current_monthly_spent / ub.monthly_limit) * 100, 2) as monthly_usage_percentage,
    ub.is_emergency_stopped,
    ub.emergency_stop_threshold
FROM user_budgets ub;

-- Sample data inserts for testing
INSERT INTO service_providers (name, type, base_url, pricing_model, quality_metrics) VALUES
('OpenWeatherMap', 'weather_api', 'https://api.openweathermap.org/data/2.5', 
 '{"type": "per_request", "basePrice": 0.0015, "currency": "USD", "freeTier": {"requestsPerDay": 1000}}',
 '{"uptime": 99.9, "avgResponseTime": 200, "reliabilityScore": 95, "dataAccuracy": 95}'),
('WeatherAPI', 'weather_api', 'https://api.weatherapi.com/v1', 
 '{"type": "per_request", "basePrice": 0.004, "currency": "USD", "freeTier": {"requestsPerMonth": 1000000}}',
 '{"uptime": 99.5, "avgResponseTime": 300, "reliabilityScore": 92, "dataAccuracy": 93}'),
('AWS S3', 'cloud_storage', 'https://s3.amazonaws.com', 
 '{"type": "per_mb", "basePrice": 0.023, "currency": "USD"}',
 '{"uptime": 99.99, "avgResponseTime": 100, "reliabilityScore": 99, "dataAccuracy": 99}'),
('IPFS Infura', 'cloud_storage', 'https://ipfs.infura.io:5001', 
 '{"type": "per_request", "basePrice": 0.0001, "currency": "USD"}',
 '{"uptime": 98.5, "avgResponseTime": 500, "reliabilityScore": 88, "dataAccuracy": 95}');

-- Sample user budget
INSERT INTO user_budgets (user_id, daily_limit, monthly_limit, emergency_stop_threshold) VALUES
('123e4567-e89b-12d3-a456-426614174000', 50.00, 1000.00, 25.00);

-- Sample configuration
INSERT INTO user_configurations (user_id, preferences, notifications, automation) VALUES
('123e4567-e89b-12d3-a456-426614174000', 
 '{"costOptimization": true, "performancePriority": false, "reliabilityThreshold": 90, "maxCostPerRequest": 1.00}',
 '{"budgetAlerts": true, "performanceAlerts": true, "costOptimizationSuggestions": true, "emailNotifications": true}',
 '{"autoApproveUnder": 0.10, "emergencyStopEnabled": true, "failoverEnabled": true, "retryAttempts": 3}');