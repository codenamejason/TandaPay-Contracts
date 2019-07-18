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
    } else if (network == 'kovan') {
       /*  console.log('flag1');
        let service = await TestService.deployed();
        console.log('flag2');
        console.log(Object.keys(service));
        let count = await service.getCount({from: accounts[0]});
        console.log('flag3');
        console.log("Count: ", count.toString());
        await deployer.deploy(TestService, process.env.DAI_KOVAN); */
    } else if (network == 'ropsten') 
        await deployer.deploy(TestService, process.env.DAI_ROPSTEN);
    else if (network == 'rinkeby')
        await deployer.deploy(TestService, process.env.DAI_RINKEBY);
    else 
        await deployer.deploy(TandaPayService, process.env.DAI_MAINNET);
}

