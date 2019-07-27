/**
 * @author blOX Consulting LLC
 * @date July 11, 2019
 * Test script for Functional Properties testing in TandaPay Smart Contracts
 **/

const Simulator = require('../simulation.js');
const { DaiDriver, ServiceDriver, GroupDriver } = require("../driver.js");
require('chai').use(require('chai-as-promised')).should();
const { expectRevert } = require('openzeppelin-test-helpers');

/**
 * Funcitonal testing export
 * @param accounts all accounts in the global web3 instance
 */
module.exports = async (accounts) => {
    let Dai, TandaPayService, Group;
    let policyholders, subgroups;
    let admin = accounts[0];
    let secretary = accounts[5];
    let premium = web3.utils.toBN(20);
    describe('Functional Property Checks', async () => {
        before(async () => {
            //test suite message
            console.log("   > Ensure TandaPay Smart Contract Functions demonstrate all required properties");
            Dai = await DaiDriver.deploy();
            TandaPayService = await ServiceDriver.deploy();
            Group = await ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
            policyholders = Simulator.makePolicyholders(accounts);
            subgroups = Simulator.makeSubgroups();   
            await Simulator.allPHinGroup(Group, policyholders, subgroups, secretary);
        });
        describe('TandaPayService Functionality Check', async () => {
            describe('addAdmin() Functionality Check', async () => {
                before()
                it('New account cannot access createGroup() before being added', async () => {
                    await expectRevert(
                        GroupDriver.lock(Group, admin),
                        "Address is not this Group's Secretary!"
                    );
                });
                it('New account can access createGroup() after being added', async() => {

                });
                it('Cannot add addresses already set as Administrators', async () => {

                });
            });
            describe('removeAdmin() Funuctionality Check', async () => {
                describe('removeAdmin() Restrictions', async () => {

                })
                it('Removed can access createGroup() before being removed', async () => {

                });
                it('Removed cannot access createGroup after being removed', async () => {

                });
                it('Cannot remove address not in Administrators mapping', async () => {

                });
                it('Administrator cannot remove self', async () => {

                });
            });
            describe('createGroup() Functionality Check', async () => {
                it('New secretary is not Secretary according to TandaPayService', async () => {

                });
                it('New secretary is Secretary according to TandaPayService', async () => {

                });
                it('TandaPayService groupCount increments', async () => {

                });
                it('Cannot createGroup() with address that is already secretary', async () => {
                    
                });
                it('Cannot createGroup() if premium is < 5', async () => {
                    
                });
                it('Cannot createGroup() if premium > 50', async () => {
                    
                });
            });
            describe('removeSecretary() Functionality Check', async () => {
                it('Group secretary is not TandaPayService before removing', async () => {

                });
                it('Group secretary is TandaPayService after being overthrown', async () => {

                });
                it('Cannot remove secretary if secretary is already TandaPayService', async () => {

                });
                it('Cannot remove address that is not secretary', async () => {

                });
            });
            describe('installSecretary() Functionality Check', async () => {
                it('Group secretary is TandaPayService before installing new secretary', async () => {

                });
                it('Group secretary is not TandaPayService after installing new secretary', async () => {

                });
                it('Cannot install if Group secretary is not TandaPayService', async () => {

                });
            });
            describe('remitGroup() Functionality Check', async () => {
                describe('Remit Scenario: No Toxic Subgroups, No Claims', async () => {

                });
                describe('Remit Scenario: No Toxic Subgroups, One Claim', async () => {

                });
                describe('Remit Scenario: No Toxic Subgroupss, Two Claims', async () => {

                });
                describe('Remit Scenario: No Toxic Subgroups, Three Claims', async () => {

                });
                describe('Remit Scenario: Three Toxic Subgroups, Five Claims (Three Valid)', async () => {

                });
            });
        });
        describe('Group Functionality Check', async () => {
            describe('addPolicyholder() Functionality Check', async () => {

            });
            describe('removePolicyholder() Functionality Check', async () => {

            });
            describe('changePolicyholder() Functionality Check', async () => {

            });
            describe('payPremium() Functionality Check', async () => {

            });
            describe('lock() Functionality Check', async () => {

            });
            describe('openClaim() Functionality Check', async () => {

            });
            describe('rejectClaim() Functionality Check', async () => {
                
            });
            describe('approveClaim() Functionality Check', async () => {

            });
            describe('defect() Functionality Check', async () => {

            });
        });
    });
}