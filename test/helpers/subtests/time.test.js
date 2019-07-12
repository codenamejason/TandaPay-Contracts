/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test script for Time testing in TandaPay Smart Contracts
 **/

const Simulator = require('../simulation.js');
const { DaiDriver, ServiceDriver, GroupDriver } = require("../driver.js");
require('chai').use(require('chai-as-promised')).should();

/**
 * Time testing export
 * @param accounts all accounts in the global web3 instance
 * @dev I am not confident that all of these reverts happen for the correct reason
 * @dev implement openzeppelin-test-helpers
 * @dev Test EVERY period edgecase for each function, ensure reverts are correct
 */
module.exports = async (accounts) => {
    let Dai, TandaPayService, Group;
    let policyholders, subgroups;
    let admin = accounts[0];
    let secretary = accounts[4];
    let premium = web3.utils.toBN(20);
    describe('TimeChecks', async () => {
        before(async () => {
            //test suite message
            console.log("   > Ensure TandaPay Smart Contracts interface with EVM internal clock");
            console.log("   > Restrict Group functions by Period; Restrict Remit Service by Timelock state");
            Dai = await DaiDriver.deploy();
            TandaPayService = await ServiceDriver.deploy();
            Group = await ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
            policyholders = Simulator.makePolicyholders(accounts);
            subgroups = Simulator.makeSubgroups();   
            await Simulator.allPHinGroup(Group, policyholders, subgroups, secretary);
        });
        describe('LOBBY Check', async () => {
            it('addPolicyholder() only while unlocked', async () => {
                await GroupDriver.addPolicyholder(Group, accounts[5], 10, secretary)
                    .should.be.fulfilled;
                await GroupDriver.removePolicyholder(Group, accounts[5], secretary);
                await GroupDriver.lock(Group, secretary);
                await Simulator.passDays(1);
                await GroupDriver.addPolicyholder(Group, accounts[5], 10, accounts[74])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(29);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
            it('removePolicyholder() only while unlocked', async () => {
                await GroupDriver.addPolicyholder(Group, accounts[5], 10, secretary);
                await GroupDriver.removePolicyholder(Group, accounts[5], secretary)
                    .should.be.fulfilled;
                await GroupDriver.addPolicyholder(Group, accounts[5], 10, secretary)
                await GroupDriver.lock(Group, secretary);
                await Simulator.passDays(1);
                await GroupDriver.removePolicyholder(Group, accounts[5], accounts[75])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(29);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
            it('changeSubgroup() only while unlocked', async () => {
                await GroupDriver.changeSubgroup(Group, accounts[5], 11, secretary)
                    .should.be.fulfilled;
                await GroupDriver.lock(Group, secretary);
                await Simulator.passDays(1);
                await GroupDriver.changeSubgroup(Group, accounts[5], 10, accounts[76])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(29);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
                await GroupDriver.removePolicyholder(Group, accounts[5], secretary);
            });
            it('lock() only in PRE period', async() => {
                await GroupDriver.lock(Group, secretary)
                    .should.be.fulfilled;
                await Simulator.passDays(10);
                await GroupDriver.lock(Group, accounts[77])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(20);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
            it('remitGroup() only in LOBBY period and Group Escrow is UNLOCKED', async () => {
                await ServiceDriver.remitGroup(TandaPayService, Group, accounts[78])
                    .should.be.rejectedWith('revert');
                await GroupDriver.lock(Group, secretary);
                await Simulator.passDays(15);
                await ServiceDriver.remitGroup(TandaPayService, Group, accounts[79])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(15);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin)
                    .should.be.fulfilled;
            });
        });
        describe('PRE Period Check', async () => {
            it('payPremium() only in PRE period', async () => {
                await GroupDriver.lock(Group, secretary);
                await GroupDriver.payPremium(Group, Dai, policyholders[0])
                    .should.be.fulfilled;
                await Simulator.passDays(20);
                await GroupDriver.payPremium(Group, Dai, accounts[80])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(10);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
        });
        describe('ACTIVE Period Check', async () => {
            it('openClaim() only in ACTIVE period', async () => {
                await GroupDriver.lock(Group, secretary);
                await GroupDriver.payPremium(Group, Dai, policyholders[0]);
                await GroupDriver.openClaim(Group, accounts[81]) //@dev throws when no Dai balance
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(3);
                await GroupDriver.openClaim(Group, policyholders[0])
                    .should.be.fulfilled;
                await Simulator.passDays(27);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
        });
        describe('POST Period Check', async () => {
            it('approveClaim() only in POST period', async () => {
                await GroupDriver.lock(Group, secretary);
                await GroupDriver.payPremium(Group, Dai, policyholders[0]);
                await Simulator.passDays(3);
                await GroupDriver.openClaim(Group, policyholders[0]);
                await GroupDriver.approveClaim(Group, policyholders[0], accounts[82])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(24);
                await GroupDriver.approveClaim(Group, policyholders[0], secretary)
                    .should.be.fulfilled;
                await Simulator.passDays(3);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
            it('rejectClaim() only in POST period', async () => {
                await GroupDriver.lock(Group, secretary);
                await GroupDriver.payPremium(Group, Dai, policyholders[0]);
                await Simulator.passDays(3);
                await GroupDriver.openClaim(Group, policyholders[0]);
                await GroupDriver.rejectClaim(Group, policyholders[0], accounts[83])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(24);
                await GroupDriver.rejectClaim(Group, policyholders[0], secretary)
                    .should.be.fulfilled;
                await Simulator.passDays(3);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin);
            });
            it('defect() only in POST period', async () => {
                await GroupDriver.lock(Group, secretary);
                await GroupDriver.payPremium(Group, Dai, policyholders[0]);
                await Simulator.passDays(7);
                await GroupDriver.defect(Group, accounts[84])
                    .should.be.rejectedWith('revert');
                await Simulator.passDays(20);
                await GroupDriver.defect(Group, policyholders[0])
                    .should.be.fulfilled;
            });
        });
    });    
}