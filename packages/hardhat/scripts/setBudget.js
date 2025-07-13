const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Setting up budget for AI agent...");

  // Get the deployed contract address from environment or default
  const contractAddress = process.env.PAYMENT_CONTROLLER_ADDRESS || "0x7F2f8C2B0c231E88e9428b2D988b88b351C2a2bc";
  
  if (!contractAddress) {
    throw new Error("Please set PAYMENT_CONTROLLER_ADDRESS environment variable");
  }

  // Get contract instance
  const PaymentController = await ethers.getContractFactory("PaymentController");
  const paymentController = PaymentController.attach(contractAddress);

  // Get signer (wallet)
  const [signer] = await ethers.getSigners();
  console.log("📱 Using wallet:", signer.address);

  // Budget configuration for testing
  const dailyLimit = ethers.parseEther("0.01");    // 0.01 ETH per day
  const monthlyLimit = ethers.parseEther("0.1");   // 0.1 ETH per month  
  const emergencyThreshold = ethers.parseEther("0.005"); // 0.005 ETH emergency threshold

  console.log("💰 Setting budget limits:");
  console.log(`   Daily: ${ethers.formatEther(dailyLimit)} ETH`);
  console.log(`   Monthly: ${ethers.formatEther(monthlyLimit)} ETH`);
  console.log(`   Emergency: ${ethers.formatEther(emergencyThreshold)} ETH`);

  try {
    // Check current budget first
    console.log("\n📊 Checking current budget...");
    const currentBudget = await paymentController.budgets(signer.address);
    console.log("Current daily limit:", ethers.formatEther(currentBudget.dailyLimit));
    console.log("Current monthly limit:", ethers.formatEther(currentBudget.monthlyLimit));
    console.log("Daily spent:", ethers.formatEther(currentBudget.dailySpent));
    console.log("Monthly spent:", ethers.formatEther(currentBudget.monthlySpent));

    // Set the budget
    console.log("\n💸 Setting new budget...");
    const tx = await paymentController.setBudget(
      dailyLimit,
      monthlyLimit,
      emergencyThreshold
    );

    console.log("📝 Transaction hash:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Budget set successfully!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());

    // Verify the new budget
    console.log("\n🔍 Verifying new budget...");
    const newBudget = await paymentController.budgets(signer.address);
    console.log("✅ New daily limit:", ethers.formatEther(newBudget.dailyLimit));
    console.log("✅ New monthly limit:", ethers.formatEther(newBudget.monthlyLimit));
    console.log("✅ Emergency threshold:", ethers.formatEther(newBudget.emergencyThreshold));
    console.log("✅ Budget active:", newBudget.isActive);
    
    // Calculate remaining budget
    const dailyRemaining = newBudget.dailyLimit - newBudget.dailySpent;
    const monthlyRemaining = newBudget.monthlyLimit - newBudget.monthlySpent;
    
    console.log("\n💰 Available budget:");
    console.log("📅 Daily remaining:", ethers.formatEther(dailyRemaining), "ETH");
    console.log("📆 Monthly remaining:", ethers.formatEther(monthlyRemaining), "ETH");

    console.log("\n🎉 Budget setup complete! The AI agent can now process payments.");

  } catch (error) {
    console.error("❌ Failed to set budget:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
