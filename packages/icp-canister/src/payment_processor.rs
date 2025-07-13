use crate::types::{PaymentRequest, PaymentStatus};
use ic_cdk::api::time;
use std::collections::HashMap;

pub struct PaymentProcessor {
    pending_payments: HashMap<String, PaymentRequest>,
    completed_payments: HashMap<String, PaymentRequest>,
    retry_counts: HashMap<String, u32>,
}

impl PaymentProcessor {
    pub fn new() -> Self {
        Self {
            pending_payments: HashMap::new(),
            completed_payments: HashMap::new(),
            retry_counts: HashMap::new(),
        }
    }

    pub fn submit_payment(&mut self, mut payment: PaymentRequest) -> Result<String, String> {
        if self.pending_payments.contains_key(&payment.id) || 
           self.completed_payments.contains_key(&payment.id) {
            return Err("Payment ID already exists".to_string());
        }

        payment.timestamp = time();
        payment.status = PaymentStatus::Pending;
        
        let payment_id = payment.id.clone();
        self.pending_payments.insert(payment_id.clone(), payment);
        self.retry_counts.insert(payment_id.clone(), 0);

        Ok(payment_id)
    }

    pub fn process_payment(&mut self, payment_id: &str) -> Result<(), String> {
        // First check if payment exists
        if !self.pending_payments.contains_key(payment_id) {
            return Err("Payment not found".to_string());
        }

        // Clone the payment to avoid borrowing issues
        let mut payment_clone = self.pending_payments.get(payment_id).unwrap().clone();
        
        // Update status to processing
        payment_clone.status = PaymentStatus::Processing;
        self.pending_payments.insert(payment_id.to_string(), payment_clone.clone());
        
        // Execute transaction using the clone
        let success = self.execute_blockchain_transaction(&payment_clone);
        
        if success {
            // Update payment status to completed
            payment_clone.status = PaymentStatus::Completed;
            
            // Move to completed payments
            self.pending_payments.remove(payment_id);
            self.completed_payments.insert(payment_id.to_string(), payment_clone);
            self.retry_counts.remove(payment_id);
            Ok(())
        } else {
            self.handle_payment_failure(payment_id)
        }
    }

    pub fn get_payment_status(&self, payment_id: &str) -> Option<PaymentStatus> {
        if let Some(payment) = self.pending_payments.get(payment_id) {
            Some(payment.status.clone())
        } else if let Some(payment) = self.completed_payments.get(payment_id) {
            Some(payment.status.clone())
        } else {
            None
        }
    }

    pub fn list_pending_payments(&self) -> Vec<&PaymentRequest> {
        self.pending_payments.values().collect()
    }

    pub fn cancel_payment(&mut self, payment_id: &str) -> Result<(), String> {
        if let Some(payment) = self.pending_payments.get_mut(payment_id) {
            if matches!(payment.status, PaymentStatus::Processing) {
                return Err("Cannot cancel payment that is already processing".to_string());
            }
            
            payment.status = PaymentStatus::Cancelled;
            let cancelled_payment = payment.clone();
            self.pending_payments.remove(payment_id);
            self.completed_payments.insert(payment_id.to_string(), cancelled_payment);
            self.retry_counts.remove(payment_id);
            Ok(())
        } else {
            Err("Payment not found".to_string())
        }
    }

    fn execute_blockchain_transaction(&self, payment: &PaymentRequest) -> bool {
        // Simulate blockchain transaction
        // In real implementation, this would:
        // 1. Connect to the appropriate blockchain
        // 2. Prepare transaction data
        // 3. Submit transaction
        // 4. Wait for confirmation
        
        // For simulation, return success 90% of the time
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        payment.id.hash(&mut hasher);
        let hash = hasher.finish();
        
        (hash % 10) != 0 // 90% success rate
    }

    fn handle_payment_failure(&mut self, payment_id: &str) -> Result<(), String> {
        let retry_count = self.retry_counts.get(payment_id).unwrap_or(&0);
        
        if *retry_count < 3 {
            // Retry the payment
            self.retry_counts.insert(payment_id.to_string(), retry_count + 1);
            if let Some(payment) = self.pending_payments.get_mut(payment_id) {
                payment.status = PaymentStatus::Pending;
            }
            Ok(())
        } else {
            // Mark as failed after 3 retries
            if let Some(payment) = self.pending_payments.get_mut(payment_id) {
                payment.status = PaymentStatus::Failed;
                let failed_payment = payment.clone();
                self.pending_payments.remove(payment_id);
                self.completed_payments.insert(payment_id.to_string(), failed_payment);
                self.retry_counts.remove(payment_id);
            }
            Err("Payment failed after maximum retries".to_string())
        }
    }
}
