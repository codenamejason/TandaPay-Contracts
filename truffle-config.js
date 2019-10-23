require('dotenv').config();
const HDWalletProvider = require("truffle-hdwallet-provider");

/**
 * @author blOX Consulting LLC
 * @date 8.11.2019
 * Configuration for truffle deployment of TandaPay smart contracts
 */
module.exports = {

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    jack_dev: {
      provider: () => { return new HDWalletProvider(process.env.MNEMONIC, "http://127.0.0.1:8545", 0, 100) },
      network_id: "*",
      gasLimit: 7000000
    },
    rinkeby: {
      provider: () => { return new HDWalletProvider(process.env.MNEMONIC, process.env.API_RINKEBY,  0, 100) },
      network_id: 4,
      confirmations: 2,
    },
  },

  mocha: {
    //timeout: 100000
  },

  compilers: {
    solc: {
      verion: "0.5.2",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
