/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test script for Gas Limit testing in TandaPay Smart Contracts
 **/

const Simulator = require('../simulation.js');
const { DaiDriver, ServiceDriver, GroupDriver } = require("../driver.js");
require('chai').use(require('chai-as-promised')).should();

/**
 * Gas testing export
 * @dev Gas usage must not exceed 1,000,000 in following tests!
 * @param accounts all accounts in the global web3 instance
 */
module.exports = async (accounts) => {
    let Dai, TandaPayService, Group;
    let policyholders, subgroups;
    let admin = accounts[0];
    let secretary = accounts[3];
    let premium = web3.utils.toBN(20);
    let gasLimit = 1000000;
    describe('Gas Limit Checks', async () => {
        before(async () => {
            //test suite message
            console.log("   > Ensure specified TandaPay Smart Contract Functions do not exceed Gas usage of 1,000,000");
            Dai = await DaiDriver.deploy();
            TandaPayService = await ServiceDriver.deploy();
            Group = await ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
            policyholders = Simulator.makePolicyholders(accounts);
            subgroups = Simulator.makeSubgroups();   
            await Simulator.allPHinGroup(Group, policyholders, subgroups, secretary);
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
                let tx = await ServiceDriver.removeSecretary(TandaPayService, Group, admin);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('installSecretary() <= 1,000,000 gas', async () => {
                let tx = await ServiceDriver.installSecretary(TandaPayService, Group, secretary, admin);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            describe('remitGroup() Gas Tests', async () => {
                it('No Activity Group <= 1,000,000 gas', async () => {
                    await GroupDriver.lock(Group, secretary);
                    await Simulator.passDays(30);
                    let tx = await ServiceDriver.remitGroup(TandaPayService, Group, admin);
                    (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                });
                it('No Claims, Premium Paid Group Remit <= 1,000,000 gas', async () => {
                    await GroupDriver.lock(Group, secretary);
                    await Simulator.payPremiumAll(Group, Dai, policyholders);
                    await Simulator.passDays(30);
                    let tx = await ServiceDriver.remitGroup(TandaPayService, Group, admin);
                    (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                });
                it('1 Claim, No Toxic Subgroups Remit <= 1,000,000 gas', async () => {
                    await GroupDriver.lock(Group, secretary);
                    await Simulator.payPremiumAll(Group, Dai, policyholders);
                    await Simulator.passDays(3);
                    await GroupDriver.openClaim(Group, policyholders[0]);
                    await Simulator.passDays(24);
                    await GroupDriver.approveClaim(Group, policyholders[0], secretary);
                    await Simulator.passDays(3);
                    let tx = await ServiceDriver.remitGroup(TandaPayService, Group, admin);
                    (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                });
                it('3 Claims, No Toxic Subgroups Remit <= 1,000,000 gas', async () => {
                    await GroupDriver.lock(Group, secretary);
                    await Simulator.payPremiumAll(Group, Dai, policyholders);
                    await Simulator.passDays(3);
                    await GroupDriver.openClaim(Group, policyholders[0]);
                    await GroupDriver.openClaim(Group, policyholders[1]);
                    await GroupDriver.openClaim(Group, policyholders[2]);
                    await Simulator.passDays(24);
                    await GroupDriver.approveClaim(Group, policyholders[0], secretary);
                    await GroupDriver.approveClaim(Group, policyholders[1], secretary);
                    await GroupDriver.approveClaim(Group, policyholders[2], secretary);
                    await Simulator.passDays(3);
                    let tx = await ServiceDriver.remitGroup(TandaPayService, Group, admin);
                    (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                });
                it('4 Claims (2 Valid), 1 Toxic Subgroup Remit <= 1,000,000 Gas', async () => {
                    await GroupDriver.lock(Group, secretary);
                    await Simulator.payPremiumAll(Group, Dai, policyholders);
                    let goodGroup = await Simulator.getSubgroupMembers(policyholders, subgroups, 1);
                    let badGroup = await Simulator.getSubgroupMembers(policyholders, subgroups, 2);
                    await Simulator.passDays(3);
                    await GroupDriver.openClaim(Group, goodGroup[0]);
                    await GroupDriver.openClaim(Group, goodGroup[1]);
                    await GroupDriver.openClaim(Group, badGroup[0]);
                    await GroupDriver.openClaim(Group, badGroup[1]);
                    await Simulator.passDays(24);
                    await GroupDriver.approveClaim(Group, goodGroup[0], secretary);
                    await GroupDriver.approveClaim(Group, goodGroup[1], secretary);
                    await GroupDriver.approveClaim(Group, badGroup[0], secretary);
                    await GroupDriver.approveClaim(Group, badGroup[1], secretary);
                    await GroupDriver.defect(Group, badGroup[2]);
                    await GroupDriver.defect(Group, badGroup[3]);
                    await Simulator.passDays(3);
                    let tx = await ServiceDriver.remitGroup(TandaPayService, Group, admin);
                    (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                });
            });
            it('loan() <= 1,000,000 gas', async () => {
                //@dev todo
            });
        });
        describe('Group Gas Limit Checks', async () => {
            it('addPolicyholder() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.addPolicyholder(Group, accounts[5], 8, secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('changeSubgroup() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.changeSubgroup(Group, accounts[5], 9, secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('removePolicyholder() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.removePolicyholder(Group, accounts[5], secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);        
            });
            it('lock() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.lock(Group, secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('payPremium() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.payPremium(Group, Dai, policyholders[0]);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                tx = await GroupDriver.payPremium(Group, Dai, policyholders[1]);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('openClaim() <= 1,000,000 gas', async () => {
                await Simulator.passDays(3);
                let tx = await GroupDriver.openClaim(Group, policyholders[0]);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
                tx = await GroupDriver.openClaim(Group, policyholders[1]);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('rejectClaim() <= 1,000,000 gas', async () => {
                await Simulator.passDays(24);
                let tx = await GroupDriver.rejectClaim(Group, policyholders[0], secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('approveClaim() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.approveClaim(Group, policyholders[1], secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
            it('defect() <= 1,000,000 gas', async () => {
                let tx = await GroupDriver.defect(Group, policyholders[1], secretary);
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            });
        });
    });
}