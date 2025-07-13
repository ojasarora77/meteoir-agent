use crate::types::{OptimizationSettings, ServiceProvider, UsageMetrics};
use crate::service_registry::ServiceRegistry;
use ic_cdk::api::time;
use std::collections::HashMap;

pub struct CostOptimizer {
    settings: OptimizationSettings,
    usage_history: Vec<UsageRecord>,
    chain_costs: HashMap<String, ChainCostData>,
}

#[derive(Clone, Debug)]
struct UsageRecord {
    timestamp: u64,
    chain: String,
    provider_id: String,
    cost: u64,
    success: bool,
    response_time: f64,
}

#[derive(Clone, Debug)]
struct ChainCostData {
    average_cost: f64,
    volume: u64,
    success_rate: f64,
    last_updated: u64,
}

impl CostOptimizer {
    pub fn new(settings: OptimizationSettings) -> Self {
        Self {
            settings,
            usage_history: Vec::new(),
            chain_costs: HashMap::new(),
        }
    }

    pub fn optimize_payment_route(
        &self,
        registry: &ServiceRegistry,
        chain: &str,
        amount: u64,
    ) -> Option<String> {
        // Get available providers for the chain
        let providers: Vec<_> = registry
            .list_providers()
            .into_iter()
            .filter(|p| {
                p.is_active 
                && p.supported_chains.contains(&chain.to_string())
                && p.cost_per_request <= self.settings.max_cost_per_transaction
                && p.reliability_score >= self.settings.reliability_threshold
            })
            .collect();

        if providers.is_empty() {
            return None;
        }

        // Calculate optimization score for each provider
        let best_provider = providers
            .into_iter()
            .min_by(|a, b| {
                let a_score = self.calculate_optimization_score(a, chain, amount);
                let b_score = self.calculate_optimization_score(b, chain, amount);
                a_score.partial_cmp(&b_score).unwrap_or(std::cmp::Ordering::Equal)
            });

        best_provider.map(|p| p.id.clone())
    }

    pub fn suggest_chain_rebalancing(&self) -> Vec<RebalancingSuggestion> {
        let mut suggestions = Vec::new();
        
        for preferred_chain in &self.settings.preferred_chains {
            if let Some(chain_data) = self.chain_costs.get(preferred_chain) {
                if chain_data.success_rate < self.settings.reliability_threshold {
                    suggestions.push(RebalancingSuggestion {
                        from_chain: preferred_chain.clone(),
                        to_chain: self.find_alternative_chain(preferred_chain),
                        reason: "Low success rate".to_string(),
                        potential_savings: self.calculate_potential_savings(preferred_chain),
                    });
                }
            }
        }

        suggestions
    }

    pub fn record_usage(
        &mut self,
        chain: &str,
        provider_id: &str,
        cost: u64,
        success: bool,
        response_time: f64,
    ) {
        let record = UsageRecord {
            timestamp: time(),
            chain: chain.to_string(),
            provider_id: provider_id.to_string(),
            cost,
            success,
            response_time,
        };

        self.usage_history.push(record);
        self.update_chain_costs(chain, cost, success);

        // Keep only last 1000 records
        if self.usage_history.len() > 1000 {
            self.usage_history.remove(0);
        }
    }

    pub fn get_usage_metrics(&self, time_window: u64) -> UsageMetrics {
        let current_time = time();
        let recent_records: Vec<_> = self.usage_history
            .iter()
            .filter(|r| current_time - r.timestamp <= time_window)
            .collect();

        let total_requests = recent_records.len() as u64;
        let successful_payments = recent_records.iter().filter(|r| r.success).count() as u64;
        let failed_payments = total_requests - successful_payments;
        let total_volume = recent_records.iter().map(|r| r.cost).sum();
        
        let average_response_time = if !recent_records.is_empty() {
            recent_records.iter().map(|r| r.response_time).sum::<f64>() / recent_records.len() as f64
        } else {
            0.0
        };

        let cost_efficiency = if total_requests > 0 {
            successful_payments as f64 / total_volume as f64 * 1000000.0 // per million wei
        } else {
            0.0
        };

        UsageMetrics {
            total_requests,
            successful_payments,
            failed_payments,
            total_volume,
            average_response_time,
            cost_efficiency,
        }
    }

    pub fn update_settings(&mut self, settings: OptimizationSettings) {
        self.settings = settings;
    }

    fn calculate_optimization_score(&self, provider: &ServiceProvider, chain: &str, amount: u64) -> f64 {
        let cost_score = provider.cost_per_request as f64 / amount as f64;
        let reliability_score = 1.0 - provider.reliability_score;
        
        let historical_score = if let Some(chain_data) = self.chain_costs.get(chain) {
            1.0 - chain_data.success_rate
        } else {
            0.5 // Default for new chains
        };

        // Prefer lower costs, higher reliability, better historical performance
        (cost_score * 0.4) + (reliability_score * 0.3) + (historical_score * 0.3)
    }

    fn update_chain_costs(&mut self, chain: &str, cost: u64, success: bool) {
        let current_time = time();
        
        let chain_data = self.chain_costs.entry(chain.to_string()).or_insert(ChainCostData {
            average_cost: cost as f64,
            volume: 0,
            success_rate: if success { 1.0 } else { 0.0 },
            last_updated: current_time,
        });

        // Update running averages
        chain_data.volume += 1;
        chain_data.average_cost = ((chain_data.average_cost * (chain_data.volume - 1) as f64) + cost as f64) / chain_data.volume as f64;
        
        let success_value = if success { 1.0 } else { 0.0 };
        chain_data.success_rate = ((chain_data.success_rate * (chain_data.volume - 1) as f64) + success_value) / chain_data.volume as f64;
        
        chain_data.last_updated = current_time;
    }

    fn find_alternative_chain(&self, problematic_chain: &str) -> String {
        // Find the best performing alternative chain
        self.chain_costs
            .iter()
            .filter(|(chain, _)| *chain != problematic_chain)
            .max_by(|(_, a), (_, b)| a.success_rate.partial_cmp(&b.success_rate).unwrap())
            .map(|(chain, _)| chain.clone())
            .unwrap_or_else(|| "Polygon".to_string()) // Default fallback
    }

    fn calculate_potential_savings(&self, chain: &str) -> f64 {
        if let Some(chain_data) = self.chain_costs.get(chain) {
            let current_inefficiency = (1.0 - chain_data.success_rate) * chain_data.average_cost;
            
            // Find the best alternative's efficiency
            let best_alternative_efficiency = self.chain_costs
                .values()
                .map(|data| data.success_rate * (1.0 / data.average_cost))
                .fold(0.0, f64::max);

            current_inefficiency * best_alternative_efficiency
        } else {
            0.0
        }
    }
}

#[derive(Clone, Debug, candid::CandidType, serde::Serialize, serde::Deserialize)]
pub struct RebalancingSuggestion {
    pub from_chain: String,
    pub to_chain: String,
    pub reason: String,
    pub potential_savings: f64,
}
