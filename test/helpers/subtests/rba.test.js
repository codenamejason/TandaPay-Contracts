/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test script for Roll-based Authentication in TandaPay Smart Contracts
 **/

const Simulator = require('../simulation.js');
const { DaiDriver, ServiceDriver, GroupDriver } = require("../driver.js");
require('chai').use(require('chai-as-promised')).should();
const { expectRevert } = require('openzeppelin-test-helpers');

/**
 * Roll-based authentication testing export
 * @dev does not provide checks against reentrancy attacks
 * @param accounts all accounts in the global web3 instance
 */
module.exports = async (accounts) => {
    let Dai, TandaPayService, Group;
    let policyholders, subgroups;
    let revertMessage;
    let admin = accounts[0];
    let secretary = accounts[2];
    let premium = web3.utils.toBN(20);
    describe('Role-based Authentication Checks', async () => {
        before(async () => {
            //test suite message
            console.log("   > Ensure TandaPay Smart Contracts implements address authentication");
            console.log("   > Given roles: TandaPayService Administrator, Group Secretary, Group Policyholder");
            Dai = await DaiDriver.deploy();
            TandaPayService = await ServiceDriver.deploy();
            Group = await ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
            policyholders = Simulator.makePolicyholders(accounts);
            subgroups = Simulator.makeSubgroups();   
            await Simulator.allPHinGroup(Group, policyholders, subgroups, secretary);
        });
        describe('Admin RBA Check', async() => {
            before(async () => {
                revertMessage = "Address is not a TandaPay Administrator!";
            })
            it('Only administrators can call addAdmin()', async () => {
                await expectRevert(
                    ServiceDriver.addAdmin(TandaPayService, accounts[60], accounts[60]),
                    revertMessage
                );
                await ServiceDriver.addAdmin(TandaPayService, accounts[60], admin)
                    .should.be.fulfilled;        
            });
            it('Only administrators can call removeAdmin()', async () => {
                await expectRevert(
                    ServiceDriver.removeAdmin(TandaPayService, accounts[60], accounts[61]),
                    revertMessage
                );
                await ServiceDriver.removeAdmin(TandaPayService, accounts[60], admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call createGroup()', async () => {
                await expectRevert(
                    ServiceDriver.createGroup(TandaPayService, accounts[62], premium, accounts[62]),
                    revertMessage
                );
                await ServiceDriver.createGroup(TandaPayService, accounts[62], premium, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call removeSecretary()', async () => {
                await expectRevert(
                    ServiceDriver.removeSecretary(TandaPayService, Group, accounts[63]),
                    revertMessage
                );
                await ServiceDriver.removeSecretary(TandaPayService, Group, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call installSecretary()', async () => {
                await expectRevert(
                    ServiceDriver.installSecretary(TandaPayService, Group, secretary, accounts[64]),
                    revertMessage
                );
                await ServiceDriver.installSecretary(TandaPayService, Group, secretary, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call remitGroup()', async () => {
                await GroupDriver.lock(Group, secretary);
                await Simulator.passDays(30);
                await expectRevert(
                    ServiceDriver.remitGroup(TandaPayService, Group, accounts[65]),
                    revertMessage
                );
                await ServiceDriver.remitGroup(TandaPayService, Group, admin)
                    .should.be.fulfilled;
            });
            /* it('Only administrators can call loan()', async () => {
                //@dev todo
            }); */
        });
        describe('Secretary RBA Check', async () => {
            before(async () => {
                revertMessage = "Address is not this Group's Secretary!";
            });
            it('Only secretary can call addPolicyholder()', async() => {
                await expectRevert(
                    GroupDriver.addPolicyholder(Group, accounts[66], 8, accounts[66]),
                    revertMessage
                );
                await GroupDriver.addPolicyholder(Group, accounts[66], 8, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call changeSubgroup()', async () => {
                await expectRevert(
                    GroupDriver.changeSubgroup(Group, accounts[66], 9, accounts[67]),
                    revertMessage
                );
                await GroupDriver.changeSubgroup(Group, accounts[66], 9, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call removePolicyholder()', async() => {
                await expectRevert(
                    GroupDriver.removePolicyholder(Group, accounts[66], accounts[68]),
                    revertMessage
                );
                await GroupDriver.removePolicyholder(Group, accounts[66], secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call lock()', async () => {
                await expectRevert(
                    GroupDriver.lock(Group, accounts[69]),
                    revertMessage
                );
                await GroupDriver.lock(Group, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call rejectClaim()', async () => {
                await GroupDriver.payPremium(Group, Dai, policyholders[0]);
                await GroupDriver.payPremium(Group, Dai, policyholders[1]);
                await Simulator.passDays(3);
                await GroupDriver.openClaim(Group, policyholders[0]);
                await GroupDriver.openClaim(Group, policyholders[1]);
                await Simulator.passDays(24);
                await expectRevert(
                    GroupDriver.rejectClaim(Group, policyholders[0], accounts[70]),
                    revertMessage
                );
                await GroupDriver.rejectClaim(Group, policyholders[0], secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call approveClaim()', async () => {
                await expectRevert(
                    GroupDriver.approveClaim(Group, policyholders[1], accounts[71]),
                    revertMessage
                );
                await GroupDriver.approveClaim(Group, policyholders[1], secretary)
                    .should.be.fulfilled;
            });
        });
        describe('Policyholder RBA Check', async () => {
            before(async () => {
                await Simulator.passDays(4);
                await ServiceDriver.remitGroup(TandaPayService, Group, admin)
                    .should.be.fulfilled;
                await GroupDriver.lock(Group, secretary);
            });
            it('Only policyholder can call payPremium()', async () => {
                await expectRevert(
                    GroupDriver.payPremium(Group, Dai, accounts[71]),
                    "Address is not a Policyholder in this Group!"
                );
                await GroupDriver.payPremium(Group, Dai, policyholders[0])
                    .should.be.fulfilled;
            });
            it('Only ACTIVE policyholder can call openClaim()', async () => {
                await Simulator.passDays(3);
                await expectRevert(
                    GroupDriver.openClaim(Group, accounts[72]),
                    "Policyholder is not active in the current Period!"
                );
                await GroupDriver.openClaim(Group, policyholders[0])
                    .should.be.fulfilled;
            });
            it('Only ACTIVE policyholder can call defect()', async() => {
                await Simulator.passDays(24);
                await expectRevert(
                    GroupDriver.defect(Group, accounts[73]),
                    "Policyholder is not active in the current Period!"
                );
                await GroupDriver.defect(Group, policyholders[0])
                    .should.be.fulfilled;
            });
        });
    });
}