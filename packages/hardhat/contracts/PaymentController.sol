//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

/**
 * Autonomous Payment Controller for Agentic Stablecoin System
 * Manages automated payments to service providers with budget controls
 * @author Agentic Stablecoin Team
 */
contract PaymentController {
    
    struct Budget {
        uint256 dailyLimit;
        uint256 monthlyLimit;
        uint256 dailySpent;
        uint256 monthlySpent;
        uint256 lastDayReset;
        uint256 lastMonthReset;
        uint256 emergencyThreshold;
        bool isActive;
    }

    struct ServiceProvider {
        string apiEndpoint;
        uint256 costPerCall;
        uint256 reputationScore;
        bool isRegistered;
        bool isActive;
        uint256 totalPayments;
    }

    struct PaymentRecord {
        address provider;
        uint256 amount;
        uint256 timestamp;
        string serviceType;
        bool successful;
    }

    // State Variables
    address public immutable owner;
    bool public emergencyStop = false;
    uint256 public totalPayments = 0;
    uint256 public totalProviders = 0;

    // Mappings
    mapping(address => Budget) public budgets;
    mapping(address => bool) public authorizedAgents;
    mapping(address => ServiceProvider) public serviceProviders;
    mapping(uint256 => PaymentRecord) public paymentHistory;
    mapping(address => uint256[]) public userPaymentHistory;

    // Events
    event PaymentExecuted(
        address indexed agent,
        address indexed provider,
        uint256 amount,
        string serviceType,
        uint256 timestamp
    );
    
    event BudgetUpdated(
        address indexed user,
        uint256 dailyLimit,
        uint256 monthlyLimit
    );
    
    event ServiceProviderRegistered(
        address indexed provider,
        string apiEndpoint,
        uint256 costPerCall
    );
    
    event EmergencyStopToggled(bool stopped);

    constructor(address _owner) {
        owner = _owner;
        authorizedAgents[_owner] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        _;
    }

    modifier notInEmergency() {
        require(!emergencyStop, "Emergency stop activated");
        _;
    }

    modifier validProvider(address provider) {
        require(serviceProviders[provider].isRegistered, "Provider not registered");
        require(serviceProviders[provider].isActive, "Provider not active");
        _;
    }

    /**
     * Execute payment to a service provider
     */
    function executePayment(
        address provider,
        uint256 amount,
        string memory serviceType
    ) external payable onlyAuthorizedAgent notInEmergency validProvider(provider) {
        require(msg.value >= amount, "Insufficient payment");
        
        // Check budget constraints
        Budget storage budget = budgets[msg.sender];
        _resetBudgetIfNeeded(budget);
        
        require(budget.isActive, "Budget not active");
        require(budget.dailySpent + amount <= budget.dailyLimit, "Daily limit exceeded");
        require(budget.monthlySpent + amount <= budget.monthlyLimit, "Monthly limit exceeded");
        
        // Emergency threshold check
        if (amount > budget.emergencyThreshold) {
            require(msg.sender == owner, "Amount exceeds emergency threshold");
        }

        // Execute payment
        (bool success, ) = provider.call{value: amount}("");
        require(success, "Payment failed");

        // Update budget tracking
        budget.dailySpent += amount;
        budget.monthlySpent += amount;

        // Update provider stats
        serviceProviders[provider].totalPayments += amount;

        // Record payment
        PaymentRecord memory record = PaymentRecord({
            provider: provider,
            amount: amount,
            timestamp: block.timestamp,
            serviceType: serviceType,
            successful: true
        });
        
        paymentHistory[totalPayments] = record;
        userPaymentHistory[msg.sender].push(totalPayments);
        totalPayments++;

        emit PaymentExecuted(msg.sender, provider, amount, serviceType, block.timestamp);

        // Return excess payment
        if (msg.value > amount) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - amount}("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * Set budget limits for an agent
     */
    function setBudget(
        uint256 dailyLimit,
        uint256 monthlyLimit,
        uint256 emergencyThreshold
    ) external {
        require(dailyLimit <= monthlyLimit, "Daily limit cannot exceed monthly");
        
        Budget storage budget = budgets[msg.sender];
        budget.dailyLimit = dailyLimit;
        budget.monthlyLimit = monthlyLimit;
        budget.emergencyThreshold = emergencyThreshold;
        budget.isActive = true;
        
        if (budget.lastDayReset == 0) {
            budget.lastDayReset = block.timestamp;
            budget.lastMonthReset = block.timestamp;
        }

        emit BudgetUpdated(msg.sender, dailyLimit, monthlyLimit);
    }

    /**
     * Register a new service provider
     */
    function registerServiceProvider(
        address provider,
        string memory apiEndpoint,
        uint256 costPerCall
    ) external onlyOwner {
        require(!serviceProviders[provider].isRegistered, "Provider already registered");
        
        serviceProviders[provider] = ServiceProvider({
            apiEndpoint: apiEndpoint,
            costPerCall: costPerCall,
            reputationScore: 100, // Start with neutral reputation
            isRegistered: true,
            isActive: true,
            totalPayments: 0
        });
        
        totalProviders++;
        emit ServiceProviderRegistered(provider, apiEndpoint, costPerCall);
    }

    /**
     * Update service provider status
     */
    function updateProviderStatus(address provider, bool isActive) external onlyOwner {
        require(serviceProviders[provider].isRegistered, "Provider not registered");
        serviceProviders[provider].isActive = isActive;
    }

    /**
     * Add/remove authorized agents
     */
    function setAuthorizedAgent(address agent, bool authorized) external onlyOwner {
        authorizedAgents[agent] = authorized;
    }

    /**
     * Emergency stop functionality
     */
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
        emit EmergencyStopToggled(emergencyStop);
    }

    /**
     * Get user's current budget status
     */
    function getBudgetStatus(address user) external view returns (
        uint256 dailyLimit,
        uint256 monthlyLimit,
        uint256 dailySpent,
        uint256 monthlySpent,
        uint256 dailyRemaining,
        uint256 monthlyRemaining
    ) {
        Budget memory budget = budgets[user];
        
        // Simulate budget reset for view function
        uint256 tempDailySpent = budget.dailySpent;
        uint256 tempMonthlySpent = budget.monthlySpent;
        
        if (block.timestamp >= budget.lastDayReset + 1 days) {
            tempDailySpent = 0;
        }
        if (block.timestamp >= budget.lastMonthReset + 30 days) {
            tempMonthlySpent = 0;
        }

        return (
            budget.dailyLimit,
            budget.monthlyLimit,
            tempDailySpent,
            tempMonthlySpent,
            budget.dailyLimit > tempDailySpent ? budget.dailyLimit - tempDailySpent : 0,
            budget.monthlyLimit > tempMonthlySpent ? budget.monthlyLimit - tempMonthlySpent : 0
        );
    }

    /**
     * Get payment history for a user
     */
    function getUserPaymentHistory(address user) external view returns (uint256[] memory) {
        return userPaymentHistory[user];
    }

    /**
     * Get service provider details
     */
    function getServiceProvider(address provider) external view returns (
        string memory apiEndpoint,
        uint256 costPerCall,
        uint256 reputationScore,
        bool isActive,
        uint256 providerPayments
    ) {
        ServiceProvider memory sp = serviceProviders[provider];
        return (sp.apiEndpoint, sp.costPerCall, sp.reputationScore, sp.isActive, sp.totalPayments);
    }

    /**
     * Internal function to reset budget counters if time periods have passed
     */
    function _resetBudgetIfNeeded(Budget storage budget) internal {
        if (block.timestamp >= budget.lastDayReset + 1 days) {
            budget.dailySpent = 0;
            budget.lastDayReset = block.timestamp;
        }
        
        if (block.timestamp >= budget.lastMonthReset + 30 days) {
            budget.monthlySpent = 0;
            budget.lastMonthReset = block.timestamp;
        }
    }

    /**
     * Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * Receive ETH
     */
    receive() external payable {}
}
