import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the PaymentController contract for the Agentic Stablecoin system
 * Constructor arguments set to the deployer address as owner
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployPaymentController: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network reiTestnet`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("🚀 Deploying PaymentController contract...");
  console.log("📍 Deployer address:", deployer);
  console.log("🌐 Network:", hre.network.name);

  const paymentController = await deploy("PaymentController", {
    from: deployer,
    // Contract constructor arguments
    args: [deployer],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  console.log("✅ PaymentController deployed to:", paymentController.address);

  // Get the deployed contract to interact with it after deploying.
  const paymentControllerContract = await hre.ethers.getContract<Contract>("PaymentController", deployer);
  
  console.log("👑 Contract owner:", await paymentControllerContract.owner());
  console.log("🛡️ Emergency stop status:", await paymentControllerContract.emergencyStop());
  console.log("📊 Total payments:", await paymentControllerContract.totalPayments());
  console.log("🏪 Total providers:", await paymentControllerContract.totalProviders());
  
  // Register a demo service provider for testing
  console.log("📝 Registering demo service provider...");
  
  try {
    const demoProviderAddress = "0x1234567890123456789012345678901234567890"; // Demo address
    const tx = await paymentControllerContract.registerServiceProvider(
      demoProviderAddress,
      "https://api.demo-weather.com",
      1000000000000000 // 0.001 ETH per call
    );
    await tx.wait();
    console.log("✅ Demo service provider registered!");
  } catch (error) {
    console.log("ℹ️ Demo provider registration skipped (already exists or error)");
  }
};

export default deployPaymentController;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags PaymentController
deployPaymentController.tags = ["PaymentController"];
