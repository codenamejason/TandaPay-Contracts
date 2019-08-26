require("dotenv").config;
const DaiContract = artifacts.require("./DaiContract");

/**
 * @author blOX Consulting LLC
 * @date 8.26.19
 * Truffle migration TestGroup
 */
module.exports = async (deployer) => {
    await deployer.deploy(DaiContract);
}