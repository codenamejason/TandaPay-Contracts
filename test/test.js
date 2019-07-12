/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test suite for TandaPay v0.2.0
 **/

const Simulator = require('./helpers/simulation.js');
const { DaiDriver } = require("./helpers/driver.js");
const { RBA, Time, Functional, Gas } = require("./helpers/subtests.js");

contract("TandaPayService", async (accounts) => {
    // account 0 = administrator
    // account 1 = duster bank
    // account 2-9 = secretaries
    // account 10-59 = policyholders
    // account 60-99 = revert dummies
    let Dai;
    let admin, policyholders;
    
    before(async () => {
        admin = accounts[0];
        policyholders = Simulator.makePolicyholders(accounts);
        Dai = await DaiDriver.deploy();
        await Simulator.dust(accounts);
        await Simulator.mintPolicyholders(Dai, policyholders, admin);
    });

    it('RBA', async () => { RBA(accounts) });
    it('Time', async () => { Time(accounts) });
    //it('Functional', async () => { Functional(accounts) });
    it('Gas Limit', async () => { Gas(accounts) });
});