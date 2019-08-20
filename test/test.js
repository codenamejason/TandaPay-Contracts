/**
 * @author blOX Consulting LLC
 * Date: 08.13.2019
 * Main test script for TandaPay v0.2.0
 * Function Unit Tests
 **/

const DaiContract = artifacts.require('./DaiContract');
const GroupContract = artifacts.require('./Group');
const ServiceContract = artifacts.require('./Service');
const Simulation = require("./helpers/Simulation.js");

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();
contract("TandaPay Test Suite", async (accounts) => {
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
    });
    describe('Unit Tests', async () => {
        describe('Service Unit Tests', async () => {
            let deployedAddress;
            describe('Service Test 1: addAdmin()', async () => {
                let preIsAdmin, postIsAdmin;
                before(async () => {
                    preIsAdmin = await Service.isAdmin(secretary);
                    await Service.addAdmin(secretary, {from: admin});
                    postIsAdmin = await Service.isAdmin(secretary);
                });
                it('Address is not administrator before being added', () => {
                    preIsAdmin.should.be.false;
                });
                it('Address is administrator after being added', () => {
                    postIsAdmin.should.be.true;
                });
            });
            describe('Service Test 2: removeAdmin()', async () => {
                let preIsAdmin, postIsAdmin;
                before(async () => {
                    preIsAdmin = await Service.isAdmin(secretary);
                    await Service.removeAdmin(secretary, {from: admin});
                    postIsAdmin = await Service.isAdmin(secretary);
                });
                it('Address is administrator before being removed', () => {
                    preIsAdmin.should.be.true;
                });
                it('Address is not administrator after being removed', () => {
                    postIsAdmin.should.be.false;
                });
            });
            describe('Service Test 3: createGroup()', async () => {
                let preCount, postCount;
                let expectedIndex, expectedAddress;
                let groupIndex, groupAddress;
                before(async () => {
                    preCount = await Service.getGroupCount();
                    let tx = await Service.createGroup(serviceSecretary, volume, payout, {from: admin});
                    postCount = await Service.getGroupCount();
                    groupIndex = await Service.isSecretary(serviceSecretary);
                    groupAddress = await Service.getGroup(groupIndex);
                    expectedAddress = await Simulation.groupAddress(tx);
                    expectedIndex = new web3.utils.BN(2);
                    deployedAddress = groupAddress;
                });
                it('Group count is N before creating new group',  () => {
                    let expectedCount = new web3.utils.BN(1);
                    preCount.should.be.a.bignumber.that.equal(expectedCount);
                });
                it('Group count is (N + 1) after creating new group', () => {
                    let expectedCount = new web3.utils.BN(2);
                    postCount.should.be.a.bignumber.that.equal(expectedCount);
                });
                it('Group index of (N + 1) can retrieve the address of the new group', () => {
                    groupAddress.should.equal(expectedAddress);
                });
                it('Secretary address can be parsed to Group index', () => {
                    groupIndex.should.be.a.bignumber.that.equal(expectedIndex);
                });
            });
            describe('Service Test 4: loan()', async () => {
                let deployedGroup, deployedSecretary;
                let preLoaned, postLoaned;
                let preSecretaryBalance, postSecretaryBalance;
                let preServiceBalance, postServiceBalance;
                let debt, months;
                let endowment, expectedMonths;
                before(async () => {
                    expectedMonths = new web3.utils.BN(6);
                    deployedGroup = await GroupContract.at(deployedAddress);
                    deployedSecretary = await deployedGroup.getSecretary();
                    endowment = await deployedGroup.calculateEndowment(expectedMonths);
                    await Dai.mint(Service.address, endowment, {from: admin});
                    preLoaned = await deployedGroup.loaned();
                    preSecretaryBalance = await Dai.balanceOf(deployedSecretary);
                    preServiceBalance = await Dai.balanceOf(Service.address);
                    await Service.loan(deployedAddress, expectedMonths);
                    postLoaned = await deployedGroup.loaned();
                    postSecretaryBalance = await Dai.balanceOf(deployedSecretary);
                    postServiceBalance = await Dai.balanceOf(Service.address);
                    let loanState = await deployedGroup.viewLoan();
                    debt = loanState._debt;
                    months = loanState._months;
                });
                it('Group is not loaned before calling loan', () => {
                    preLoaned.should.be.false;
                });
                it('Group is loaned after calling loan', () => {
                    postLoaned.should.be.true;
                });
                it('Endowment loans { 2220 Dai x 6 Months } on { 3 Claims x $500 Group }', () => {
                    debt.should.be.bignumber.that.equal(endowment);
                    months.should.be.bignumber.that.equal(expectedMonths);
                });
                it('Service lost 2220 Dai as underwriter; Secretary gained 2220 Dai as recipient', () => {
                    let secretaryDifference = postSecretaryBalance.sub(preSecretaryBalance);
                    secretaryDifference.should.be.bignumber.that.equal(endowment);
                    let serviceDifference = preServiceBalance.sub(postServiceBalance);
                    serviceDifference.should.be.bignumber.that.equal(endowment);
                });
            });
            describe('Service Test 5: remitGroup()', async () => {
                let deployedGroup, deployedSecretary;
                let prePot, postPot;
                let prePolicyholderBalances, postPolicyholderBalances;
                let activePeriod, remittedPeriod;
                let subperiod;
                before(async () => {
                    deployedGroup = await GroupContract.at(deployedAddress);
                    deployedSecretary = await deployedGroup.getSecretary();
                    await Simulation.simAddPolicyholder(deployedGroup, policyholders, subgroups, deployedSecretary);
                    await deployedGroup.startGroup({from: deployedSecretary});
                    let period = await deployedGroup.activePeriod();
                    await Simulation.simMakePayment(deployedGroup, Dai, period, policyholders);
                    prePolicyholderBalances = await Simulation.simBalances(Dai, policyholders);
                    prePot = await deployedGroup.viewPool(period);
                    await Simulation.passDays(3);
                    await deployedGroup.submitClaim(period, policyholders[0], {from: deployedSecretary});
                    await Simulation.passDays(33);
                    await Service.remitGroup(deployedAddress, {from: admin});
                    subperiod = await deployedGroup.getSubperiod(period);
                    remittedPeriod = period;
                    activePeriod = await deployedGroup.activePeriod();
                    postPolicyholderBalances = await Simulation.simBalances(Dai, policyholders);
                    postPot = await deployedGroup.viewPool(period);
                });
                it('Period state is subperiod.ENDED', () => {
                    let expectedState = new web3.utils.BN(4);
                    subperiod.should.be.a.bignumber.that.equal(expectedState);
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
                it('Policyholders recieve 20 Dai (Premium) + 7 Dai (Overpayment) as rebate', () => {
                    let expectedDifference = new web3.utils.BN(27);
                    let differences = [];
                    for(let i = 0; i < policyholders.length; i++) {
                        let pre = prePolicyholderBalances[i];
                        let post = postPolicyholderBalances[i];
                        differences[i] = post.sub(pre);
                    }
                    for(let i = 1; i < differences.length; i++)
                        differences[i].should.be.a.bignumber.that.equal(expectedDifference);
                });
            });
        });
        describe('Group Unit Tests', async () => {
            describe('Group Test 1: addPolicyholder()', async () => {
                before(async () => {

                });
                it('Address is not policyholder before added', () => {

                });
                it('Subgroup 1 has size of 0 before added', () => {

                });
                it('Group has size of 0 before added', () => {

                });
                it('Address is policyholder after added', () => {

                });
                it('Subgroup 1 has size of 1 before added', () => {

                });
                it('Policyholder address can be parsed to subgroup index 1 after added', () => {

                });
                it('Group has size of 1 after added', () => {

                });
            });
            describe('Group Test 2: changeSubgroup()', async () => {
                before(async () => {
                    
                });
                it('Address parsed to subgroup index 1 before changed', () => {

                });
                it('Subgroup 1 has size of 1 before changed', () => {

                });
                it('Subgroup 2 has size of 0 before changed', () => {

                });
                it('Address parsed to subgroup index 2 after changed', () => {

                });
                it('Subgroup 1 has size of 0 after changed', () => {

                });
                it('Subgroup 2 has size of 1 after changed', () => {

                });
            });
            describe('Group Test 3: removePolicyholder()', async () => {
                before(async () => {

                });
                it('Address is policyholder before removed', () => {

                });
                it('Subgroup 2 has size of 1 before removed', () => {

                });
                it('Address is not policyholder after removed', () => {

                });
                it('Subgroup 2 has size of 0 after removed', () => {

                });
            });
            describe('Group Test 4: makeLoan()', async () => {
                before(async () => {

                });
                it('Group is not loaned before loaned', () => {

                });
                it('Group debt and months to repay are 0 before loaned', () => {

                });
                it('Group is loaned after loaned', () => {

                });
                it('Group debt and months to repay are non-zero after loaned', () => {

                });
            });
            describe('Group Test 5: withdraw()', async () => {
                before(async () => {
                    
                });
                it('Contract is liquid before withdraw', () => {

                });
                it('Secretary has X Dai before withdraw', () => {

                });
                it('Contract is not liquid after withdraw', () => {

                });
                it('Secretary has (X + Withdrawn) Dai after withdraw', () => {

                });
            });
            describe('Group Test 6: startGroup()', async () => {
                before(async () => {

                });
                it('Group period state is subperiod.LOBBY before started', () => {

                });
                it('Group period is N before started', () => {

                });
                it('Group period state is subperiod.PRE after started', () => {

                });
                it('Group period is (N + 1) after started', () => {

                });
                it('Group flagged to start a new period when last is remitted', () => {

                });
            });
            describe('Group Test 7: stopGroup()', async () => {
                before(async () => {

                });
                it('Group period state is subperiod.ACTIVE before stopped', () => {

                });
                it('Group flagged to start a new period before stopped', () => {

                });
                it('Group is flagged to not start any new periods after stopped', () => {

                });
                it('Active Group period state eventually returns to subperiod.LOBBY after stopped', () => {

                });
            });
            describe('Group Test 8: endPeriod()', async () => {
                before(async () => {

                });
                it('Group stored period is N before ended', () => {

                });
                it('Group months to repay is M before ended', () => {

                });
                it('Group stored period is (N + 1) after ended', () => {

                });
                it('Group months to repay is (M - 1) after ended', () => {

                });
            });
            describe('Group Test 9: makePayment()', async () => {
                before(async () => {

                });
                it('Group period Dai pot is N before payment', () => {

                });
                it('Policyholder Dai balance is M before payment', () => {

                });
                it('Period participants index is O before payment', () => {

                });
                it('Servie Dai balance is P before loan payment', () => {

                });
                it('Policyholder is not a period participant before payment', () => {

                });
                it('Group period Dai pot is (N + payment) after payment', () => {

                });
                it('Policyholder Dai balance is (M - payment) after payment', () => {

                });
                it('Period participants index is (O + 1) after payment', () => {

                });
                it('Service Dai balance is (P + loan payment) after payment', () => {

                });
                it('Policyholder maps to period participant index after payment', () => {

                }); 
            });
            describe('Group Test 10: submitClaim()', async () => {
                before(async () => {

                });
                it('Group period claim index is N before submitted', () => {

                });
                it('Address is not claimant before submitted', () => {

                });
                it('Group period claim index is (N + 1) after submitted', () => {

                });
                it('Address maps to claim index after submitted', () => {

                });
            });
            describe('Group Test 11: defect()', async () => {
                before(async () => {

                });
                it('Participant index is N before defection', () => {

                });
                it('Address is period participant before defection', () => {

                });
                it('Defector subgroup has period defection count of 1 before defection', () => {

                });
                it('Subgroup is not period toxic subgroup before defection', () => {

                });
                it('Period Dai pot is M before defection', () => {

                });
                it('Defector address has balance of X Dai before defection', () => {

                });
                it('Participant index is (N - 1) after defection', () => {

                });
                it('Address is not period participant after defection', () => {

                });
                it('Defector subgroup has period defection count of 2 after defection', () => {

                });
                it('Subgroup is period toxic subgroup after defection', () => {

                });
                it('Period Dai pot is (M - Premium) after defection', () => {

                });
                it('Defector address has balance of (X + Premium) after defection', () => {

                });
                it('Claim made in toxic subgroup is not paid out at remitGroup', () => {

                });
            });
        });
    });
});
