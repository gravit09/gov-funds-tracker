require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      // Increase the contract size limit
      evmVersion: "london"
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    }
  },
  paths: {
    artifacts: "./src/artifacts",
  },
}; 