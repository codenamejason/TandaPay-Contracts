require("dotenv").config;
const DaiContract = artifacts.require("./DaiContract");
const TandaPayService = artifacts.require("./TandaPayService");

module.exports = async (deployer, network, accounts) => {
    if(network == "kovan") {
        await DaiContract.at(process.env.DAI_KOVAN);
    } else {
        await deployer.deploy(DaiContract);
    }
    let Dai = await DaiContract.deployed();
    await deployer.deploy(TandaPayService, Dai.address);
}