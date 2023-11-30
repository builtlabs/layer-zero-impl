require("dotenv").config();

require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

const { ALCHEMY_MAINNET_KEY, ETHERSCAN_API_KEY, POLYGONSCAN_API_KEY, COINMARKETCAP_API_KEY } = process.env;

function accounts() {
  if (process.env.MNEMONIC) return { mnemonic: process.env.MNEMONIC };

  if (process.env.PRIVATE_KEY) {
    return [`0x${process.env.PRIVATE_KEY}`];
  }

  if (process.env.PRIVATE_KEY_DEV) {
    return [`0x${process.env.PRIVATE_KEY_DEV}`];
  }

  throw new Error("No private key or mnemonic set in .env file");
}

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.22",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 100000000,
  },
  etherscan: {
    apiKey: {
      mainnet: `${ETHERSCAN_API_KEY}`,
      goerli: `${ETHERSCAN_API_KEY}`,
      sepolia: `${ETHERSCAN_API_KEY}`,
      polygon: `${POLYGONSCAN_API_KEY}`,
      polygonMumbai: `${POLYGONSCAN_API_KEY}`,
    },
  },
  gasReporter: {
    coinmarketcap: `${COINMARKETCAP_API_KEY}`,
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_MAINNET_KEY}`,
      },
    },

    // mainnets
    ethereum: {
      url: "https://ethereum.publicnode.com",
      chainId: 1,
      accounts: accounts(),
    },
    bsc: {
      url: "https://bsc.publicnode.com",
      chainId: 56,
      accounts: accounts(),
    },
    avalanche: {
      url: "https://avalanche-c-chain.publicnode.com",
      chainId: 43114,
      accounts: accounts(),
    },
    polygon: {
      url: "https://polygon-bor.publicnode.com",
      chainId: 137,
      accounts: accounts(),
    },
    arbitrum: {
      url: `https://arbitrum-one.publicnode.com`,
      chainId: 42161,
      accounts: accounts(),
    },
    optimism: {
      url: `https://optimism.publicnode.com`,
      chainId: 10,
      accounts: accounts(),
    },

    // testnets
    goerli: {
      url: "https://ethereum-goerli.publicnode.com",
      chainId: 5,
      accounts: accounts(),
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/CPTrLus74Ky3V5Gk9OikO6PMKqxlyTpN",
      chainId: 11155111,
      accounts: accounts(),
    },
    "bsc-testnet": {
      url: "https://bsc-testnet.publicnode.com",
      chainId: 97,
      accounts: accounts(),
    },
    fuji: {
      url: "https://avalanche-fuji-c-chain.publicnode.com",
      chainId: 43113,
      accounts: accounts(),
    },
    mumbai: {
      url: "https://polygon-mumbai-bor.publicnode.com",
      chainId: 80001,
      accounts: accounts(),
    },
    "arbitrum-goerli": {
      url: `https://arbitrum-goerli.publicnode.com`,
      chainId: 421613,
      accounts: accounts(),
    },
    "optimism-goerli": {
      url: `https://optimism-goerli.publicnode.com`,
      chainId: 420,
      accounts: accounts(),
    },
  },
};
