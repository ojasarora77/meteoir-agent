use crate::types::ServiceProvider;
use std::collections::HashMap;

pub struct ServiceRegistry {
    providers: HashMap<String, ServiceProvider>,
    performance_history: HashMap<String, Vec<f64>>,
}

impl ServiceRegistry {
    pub fn new() -> Self {
        Self {
            providers: HashMap::new(),
            performance_history: HashMap::new(),
        }
    }

    pub fn register_provider(&mut self, provider: ServiceProvider) -> Result<(), String> {
        if self.providers.contains_key(&provider.id) {
            return Err("Provider already registered".to_string());
        }

        self.performance_history.insert(provider.id.clone(), Vec::new());
        self.providers.insert(provider.id.clone(), provider);
        Ok(())
    }

    pub fn update_provider_performance(&mut self, provider_id: &str, response_time: f64) {
        if let Some(history) = self.performance_history.get_mut(provider_id) {
            history.push(response_time);
            // Keep only last 100 entries
            if history.len() > 100 {
                history.remove(0);
            }
        }
    }

    pub fn get_best_provider(&self, chain: &str, max_cost: u64) -> Option<&ServiceProvider> {
        self.providers
            .values()
            .filter(|p| {
                p.is_active 
                && p.supported_chains.contains(&chain.to_string())
                && p.cost_per_request <= max_cost
                && p.reliability_score >= 0.8
            })
            .min_by(|a, b| {
                let a_score = self.calculate_provider_score(a);
                let b_score = self.calculate_provider_score(b);
                a_score.partial_cmp(&b_score).unwrap_or(std::cmp::Ordering::Equal)
            })
    }

    pub fn get_provider(&self, id: &str) -> Option<&ServiceProvider> {
        self.providers.get(id)
    }

    pub fn list_providers(&self) -> Vec<&ServiceProvider> {
        self.providers.values().collect()
    }

    pub fn deactivate_provider(&mut self, provider_id: &str) -> Result<(), String> {
        if let Some(provider) = self.providers.get_mut(provider_id) {
            provider.is_active = false;
            Ok(())
        } else {
            Err("Provider not found".to_string())
        }
    }

    fn calculate_provider_score(&self, provider: &ServiceProvider) -> f64 {
        let cost_score = 1.0 / (provider.cost_per_request as f64 + 1.0);
        let reliability_score = provider.reliability_score;
        
        let performance_score = if let Some(history) = self.performance_history.get(&provider.id) {
            if history.is_empty() {
                0.5 // Default score for new providers
            } else {
                let avg_response_time = history.iter().sum::<f64>() / history.len() as f64;
                1.0 / (avg_response_time + 1.0)
            }
        } else {
            0.5
        };

        // Weighted combination
        (cost_score * 0.3) + (reliability_score * 0.4) + (performance_score * 0.3)
    }
}
