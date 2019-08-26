require("dotenv").config;
const DaiContract = artifacts.require("./DaiContract");
const ServiceContract = artifacts.require("./Service");

/**
 * @author blOX Consulting LLC
 * @date 8.26.19
 * Truffle migration TestGroup
 */
module.exports = async (deployer) => {
    let Dai = await DaiContract.deployed();
    await deployer.deploy(ServiceContract, Dai.address);
}