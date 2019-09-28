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
                let preIsPolicyholder, postIsPolicyholder;
                let preGroupCount, postGroupCount;
                let preSubgroupCount, postSubgroupCount;
                let increment;
                before(async () => {
                    increment = new web3.utils.BN(1);
                    preIsPolicyholder = await Group.isPolicyholder(policyholders[0]);
                    preGroupCount = await Group.getSize();
                    preSubgroupCount = await Group.getSubgroupSize(subgroups[0]);
                    await Group.addPolicyholder(policyholders[0], subgroups[0], {from: secretary});
                    postIsPolicyholder = await Group.isPolicyholder(policyholders[0]);
                    postGroupCount = await Group.getSize();
                    postSubgroupCount = await Group.getSubgroupSize(subgroups[0]);
                });
                it('Address is not policyholder before added', () => {
                    let expectedSubgroup = new web3.utils.BN(0);
                    preIsPolicyholder.should.be.bignumber.that.equal(expectedSubgroup);
                });
                it('Address is policyholder after added', () => {
                    let expectedSubgroup = new web3.utils.BN(subgroups[0]);
                    postIsPolicyholder.should.be.bignumber.that.equal(expectedSubgroup);
                });
                it('Subgroup size increments by 1', () => {
                    postSubgroupCount.should.be.bignumber.that.equal(preSubgroupCount.add(increment));
                });
                it('Group size increments by 1', () => {
                    postGroupCount.should.be.bignumber.that.equal(preGroupCount.add(increment));
                });
            });
            describe('Group Test 2: changeSubgroup()', async () => {
                let preSubgroup, postSubgroup;
                let preSubgroupSize, postSubgroupSize;
                let preNewSubgroupSize, postNewSubgroupSize;
                let increment;
                before(async () => {
                    increment = new web3.utils.BN(1);
                    preSubgroup = await Group.isPolicyholder(policyholders[0]);
                    preSubgroupSize = await Group.getSubgroupSize(preSubgroup);
                    preNewSubgroupSize = await Group.getSubgroupSize(preSubgroup.add(increment));
                    await Group.changeSubgroup(policyholders[0], preSubgroup.add(increment), {from: secretary});
                    postSubgroup = await Group.isPolicyholder(policyholders[0]);
                    postSubgroupSize = await Group.getSubgroupSize(preSubgroup);
                    postNewSubgroupSize = await Group.getSubgroupSize(postSubgroup);
                });
                it('Address parses to old subgroup before being changed', async () => {
                    preSubgroup.should.be.bignumber.that.not.equal(postSubgroup);
                });
                it('Address parses to new subgroup after being changed', async () => {
                    postSubgroup.should.be.bignumber.that.equal(preSubgroup.add(increment));
                });
                it('Old Subgroup Decrements size after being changed', async () =>  {
                    preSubgroupSize.should.be.bignumber.that.equal(postSubgroupSize.add(increment));
                });
                it('New Subgroup Increments size after being changed', async () => {
                    preNewSubgroupSize.should.be.bignumber.that.equal(postNewSubgroupSize.sub(increment));
                });
            });
            describe('Group Test 3: removePolicyholder()', async () => {
                let preIsPolicyholder, postIsPolicyholder;
                let preGroupCount, postGroupCount;
                let preSubgroupCount, postSubgroupCount;
                let increment;
                before(async () => {
                    increment = new web3.utils.BN(1);
                    preIsPolicyholder = await Group.isPolicyholder(policyholders[0]);
                    preGroupCount = await Group.getSize();
                    preSubgroupCount = await Group.getSubgroupSize(preIsPolicyholder);
                    await Group.removePolicyholder(policyholders[0], {from: secretary});
                    postIsPolicyholder = await Group.isPolicyholder(policyholders[0]);
                    postGroupCount = await Group.getSize();
                    postSubgroupCount = await Group.getSubgroupSize(preIsPolicyholder);
                });
                it('Address is policyholder before removed', () => {
                    let unexpectedSubgroup = new web3.utils.BN(0);
                    preIsPolicyholder.should.be.bignumber.that.not.equal(unexpectedSubgroup);
                });
                it('Address is not policyholder after removed', () => {
                    let expectedSubgroup = new web3.utils.BN(0);
                    postIsPolicyholder.should.be.bignumber.that.equal(expectedSubgroup);
                });
                it('Group Count Decrements after removed', () => {
                    preGroupCount.should.be.bignumber.that.equal(postGroupCount.add(increment));
                });
                it('Subgroup Count Decrements after removed', () => {
                    preSubgroupCount.should.be.bignumber.that.equal(postSubgroupCount.add(increment));
                });
            });
            describe('Group Test 4: makeLoan()', async () => {
                let preLoaned, postLoaned;
                let preLoanDebt, postLoanDebt;
                let preLoanMonths, postLoanMonths;
                let endowment, months;
                let zero;
                before(async () => {
                    zero = new web3.utils.BN(0);
                    preLoaned = await Group.loaned();
                    let preState = await Group.viewLoan();
                    preLoanDebt = preState._debt;
                    preLoanMonths = preState._months;
                    months = new web3.utils.BN(6);
                    endowment = await Group.calculateEndowment(months);
                    await Dai.mint(Service.address, endowment, {from: admin});
                    await Service.loan(Group.address, months);
                    postLoaned = await Group.loaned();
                    let postState = await Group.viewLoan();
                    postLoanDebt = postState._debt;
                    postLoanMonths = postState._months;
                });
                it('Group is not loaned before loaned', () => {
                    preLoaned.should.be.false;
                });
                it('Group Debt is 0 before loaned', () => {
                    preLoanDebt.should.be.bignumber.that.equal(zero);
                });
                it('Group Months to Repay is 0 before loaned', () => {
                    preLoanMonths.should.be.bignumber.that.equal(zero);
                });
                it('Group is loaned after loaned', () => {
                    postLoaned.should.be.true;
                });
                it('Group Debt reflects endowment after loaned', () => {
                    postLoanDebt.should.be.bignumber.that.equal(endowment);
                });
                it('Group Months to Repay is 6 after loaned', () => {
                    postLoanMonths.should.be.bignumber.that.equal(months);
                });
            });
            describe('Group Test 5: withdraw()', async () => {
                let LiquidLock;
                let deposit;
                let noLiquid, preLiquid, postLiquid;
                let preBalance, postBalance;
                before(async () => {
                    let liquidityAddress = await Group.getLiquidity();
                    LiquidLock = await LiquidityContract.at(liquidityAddress);
                    noLiquid = await LiquidLock.liquid();
                    deposit = new web3.utils.BN(1500);
                    await Dai.transfer(liquidityAddress, deposit, {from: secretary});
                    preBalance = await Dai.balanceOf(secretary);
                    preLiquid = await LiquidLock.liquid();
                    await Group.withdraw({from: secretary});
                    postBalance = await Dai.balanceOf(secretary);
                    postLiquid = await LiquidLock.liquid();
                });
                it('Contract is not liquid before Secretary deposits', () => {
                    noLiquid.should.be.false;
                });
                it('Contract is liquid before withdraw', () => {
                    preLiquid.should.be.true;
                });
                it('Contract is not liquid after withdraw', () => {
                    postLiquid.should.be.false;
                });
                it('Secretary is given Dai withdrawn from Liquidity Contract', () => {
                    preBalance.should.be.bignumber.that.equal(postBalance.sub(deposit));
                });
            });
            describe('Group Test 6: startGroup()', async () => {
                let preSubperiod, postSubperiod;
                let prePeriod, postPeriod;
                let preNext, postNext;
                before(async () => {
                    prePeriod = await Group.activePeriod();
                    preSubperiod = await Group.getSubperiod(prePeriod);
                    preNext = await Group.doNext();
                    await Simulation.simAddPolicyholder(Group, policyholders, subgroups, secretary);
                    await Group.startGroup({from: secretary});
                    postPeriod = await Group.activePeriod();
                    postSubperiod = await Group.getSubperiod(postPeriod);
                    postNext = await Group.doNext();
                });
                it('Group period state is subperiod.LOBBY before started', () => {
                    let expectedSubperiod = new web3.utils.BN(0);
                    preSubperiod.should.be.bignumber.that.equal(expectedSubperiod);
                });
                it('Group period is N before started', () => {
                    let expectedPeriod = new web3.utils.BN(0);
                    prePeriod.should.be.bignumber.that.equal(expectedPeriod);
                });
                it('Group not flagged to advance periods before started', () => {
                    preNext.should.be.false;
                });
                it('Group period state is subperiod.PRE after started', () => {
                    let expectedSubperiod = new web3.utils.BN(1);
                    postSubperiod.should.be.bignumber.that.equal(expectedSubperiod);
                });
                it('Group period is (N + 1) after started', () => {
                    let expectedPeriod = new web3.utils.BN(1);
                    postPeriod.should.be.bignumber.that.equal(expectedPeriod);
                });
                it('Group flagged to advance periods after started', () => {
                    postNext.should.be.true;
                });
            });
            describe('Group Test 7: stopGroup()', async () => {
                let preSubperiod, postSubperiod;
                let preNext, postNext;
                let preRemitPeriod, postRemitPeriod;
                before(async () => {
                    await Simulation.passDays(4);
                    preRemitPeriod = await Group.activePeriod();
                    preSubperiod = await Group.getSubperiod(preRemitPeriod);
                    preNext = await Group.doNext();
                    await Group.stopGroup({from: secretary});
                    postNext = await Group.doNext();
                    await Simulation.passDays(33);
                    await Service.remitGroup(Group.address);
                    postRemitPeriod = await Group.activePeriod();
                    postSubperiod = await Group.getSubperiod(postRemitPeriod);
                });
                it('Group period state is subperiod.ACTIVE before stopped', () => {
                    let expectedSubperiod = new web3.utils.BN(2);
                    preSubperiod.should.be.bignumber.that.equal(expectedSubperiod);
                });
                it('Group flagged to start a new period before stopped', () => {
                    preNext.should.be.true;
                });
                it('Group is flagged to not start any new periods after stopped', () => {
                    postNext.should.be.false;
                });
                it('Active Period Increments', () => {
                    let increment = new web3.utils.BN(1)
                    preRemitPeriod.should.be.bignumber.that.equal(postRemitPeriod.sub(increment));
                });
                it('Subperiod Stuck in Lobby', async () => {
                    let expectedPost = new web3.utils.BN(0);
                    postSubperiod.should.be.bignumber.that.equal(expectedPost);
                    await Simulation.passDays(100);
                    let period = await Group.activePeriod();
                    let empiricalSubperiod = await Group.getSubperiod(period);
                    empiricalSubperiod.should.be.bignumber.that.equal(expectedPost);
                });
            });
            describe('Group Test 8: makePayment()', async () => {
                let preServiceBalance, postServiceBalance;
                let prePolicyholderBalance, postPolicyholderBalance;
                let preDaiPot, postDaiPot;
                let preParticipants, postParticipants;
                let loanPayment, potPayment, totalPayment;
                let period;
                before(async () => {
                    await Group.startGroup({from: secretary});
                    period = await Group.activePeriod();
                    let subgroup = await Group.isPolicyholder(policyholders[0]);
                    let subgroupSize = await Group.getSubgroupSize(subgroup);
                    let premium = await Group.calculatePremium();
                    let overpayment = await Group.calculateOverpayment(subgroupSize);
                    potPayment = overpayment.add(premium);
                    loanPayment = await Group.calculateLoanPayment();
                    totalPayment = potPayment.add(loanPayment);

                    preServiceBalance = await Dai.balanceOf(Service.address);
                    prePolicyholderBalance = await Dai.balanceOf(policyholders[0]);
                    preDaiPot = await Group.viewPool(period);
                    preParticipants = await Group.activeIndex(period);
                    await Dai.approve(Group.address, totalPayment, {from: policyholders[0]});
                    await Group.makePayment(period, {from: policyholders[0]});
                    postServiceBalance = await Dai.balanceOf(Service.address);
                    postPolicyholderBalance = await Dai.balanceOf(policyholders[0]);
                    postDaiPot = await Group.viewPool(period);
                    postParticipants = await Group.activeIndex(period);
                });
                it('Group Period Dai Pot Recieves (Premium + Overpayment) after payment', () => {
                    preDaiPot.should.be.bignumber.that.equal(postDaiPot.sub(potPayment));
                });
                it('Policyholder Dai Withdrew (Premium + Overpayment + Loan) after payment', () => {
                    prePolicyholderBalance.should.be.bignumber.that.equal(postPolicyholderBalance.add(totalPayment));
                });
                it('Service Recieves Dai from Loan Repayment', () => {
                    preServiceBalance.should.be.bignumber.that.equal(postServiceBalance.sub(loanPayment));
                });
                it('Participants index increments after payment', () => {
                    let increment = new web3.utils.BN(1);
                    preParticipants.should.be.bignumber.that.equal(postParticipants.sub(increment));
                });
                it('Policyholder can be parsed to Participant Index', async () => {
                    let period = await Group.activePeriod();
                    let index = await Group.isParticipant(period, policyholders[0]);
                    let zero = new web3.utils.BN(0);
                    index.should.be.bignumber.that.not.equal(zero);
                });
            });
            describe('Group Test 9: submitClaim()', async () => {
                let period, subperiod;
                let preClaimIndex, postClaimIndex;
                let zero, increment;
                before(async () => {
                    zero = new web3.utils.BN(0);
                    increment = new web3.utils.BN(1);
                    await Simulation.passDays(3);
                    period = await Group.activePeriod();
                    subperiod = await Group.getSubperiod(period);
                    preClaimIndex = await Group.claimIndex(period);
                    await Group.submitClaim(period, policyholders[0], {from: secretary});
                    postClaimIndex = await Group.claimIndex(period);
                });
                it('Group subperiod is subperiod.ACTIVE during submit', () => {
                    expectedSubperiod = new web3.utils.BN(2);
                    subperiod.should.be.bignumber.that.equal(expectedSubperiod);
                });
                it('Group period claim index is N before submitted', () => {
                    preClaimIndex.should.be.bignumber.that.equal(zero);
                });
                it('Group period claim index is (N + 1) after submitted', () => {
                    postClaimIndex.should.be.bignumber.that.equal(preClaimIndex.add(increment));
                });
                it('Address maps to claim index after submitted', async () => {
                    let index = await Group.isClaimant(period, policyholders[0]);
                    index.should.be.bignumber.that.not.equal(zero);
                });
            });
            describe('Group Test 10: defect()', async () => {
                let period, subperiod;
                let premium;
                let preParticipantIndex, postParticipantIndex;
                let preClaimIndex, postClaimIndex;
                let preDefectorBalance, postDefectorBalance;
                let preDaiPot, postDaiPot;
                let preDefectionCount, postDefectionCount;
                let zero, increment;
                before(async () => {
                    zero = new web3.utils.BN(0);
                    increment = new web3.utils.BN(1);
                    period = await Group.activePeriod();
                    Simulation.passDays(30);
                    subperiod = await Group.getSubperiod(period);
                    preParticipantIndex = await Group.activeIndex(period);
                    preClaimIndex = await Group.claimIndex(period);
                    preDefectorBalance = await Dai.balanceOf(policyholders[0]);
                    preDaiPot = await Group.viewPool(period);
                    let subgroup = await Group.isPolicyholder(policyholders[0]);
                    preDefectionCount = await Group.getDefectionCount(period, subgroup);
                    await Group.defect(period, {from: policyholders[0]});
                    postParticipantIndex = await Group.activeIndex(period);
                    postClaimIndex = await Group.claimIndex(period);
                    postDefectorBalance = await Dai.balanceOf(policyholders[0]);
                    postDaiPot = await Group.viewPool(period);
                    postDefectionCount = await Group.getDefectionCount(period, subgroup);
                    premium = await Group.calculatePremium();
                    subgroupSize = await Group.getSubgroupSize(subgroup);
                    overpayment = await Group.calculateOverpayment(subgroupSize);
                });
                it('Defection occurs in subperiod state subperiod.POST', () => {
                    let expectedSubperiod = new web3.utils.BN(3);
                    subperiod.should.be.bignumber.that.equal(expectedSubperiod);
                });
                it('Participant Index Decrements after defection', () => {
                    preParticipantIndex.should.be.bignumber.that.equal(postParticipantIndex.add(increment));
                });
                it('Address can no longer be parsed to participant index after defection', async () => {
                    let index = await Group.isParticipant(period, policyholders[0]);
                    index.should.be.bignumber.that.equal(zero);
                });
                it('Since claimant defected, Claim Index Decrements after defection', () => {
                    preClaimIndex.should.be.bignumber.that.equal(postClaimIndex.add(increment));
                });
                it('Address can no longer be parsed to claimant index after defection', async () => {
                    let index = await Group.isClaimant(period, policyholders[0]);
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
        });
    });
});
