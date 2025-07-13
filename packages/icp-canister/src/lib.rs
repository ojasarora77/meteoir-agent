mod types;
mod service_registry;
mod payment_processor;
mod cost_optimizer;

use candid::{candid_method, Principal};
use ic_cdk::api::time;
use ic_cdk::{init, update, query};
use ic_stable_structures::memory_manager::{MemoryManager, VirtualMemory};
use ic_stable_structures::DefaultMemoryImpl;
use std::cell::RefCell;

use types::*;
use service_registry::ServiceRegistry;
use payment_processor::PaymentProcessor;
use cost_optimizer::{CostOptimizer, RebalancingSuggestion};

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = 
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    
    static SERVICE_REGISTRY: RefCell<ServiceRegistry> = RefCell::new(ServiceRegistry::new());
    static PAYMENT_PROCESSOR: RefCell<PaymentProcessor> = RefCell::new(PaymentProcessor::new());
    static COST_OPTIMIZER: RefCell<CostOptimizer> = RefCell::new(CostOptimizer::new(OptimizationSettings::default()));
    
    static AUTHORIZED_PRINCIPALS: RefCell<Vec<Principal>> = RefCell::new(Vec::new());
}

// Initialization
#[init]
fn init() {
    let caller = ic_cdk::caller();
    AUTHORIZED_PRINCIPALS.with(|principals| {
        principals.borrow_mut().push(caller);
    });
    
    // Setup auto-processing timer
    setup_auto_processing();
}

// Authorization guard
fn is_authorized() -> Result<(), String> {
    let caller = ic_cdk::caller();
    AUTHORIZED_PRINCIPALS.with(|principals| {
        if principals.borrow().contains(&caller) || caller == Principal::anonymous() {
            Ok(())
        } else {
            Err("Unauthorized".to_string())
        }
    })
}

// Service Registry Methods
#[update]
#[candid_method(update)]
fn register_service_provider(provider: ServiceProvider) -> Result<String, String> {
    is_authorized()?;
    
    SERVICE_REGISTRY.with(|registry| {
        registry.borrow_mut().register_provider(provider)
    })?;
    
    Ok("Provider registered successfully".to_string())
}

#[query]
#[candid_method(query)]
fn get_service_provider(provider_id: String) -> Option<ServiceProvider> {
    SERVICE_REGISTRY.with(|registry| {
        registry.borrow().get_provider(&provider_id).cloned()
    })
}

#[query]
#[candid_method(query)]
fn list_service_providers() -> Vec<ServiceProvider> {
    SERVICE_REGISTRY.with(|registry| {
        registry.borrow().list_providers().into_iter().cloned().collect()
    })
}

#[update]
#[candid_method(update)]
fn deactivate_service_provider(provider_id: String) -> Result<String, String> {
    is_authorized()?;
    
    SERVICE_REGISTRY.with(|registry| {
        registry.borrow_mut().deactivate_provider(&provider_id)
    })?;
    
    Ok("Provider deactivated successfully".to_string())
}

// Payment Processing Methods
#[update]
#[candid_method(update)]
fn submit_payment(payment: PaymentRequest) -> Result<String, String> {
    is_authorized()?;
    
    PAYMENT_PROCESSOR.with(|processor| {
        processor.borrow_mut().submit_payment(payment)
    })
}

#[update]
#[candid_method(update)]
fn process_payment(payment_id: String) -> Result<String, String> {
    is_authorized()?;
    
    PAYMENT_PROCESSOR.with(|processor| {
        processor.borrow_mut().process_payment(&payment_id)
    })?;
    
    Ok("Payment processed successfully".to_string())
}

#[query]
#[candid_method(query)]
fn get_payment_status(payment_id: String) -> Option<PaymentStatus> {
    PAYMENT_PROCESSOR.with(|processor| {
        processor.borrow().get_payment_status(&payment_id)
    })
}

