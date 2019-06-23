/**
 * @author blOX Consulting LLC
 * @date June 20, 2019
 * Main test script for TandaPayServices
 **/

const Simulator = require('./helpers/simulation');
const { DaiDriver, ServiceDriver, GroupDriver } = require("./helpers/driver.js");

contract("TandaPayService", async (accounts) => {
    let premium = web3.utils.toBN(20);
    let Dai, TandaPayService, Group;
    let admin = accounts[0];
    let secretary = accounts[1];
    let policyholders = Simulator.makePolicyholders(accounts);
    let subgroups = Simulator.makeSubgroups(policyholders);

    

    before(async () => {
        Dai = await DaiDriver.makeDaiContract();
        let stipend = web3.utils.toBN(100);
        await Simulator.payDaiAccounts(Dai, policyholders, stipend, admin);
        let quantity = web3.utils.toWei('1', 'ether');
        await Simulator.payEtherAccounts(policyholders, quantity, admin);
        TandaPayService = await ServiceDriver.createService(Dai.address, admin);
   
        //Group = await ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
        //console.log(Group);
        //console.log("3"); */
    });

    describe('Role-based Authentication Checks', async () => {
        describe('Admin RBA Check', async() => {
            it('Only administrators can call addAdmin()', async () => {

            });
            it('Only administrators can call removeAdmin()', async () => {
    
            });
            it('Only administrators can call createGroup()', async () => {
    
            });
            it('Only administrators can call removeSecretary()', async () => {
    
            });
            it('Only administrators can call installSecretary()', async () => {

            });
            it('Only administrators can call remitGroup()', async () => {

            });
            it('Only administrators can call loan()', async () => {

            });
        });
        describe('Secretary RBA Check', async () => {
            it('Only secretary can call addPolicyholder()', async() => {

            });
            it('Only secretary can call removePolicyholder()', async() => {

            });
            it('Only secretary can call changeSubgroup()', async () => {

            });
            it('Only secretary can call lock()', async () => {

            });
            it('Only secretary can call rejectClaim()', async () => {

            });
            it('Only secretary can call approveClaim()', async () => {

            });
        });
        describe('Policyholder RBA Check', async () => {
            it('Only policyholder can call payPremium()', async () => {

            });
            it('Only ACTIVE policyholder can call openClaim()', async () => {

            });
            it('Only ACTIVE policyholder can call defect()', async() => {

            });
        });
    });
    describe('Time-restricted Checks', async () => {
        describe('PRE Period Check', async () => {
            it('addPolicyholder() only in PRE period', async () => {

            });
            it('removePolicyholder() only in PRE period', async () => {

            });
            it('changeSubgroup() only in PRE period', async () => {

            });
            it('payPremium() only in PRE period', async () => {

            });
            it('lock() only in PRE period', async() => {

            });
        });
        describe('ACTIVE Period Check', async () => {
            it('openClaim() only in ACTIVE period', async () => {

            });
            it('rejectClaim() only in ACTIVE period', async () => {

            });
            it('approveClaim() only in ACTIVE period', async () => {

            });
        });
        describe('POST Period Check', async () => {
            it('defect() only in POST period', async () => {

            });
        });
    });
    describe('Functionality Checks', async () => {
        describe('TandaPayService Functionality Check', async () => {
            describe('addAdmin() Functionality Check', async () => {
                it('New account cannot access createGroup() before being added', async () => {

                });
                it('New account can access createGroup() after being added', async() => {

                });
                it('Cannot add addresses already set as Administrators', async () => {

                });
            });
            describe('removeAdmin() Funuctionality Check', async () => {
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

                } );
            });
            describe('loan() Functionality Check', async () => {

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
    describe('Gas Fees <= 1,000,000 per TX Checks', async () => {
        describe('TandaPayService Gas Fee Checks', async () => {
            it('addAdmin() <= 1,000,000 gas', async () => {

            });
            it('removeAdmin() <= 1,000,000 gas', async () => {

            });
            it('removeSecretary() <= 1,000,000 gas', async () => {

            });
            it('remitGroup() <= 1,000,000 gas', async () => {

            });
            it('loan() <= 1,000,000 gas', async () => {

            });
        });
        describe('Group Gas Fee Checks', async () => {
            it('addPolicyholder() <= 1,000,000 gas', async () => {

            });
            it('removePolicyholder() <= 1,000,000 gas', async () => {

            });
            it('changeSubgroup() <= 1,000,000 gas', async () => {

            });
            it('lock() <= 1,000,000 gas', async () => {

            });
            it('payPremium() <= 1,000,000 gas', async () => {

            });
            it('openClaim() <= 1,000,000 gas', async () => {

            });
            it('removeClaim() <= 1,000,000 gas', async () => {

            });
            it('approveClaim() <= 1,000,000 gas', async () => {

            });
            it('defect() <= 1,000,000 gas', async () => {

            });
        });
    });
});