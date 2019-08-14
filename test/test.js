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

require('chai').use(require('chai-as-promised')).should();
contract("TandaPay Test Suite", async (accounts) => {
    // account 0 = admin
    // account 1 = bank (funds policyholders)
    // account 2 = first secretary (Case Demo)
    // account 3 = second secretary (Unit Tests)
    // accounts [4-52] = policyholders
    let Dai, Service, Group;
    let bank, admin, secretary, policyholders;
    let subgroups;
    let volume, payout;
    before(async () => {
        admin = accounts[0];
        bank = accounts[1];
        secretary = accounts[2];
        policyholders = Simulation.makePolicyholders(accounts, 4);
        subgroups = Simulation.makeSubgroups();
        volume = 3;
        payout = 500;

        await Simulation.dust(policyholders, bank);
        Dai = await DaiContract.deployed();
        Service = await ServiceContract.deployed();
        GroupTX = await Service.createGroup(secretary, volume, payout, { from: admin });
        groupAddress = await Simulation.groupAddress(GroupTX);
        Group = await GroupContract.at(groupAddress);
        await Simulation.mintAccounts(Dai, 1000, policyholders, admin);
    });
    describe('Unit Tests', async () => {
        describe('Service Unit Tests', async () => {
            describe('Service Test 1: addAdmin()', async () => {
                before(async () => {

                });
                it('Address is not administrator before being added', () => {

                });
                it('Address is administrator after being added', () => {

                });
            });
            describe('Service Test 2: removeAdmin()', async () => {
                before(async () => {

                });
                it('Address is administrator before being removed', () => {

                });
                it('Address is not administrator after being removed', () => {

                });
            });
            describe('Service Test 3: createGroup()', async () => {
                before(async () => {
                    
                });
                it('Group count is 0 before creating new group',  () => {

                });
                it('Group count is 1 after creating new group', () => {

                });
                it('Group index of 1 can retrieve the address of the new group', () => {

                });
                it('Secretary address can be parsed to Group index', () => {

                });
            });
            describe('Service Test 4: loan()', async () => {
                before(async () => {

                });
                it('Group is not loaned before calling loan', () => {

                });
                it('Group is loaned after calling loan', () => {

                });
                it('Loan endowment is equal to 2*(Premium + Overpayment) / (Months to Repay Loan - 1)', () => {

                });
            });
            describe('Service Test 5: remitGroup()', async () => {
                before(async () => {

                });
                it('Group has liquid Dai pot for period before being remitted', () => {

                });
                it('Claimant has X Dai before Group is remitted', () => {

                });
                it('Policyholders have Y Dai before Group is remitted', () => {

                });
                it('Period state is subperiod.ENDED', () => {

                });
                it('Group has no liquid Dai pot for period after being remitted', () => {

                });
                it('Claimant has (X + payout) Dai after Group is remitted', () => {

                });
                it('Policyholders have (Y + refund) Dai after Group is remitted', () => {

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
