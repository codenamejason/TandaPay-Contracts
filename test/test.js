/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test suite for TandaPay v0.2.0
 **/

const Simulator = require('./helpers/simulation.js');
const { DaiDriver } = require("./helpers/driver.js");
const { RBA, Time, Functional, Gas } = require("./helpers/subtests.js");
const TXBuilder = require('./helpers/txBuilder.js');

contract("TandaPay Local Demo", async (accounts) => {
    // account 0 = administrator
    // account 1 = duster bank
    // account 2-9 = secretaries
    // account 10-59 = policyholders
    // account 60-99 = revert dummies
    let Dai;
    let Dai2;
    let admin, policyholders;
    let failAccount;
    before(async () => {
        failAccount = await web3.eth.accounts.create();
        let quantity = web3.utils.toWei('10', 'ether');
        let failAccountBalance = await web3.eth.getBalance(failAccount.address);
        if(failAccountBalance < web3.utils.toWei('1', 'ether'))
            await web3.eth.sendTransaction({from: accounts[1], to: failAccount.address, value: quantity});
        admin = accounts[0];
        policyholders = Simulator.makePolicyholders(accounts);
        Dai = await DaiDriver.deploy();
        Dai2 = await new web3.eth.Contract(Dai.abi, Dai.address);
        await Simulator.dust(accounts);
        await Simulator.mintPolicyholders(Dai, policyholders, admin);
        let encodedTX = Dai2.methods.mint(failAccount.address, 10).encodeABI();
        let tx = await TXBuilder.revertable(failAccount, Dai2._address, encodedTX);
        console.log('Built tx: ', tx);
    });
    it('test', async () => {

    });

    /* it('RBA', async () => { RBA(accounts) });
    it('Time', async () => { Time(accounts) });
    //it('Functional', async () => { Functional(accounts) });
    it('Gas Limit', async () => { Gas(accounts) }); */
});