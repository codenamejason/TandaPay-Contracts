require('dotenv').config();
const HDWalletProvider = require("truffle-hdwallet-provider");

/**
 * @author blOX Consulting LLC
 * @date 6.18.19
 * Configuration for truffle deployment of TandaPay smart contracts
 */
module.exports = {

  networks: {
    development: {
      provider: () => { return new HDWalletProvider(process.env.MNEMONIC, "http://127.0.0.1:8545", 0, 80) },
      network_id: "*",
      gasLimit: 7000000
    },
    kovan: {
      provider: () => { return new HDWalletProvider(process.env.MNEMONIC, process.env.KOVAN) },
      network_id: 42,
      confirmations: 2,
    }
  },

  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      verion: "0.5.9",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