#[query]
#[candid_method(query)]
fn list_pending_payments() -> Vec<PaymentRequest> {
    PAYMENT_PROCESSOR.with(|processor| {
        processor.borrow().list_pending_payments().into_iter().cloned().collect()
    })
}

#[update]
#[candid_method(update)]
fn cancel_payment(payment_id: String) -> Result<String, String> {
    is_authorized()?;
    
    PAYMENT_PROCESSOR.with(|processor| {
        processor.borrow_mut().cancel_payment(&payment_id)
    })?;
    
    Ok("Payment cancelled successfully".to_string())
}

// Cost Optimization Methods
#[query]
#[candid_method(query)]
fn optimize_payment_route(chain: String, amount: u64) -> Option<String> {
    SERVICE_REGISTRY.with(|registry| {
        COST_OPTIMIZER.with(|optimizer| {
            optimizer.borrow().optimize_payment_route(&registry.borrow(), &chain, amount)
        })
    })
}

#[query]
#[candid_method(query)]
fn get_rebalancing_suggestions() -> Vec<RebalancingSuggestion> {
    COST_OPTIMIZER.with(|optimizer| {
        optimizer.borrow().suggest_chain_rebalancing()
    })
}

#[update]
#[candid_method(update)]
fn record_payment_usage(
    chain: String,
    provider_id: String,
    cost: u64,
    success: bool,
    response_time: f64,
) -> Result<String, String> {
    is_authorized()?;
    
    COST_OPTIMIZER.with(|optimizer| {
        optimizer.borrow_mut().record_usage(&chain, &provider_id, cost, success, response_time);
    });
    
    Ok("Usage recorded successfully".to_string())
}

#[query]
#[candid_method(query)]
fn get_usage_metrics(time_window_seconds: u64) -> UsageMetrics {
    COST_OPTIMIZER.with(|optimizer| {
        optimizer.borrow().get_usage_metrics(time_window_seconds)
    })
}

#[update]
#[candid_method(update)]
fn update_optimization_settings(settings: OptimizationSettings) -> Result<String, String> {
    is_authorized()?;
    
    COST_OPTIMIZER.with(|optimizer| {
        optimizer.borrow_mut().update_settings(settings);
    });
    
    Ok("Settings updated successfully".to_string())
}

// Authorization Methods
#[update]
#[candid_method(update)]
fn add_authorized_principal(principal: Principal) -> Result<String, String> {
    is_authorized()?;
    
    AUTHORIZED_PRINCIPALS.with(|principals| {
        let mut principals = principals.borrow_mut();
        if !principals.contains(&principal) {
            principals.push(principal);
        }
    });
    
    Ok("Principal authorized successfully".to_string())
}

#[update]
#[candid_method(update)]
fn remove_authorized_principal(principal: Principal) -> Result<String, String> {
    is_authorized()?;
    
    AUTHORIZED_PRINCIPALS.with(|principals| {
        let mut principals = principals.borrow_mut();
        principals.retain(|&p| p != principal);
    });
    
    Ok("Principal deauthorized successfully".to_string())
}

// Health Check
#[query]
#[candid_method(query)]
fn health_check() -> String {
    format!("Agentic Stablecoin Canister is healthy. Timestamp: {}", time())
}

// Auto-processing timer setup function
fn setup_auto_processing() {
    ic_cdk_timers::set_timer_interval(std::time::Duration::from_secs(60), || {
        ic_cdk::spawn(async {
            // Process pending payments automatically
            let pending_payments = PAYMENT_PROCESSOR.with(|processor| {
                processor.borrow().list_pending_payments().into_iter().cloned().collect::<Vec<_>>()
            });
            
            for payment in pending_payments {
                if matches!(payment.status, PaymentStatus::Pending) {
                    let _ = PAYMENT_PROCESSOR.with(|processor| {
                        processor.borrow_mut().process_payment(&payment.id)
                    });
                }
            }
        });
    });
}

// Candid interface generation
candid::export_service!();

#[query(name = "__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    __export_service()
}
