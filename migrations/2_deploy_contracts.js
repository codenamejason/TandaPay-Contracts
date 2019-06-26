require("dotenv").config;
const DaiContract = artifacts.require("./DaiContract");
const TandaPayService = artifacts.require("./TandaPayService");

/**
 * @author blOX Consulting LLC
 * @date 6.25.19
 * Truffle migration for Dai contract: kovan address environment variable or new ERC20Mintable on testrpc
 * Truffle migration for TandaPayService w/ prerequisite constructor arg of Dai Contract's address
 */
module.exports = async (deployer, network, accounts) => {
    if(network == "kovan") {
        await DaiContract.at(process.env.DAI_KOVAN);
    } else {
        await deployer.deploy(DaiContract);
    }
    let Dai = await DaiContract.deployed();
    await deployer.deploy(TandaPayService, Dai.address);
}