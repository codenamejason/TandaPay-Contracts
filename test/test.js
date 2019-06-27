/**
 * @author blOX Consulting LLC
 * @date June 26, 2019
 * Main test script for TandaPayServices
 **/

const Simulator = require('./helpers/simulation');
const { DaiDriver, ServiceDriver, GroupDriver } = require("./helpers/driver.js");
require('chai').use(require('chai-as-promised')).should();

contract("TandaPayService", async (accounts) => {
    // account 0 = administrator
    // account 1 = duster bank
    // account 2-9 = secretaries
    // account 10-59 = policyholders
    // account 60-79 = revert dummies
    let Dai, TandaPayService, Group;
    let secretary;
    let admin = accounts[0];
    let policyholders = Simulator.makePolicyholders(accounts);
    let subgroups = Simulator.makeSubgroups(policyholders);
    let premium = web3.utils.toBN(20);

    before(async () => {
        
        Dai = await DaiDriver.deploy();
        TandaPayService = await ServiceDriver.deploy();
        await Simulator.dust(accounts);
        //await Simulator.mintPolicyholders(Dai, policyholders, admin);
        /* let before = (await web3.eth.getBlock('latest')).timestamp;
        console.log("before timestamp: ", before);
        await Simulator.passTime(3);
        let after = (await web3.eth.getBlock('latest')).timestamp;
        console.log("after timestamp: ", after); */
    });

    describe('Role-based Authentication Checks', async () => {
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
                Group = await ServiceDriver.createGroup(TandaPayService, accounts[62], premium, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call removeSecretary()', async () => {
                await ServiceDriver.removeSecretary(TandaPayService, Group, accounts[63])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.removeSecretary(TandaPayService, Group, admin)
                    .should.be.fulfilled;
            });
            it('Only administrators can call installSecretary()', async () => {
                await ServiceDriver.installSecretary(TandaPayService, Group, accounts[62], accounts[64])
                    .should.be.rejectedWith('revert');
                await ServiceDriver.installSecretary(TandaPayService, Group, accounts[62], admin)
                    .should.be.fulfilled;
            });
            /*  it('Only administrators can call remitGroup()', async () => {

            });
            it('Only administrators can call loan()', async () => {

            }); */
        });
        describe('Secretary RBA Check', async () => {
            before(async () => {
                secretary = accounts[3];
                Group = await ServiceDriver.createGroup(TandaPayService, secretary, premium, admin);
                await Simulator.allPHinGroup(Group, policyholders, subgroups, secretary);

            });
            it('Only secretary can call addPolicyholder()', async() => {
                await GroupDriver.addPolicyholder(Group, accounts[65], 8, accounts[65])
                    .should.be.rejectedWith('revert');  
                await GroupDriver.addPolicyholder(Group, accounts[65], 8, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call changeSubgroup()', async () => {
                await GroupDriver.changeSubgroup(Group, accounts[65], 9, accounts[66])
                    .should.be.rejectedWith('revert');
                await GroupDriver.changeSubgroup(Group, accounts[65], 9, secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call removePolicyholder()', async() => {
                await GroupDriver.removePolicyholder(Group, accounts[65], accounts[67])
                    .should.be.rejectedWith('revert');
                await GroupDriver.removePolicyholder(Group, accounts[65], secretary)
                    .should.be.fulfilled;
            });
            it('Only secretary can call lock()', async () => {
                await GroupDriver.lock(Group, accounts[68])
                    .should.be.rejectedWith('revert');
                await GroupDriver.lock(Group, secretary)
                    .should.be.fulfilled;
            });
            /* it('Only secretary can call rejectClaim()', async () => {

            });
            it('Only secretary can call approveClaim()', async () => {

            }); */
        });
        describe('Policyholder RBA Check', async () => {
            /* before(async () => {
            }) */
            it('Only policyholder can call payPremium()', async () => {
                await GroupDriver.payPremium(Group, accounts[69])
                    .should.be.rejectedWith('revert');
                await GroupDriver.payPremium(Group, policyholders[0])
                    .should.be.fulfilled;
                await Dai.approve(Group.address, web3.utils.toBN(100), {from: policyholders[0]});
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

                });
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