/**
 * @author blOX Consulting LLC
 * Date: 08.26.2019
 * Main test script for TandaPay v0.2.0
 * Function Unit Tests
 **/

const DaiContract = artifacts.require('./DaiContract');
const GroupContract = artifacts.require('./Group');
const ServiceContract = artifacts.require('./Service');
const LiquidityContract = artifacts.require('./LiquidityLock');
const Simulation = require("./helpers/Simulation.js");

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();
contract("TandaPay Defections Test", async (accounts) => {
    // account 0 = admin
    // account 1 = bank (funds policyholders)
    // account 2 = first secretary (main group)
    // account 3 = second secretary (service tests)
    // account 4 = third secretary (throwaway tests)
    // accounts [5-54] = policyholders
    let Dai, Service, Group;
    let bank, admin, secretary, policyholders;
    let subgroups;
    let volume, payout;
    
    
    let deployedAddress;
    let preCount, postCount;
    let expectedIndex, expectedAddress;
    let groupIndex, groupAddress;
    let premium;
    let preParticipantIndex, postParticipantIndex;
    let increment = new web3.utils.BN(1);
    zero = new web3.utils.BN(0);

    before(async () => {
        admin = accounts[0];
        bank = accounts[1];
        secretary = accounts[2];
        serviceSecretary = accounts[3];
        policyholders = Simulation.makePolicyholders(accounts, 4);
        subgroups = Simulation.makeSubgroups();
        volume = 3;
        payout = 500;

        await Simulation.dust(policyholders, bank);
        Dai = await DaiContract.deployed();
        Service = await ServiceContract.deployed();
        GroupTX = await Service.createGroup(secretary, volume, payout, {from: admin});
        groupAddress = await Simulation.groupAddress(GroupTX);
        Group = await GroupContract.at(groupAddress);
        await Simulation.mintAccounts(Dai, 1000, policyholders, admin);

        deployedGroup = await GroupContract.at(groupAddress);
        deployedSecretary = await deployedGroup.getSecretary();
        await Simulation.simAddPolicyholder(deployedGroup, policyholders, subgroups, deployedSecretary);
        await deployedGroup.startGroup({ from: deployedSecretary });
        let period = await deployedGroup.activePeriod();
        await Simulation.simMakePayment(deployedGroup, Dai, period, policyholders);
        prePolicyholderBalances = await Simulation.simBalances(Dai, policyholders);
        prePot = await deployedGroup.viewPool(period);
        await Simulation.passDays(3);
        await deployedGroup.submitClaim(period, policyholders[0], { from: deployedSecretary });
        await Simulation.passDays(30);

        preParticipantIndex = await deployedGroup.activeIndex(period);
        participantCount = await deployedGroup.getSize();
        defectorPH = policyholders[1];
        preDefectionSubperiod = await deployedGroup.getSubperiod(period);
        preDefectorBalance = await Dai.balanceOf(defectorPH);
        preDaiPot = await deployedGroup.viewPool(period);
        let subgroup = await deployedGroup.isPolicyholder(defectorPH);
        preDefectionCount = await deployedGroup.getDefectionCount(period, subgroup);

        console.log("period: " + period);
        console.log("Subperiod: " +  preDefectionSubperiod);
        console.log("Group size: " + participantCount);
        console.log("preDaiPot: " + preDaiPot);

        await deployedGroup.defect(period, {from: defectorPH});
        postParticipantIndex = await deployedGroup.activeIndex(period);
        postClaimIndex = await deployedGroup.claimIndex(period);
        postDefectorBalance = await Dai.balanceOf(defectorPH);
        postDaiPot = await deployedGroup.viewPool(period);
        postDefectionCount = await deployedGroup.getDefectionCount(period, subgroup);
        
        await Simulation.passDays(3);
        await Service.remitGroup(groupAddress, { from: admin });
        postRemittanceSubperiod = await deployedGroup.getSubperiod(period);
        remittedPeriod = period;
        activePeriod = await deployedGroup.activePeriod();
        postPolicyholderBalances = await Simulation.simBalances(Dai, policyholders);
        postParticipantIndex = await deployedGroup.activeIndex(period);
        postPot = await deployedGroup.viewPool(period);
        premium = await Group.calculatePremium();
        subgroupSize = await Group.getSubgroupSize(subgroup);
        
        overpayment = await Group.calculateOverpayment(subgroupSize);
    });

    it('Defection occurs in subperiod state subperiod.POST', () => {
        let expectedSubperiod = new web3.utils.BN(3);
        preDefectionSubperiod.should.be.bignumber.that.equal(expectedSubperiod);
    });

    it('Period state is subperiod.ENDED after remittance', () => {
        let expectedState = new web3.utils.BN(4);
        postRemittanceSubperiod.should.be.a.bignumber.that.equal(expectedState);
    });
    it('Active period = 1 + remitted period', () => {
        activePeriod.should.be.a.bignumber.that.equal(remittedPeriod.add(new web3.utils.BN(1)));
    });
    it('Group period insurance pot empties from 1850 Dai to 0 Dai', () => {
        let expectedPre = new web3.utils.BN(1850);
        let expectedPost = new web3.utils.BN(0);
        prePot.should.be.a.bignumber.that.equal(expectedPre);
        postPot.should.be.a.bignumber.that.equal(expectedPost);
    });
    it('One (1) Claimant gains 500 Dai after Claim awarded + 27 Dai rebate', () => {
        let expectedDifference = new web3.utils.BN(527);
        let pre = prePolicyholderBalances[0];
        let post = postPolicyholderBalances[0];
        let difference = post.sub(pre);
        difference.should.be.a.bignumber.that.equal(expectedDifference);
    });
    it('Participant Index Decrements after defection', () => {
        preParticipantIndex.should.be.bignumber.that.equal(postParticipantIndex.add(increment));
    });
    it('Address can no longer be parsed to participant index after defection', async () => {
        let index = await deployedGroup.isParticipant(postRemittanceSubperiod, defectorPH);
        index.should.be.bignumber.that.equal(zero);
    });
    it('Period Dai pot has Premium+Overpayment Dai withdrawn after defection', () => {
        preDaiPot.should.be.bignumber.that.equal(postDaiPot.add(premium).add(overpayment));
    });
    it('Address has Period Dai deposited after defection', () => {
        preDefectorBalance.should.be.bignumber.that.equal(postDefectorBalance.sub(premium).sub(overpayment));
    });
    it('Subgroup defection count increments after defection', () => {
        preDefectionCount.should.be.bignumber.that.equal(postDefectionCount.sub(increment));
    });
  







});