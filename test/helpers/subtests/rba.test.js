/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test script for Roll-based Authentication in TandaPay Smart Contracts
 **/

const Simulator = require('../simulation.js');
const { DaiDriver, ServiceDriver, GroupDriver } = require("../driver.js");
require('chai').use(require('chai-as-promised')).should();

/**
 * Roll-based authentication testing export
 * @dev does not provide checks against reentrancy attacks
 * @param accounts all accounts in the global web3 instance
 */
module.exports = async (accounts) => {
    let Dai, TandaPayService, Group;
    let policyholders, subgroups;
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
            it('Only administrators can call addAdmin()', async () => {
                await ServiceDriver.addAdmin(TandaPayService, accounts[60], accounts[60])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.addAdmin(TandaPayService, accounts[60], admin)
                    .should.be.fulfilled;               
            });
            it('Only administrators can call removeAdmin()', async () => {
                await ServiceDriver.removeAdmin(TandaPayService, accounts[60], accounts[61])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.removeAdmin(TandaPayService, accounts[60], admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call createGroup()', async () => {
                await ServiceDriver.createGroup(TandaPayService, accounts[62], premium, accounts[62])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.createGroup(TandaPayService, accounts[62], premium, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call removeSecretary()', async () => {
                await ServiceDriver.removeSecretary(TandaPayService, Group, accounts[63])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.removeSecretary(TandaPayService, Group, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call installSecretary()', async () => {
                await ServiceDriver.installSecretary(TandaPayService, Group, secretary, accounts[64])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.installSecretary(TandaPayService, Group, secretary, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call remitGroup()', async () => {
                await GroupDriver.lock(Group, secretary);
                await Simulator.passDays(30);
                await ServiceDriver.remitGroup(TandaPayService, Group, accounts[65])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.remitGroup(TandaPayService, Group, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call loan()', async () => {
                //@dev todo
            });
        });
        describe('Secretary RBA Check', async () => {
            it('Only secretary can call addPolicyholder()', async() => {
                await GroupDriver.addPolicyholder(Group, accounts[66], 8, accounts[66])
                    .should.be.rejectedWith('revert');  
                await GroupDriver.addPolicyholder(Group, accounts[66], 8, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call changeSubgroup()', async () => {
                await GroupDriver.changeSubgroup(Group, accounts[66], 9, accounts[67])
                    .should.be.rejectedWith('revert');
                await GroupDriver.changeSubgroup(Group, accounts[66], 9, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call removePolicyholder()', async() => {
                await GroupDriver.removePolicyholder(Group, accounts[66], accounts[68])
                    .should.be.rejectedWith('revert');
                await GroupDriver.removePolicyholder(Group, accounts[66], secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call lock()', async () => {
                await GroupDriver.lock(Group, accounts[69])
                    .should.be.rejectedWith('revert');
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
                await GroupDriver.rejectClaim(Group, policyholders[0], accounts[70])
                    .should.be.rejectedWith('revert');
                await GroupDriver.rejectClaim(Group, policyholders[0], secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call approveClaim()', async () => {
                await GroupDriver.approveClaim(Group, policyholders[1], accounts[71])
                    .should.be.rejectedWith('revert');
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
                await GroupDriver.payPremium(Group, Dai, accounts[71])
                    .should.be.rejectedWith('revert');
                await GroupDriver.payPremium(Group, Dai, policyholders[0])
                    .should.be.fulfilled;
            });
            it('Only ACTIVE policyholder can call openClaim()', async () => {
                await Simulator.passDays(3);
                await GroupDriver.openClaim(Group, accounts[72])
                    .should.be.rejectedWith('revert');
                await GroupDriver.openClaim(Group, policyholders[0])
                    .should.be.fulfilled;
            });
            it('Only ACTIVE policyholder can call defect()', async() => {
                await Simulator.passDays(24);
                await GroupDriver.defect(Group, accounts[73])
                    .should.be.rejectedWith('revert');
                await GroupDriver.defect(Group, policyholders[0])
                    .should.be.fulfilled;
            });
        });
    });
}