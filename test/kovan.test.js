/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test suite for TandaPay v0.2.0
 **/

const Simulator = require('./helpers/simulation.js');
const IERC20 = artifacts.require("./IERC20");
const TestService = artifacts.require("./TestService");
const TestGroup = artifacts.require("./TestGroup");
const { DaiDriver, ServiceDriver, GroupDriver } = require("./helpers/driver.js");
require('chai').use(require('chai-as-promised')).should();

contract("TandaPay Kovan Gas Limit Tests", async (accounts) => {
    // account 0 = administrator
    // account 1 = duster bank
    // account 2-9 = secretaries
    // account 10-59 = policyholders
    // account 60-99 = revert dummies
    let Dai, TandaPayService, Group;
    let policyholders, subgroups;
    let admin = accounts[1];
    let secretary = accounts[2];
    let premium = web3.utils.toBN(15);
    let gasLimit = 1000000;
    before(async () => {
        admin = accounts[0];
        policyholders = Simulator.makePolicyholders(accounts);
        subgroups = Simulator.makeSubgroups();
        Dai = await IERC20.at(process.env.DAI_KOVAN);
        TandaPayService = await TestService.deployed();
        Group = ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
    });
    describe('TandaPayService Gas Limit Checks', async () => {
        it('addAdmin() <= 1,000,000 gas', async () => {
            let tx = await ServiceDriver.addAdmin(TandaPayService, policyholders[0], admin);
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('removeAdmin() <= 1,000,000 gas', async () => {
            let tx = await ServiceDriver.removeAdmin(TandaPayService, policyholders[0], admin);
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('removeSecretary() <= 1,000,000 gas', async () => {
            console.log("Group: ", Group);
            let tx = await ServiceDriver.removeSecretary(TandaPayService, Group, admin);
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('installSecretary() <= 1,000,000 gas', async () => {
            let tx = await ServiceDriver.installSecretary(TandaPayService, Group, secretary, admin);
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
    });
    it('Test', async () => {

    });
    /* it('RBA', async () => { RBA(accounts) });
    it('Time', async () => { Time(accounts) });
    //it('Functional', async () => { Functional(accounts) });
    it('Gas Limit', async () => { Gas(accounts) }); */
});