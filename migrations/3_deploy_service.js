require("dotenv").config;
const DaiContract = artifacts.require("./DaiContract");
const TandaPayService = artifacts.require("./TandaPayService");
const TestService = artifacts.require("./TestService");

/**
 * @author blOX Consulting LLC
 * @date 7.14.19
 * Truffle migration for TandaPayService
 * Deploys a TandaPayService or TestService depending on the network
 */
module.exports = async (deployer, network, accounts) => {
    if(network == 'development') {
        let address = (await DaiContract.deployed()).address;
        //await deployer.deploy(TandaPayService, address);
        await deployer.deploy(TestService, address);
    } else if (network == 'kovan') 
       await deployer.deploy(TestService, process.env.DAI_KOVAN, {overwrite: false}); 
    else if (network == 'ropsten') 
        await deployer.deploy(TestService, process.env.DAI_ROPSTEN);
    else if (network == 'rinkeby')
        await deployer.deploy(TestService, process.env.DAI_RINKEBY);
    else 
        await deployer.deploy(TandaPayService, process.env.DAI_MAINNET);
}

