use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct ServiceProvider {
    pub id: String,
    pub name: String,
    pub api_endpoint: String,
    pub supported_chains: Vec<String>,
    pub cost_per_request: u64,
    pub reliability_score: f64,
    pub last_ping: u64,
    pub is_active: bool,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct PaymentRequest {
    pub id: String,
    pub provider_id: String,
    pub chain: String,
    pub amount: u64,
    pub recipient: String,
    pub metadata: String,
    pub timestamp: u64,
    pub status: PaymentStatus,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub enum PaymentStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct UsageMetrics {
    pub total_requests: u64,
    pub successful_payments: u64,
    pub failed_payments: u64,
    pub total_volume: u64,
    pub average_response_time: f64,
    pub cost_efficiency: f64,
}

#[derive(CandidType, Clone, Debug, Deserialize, Serialize)]
pub struct OptimizationSettings {
    pub max_cost_per_transaction: u64,
    pub preferred_chains: Vec<String>,
    pub reliability_threshold: f64,
    pub auto_optimization_enabled: bool,
    pub rebalance_frequency: u64,
}

impl Default for OptimizationSettings {
    fn default() -> Self {
        Self {
            max_cost_per_transaction: 1000000, // 0.01 USD in wei equivalent
            preferred_chains: vec!["REI".to_string(), "Polygon".to_string()],
            reliability_threshold: 0.95,
            auto_optimization_enabled: true,
            rebalance_frequency: 3600, // 1 hour in seconds
        }
    }
}
