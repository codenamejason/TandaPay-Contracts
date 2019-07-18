require("dotenv").config;
const DaiContract = artifacts.require("./DaiContract");
/**
 * @author blOX Consulting LLC
 * @date 7.15.19
 * Truffle migration for Dai contract: if the network is development, deploy a DaiContract
 */
module.exports = async (deployer, network) => {
    if(network == 'development')
        await deployer.deploy(DaiContract);
}