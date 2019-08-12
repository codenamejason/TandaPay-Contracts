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
      provider: () => { return new HDWalletProvider(process.env.MNEMONIC, "http://127.0.0.1:8545", 0, 100) },
      network_id: "*",
      gasLimit: 7000000
    }  
  },

  mocha: {
    //timeout: 100000
  },

  compilers: {
    solc: {
      verion: "0.5.10",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
