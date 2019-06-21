/**
 * @author blOX Consulting LLC
 * @date June 20, 2019
 * Main test script for TandaPayServices
 **/
const TandaPayServiceContract = artifacts.require('./TandaPayService');
const GroupContract = artifacts.require('./Group');
const DaiContract = artifacts.require('./DaiContract');
const expect = require('chai');
const Simulator = require('./helpers/simulation');
const { DaiDriver, ServiceDriver, GroupDriver } = require("./helpers/driver.js");

contract("TandaPayService", async (accounts) => {
    let premium = 20;
    let stipend = web3.utils.toBN(100);
    let Dai, TandaPayService, Group;
    let TandaAccounts = Simulator.makeAccounts();  
    let subgroups = Simulator.makeSubgroups(TandaAccounts);
    

    let admin = accounts[0];
    let secretary = TandaAccounts[0];

    before(async () => {
        await Simulator.unlockAll(TandaAccounts);
        web3.eth.getAccounts(console.log);
        Dai = await DaiContract.new();
        await DaiDriver.giveDai(TandaAccounts, Dai, stipend, admin);
    });

    beforeEach(async () => {
        TandaPayService = await TandaPayServiceContract.new(Dai.address);
        Group = await ServiceDriver.createGroup(TandaPayService, TandaAccounts[0], premium, admin);
    });

    it('Dai Transfer', async () => {
        let stipend_empirical = await DaiDriver.getDaiBalances(TandaAccounts, Dai);
        assert.equal(stipend.toNumber(), stipend_empirical[1].toNumber());
    });

    it('Add Policyholders', async () => {
        //for(let i = 1; i <= 50; i++) {
        let addPolicyholderTX = await GroupDriver.addPolicyholder(Group, TandaAccounts[1], subgroups[0], secretary);
        console.log('flag2', addPolicyholderTX);
        let policyholder_empirical = await GroupDriver.addedPolicyholderAddress(addPolicyholderTX);
        console.log('flag3', policyholder_empirical);
        //assert.equal(TandaAccounts[i], policyholder_empirical);
        //}
        
    });
    
});