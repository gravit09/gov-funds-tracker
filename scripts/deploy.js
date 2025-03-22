const hre = require("hardhat");

async function main() {
  console.log("Deploying SimplifiedSpendingRegistry...");

  const SimplifiedSpendingRegistry = await hre.ethers.getContractFactory(
    "SimplifiedSpendingRegistry"
  );
  const registry = await SimplifiedSpendingRegistry.deploy();

  // Wait for deployment transaction to be mined
  await registry.waitForDeployment();

  console.log(
    "SimplifiedSpendingRegistry deployed to:",
    await registry.getAddress()
  );
  console.log(
    "Central Government address:",
    await registry.centralGovernment()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
