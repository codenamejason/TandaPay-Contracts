/**
 * @author blOX Consulting LLC
 * @date July 18, 2019
 * Test suite for TandaPay v0.2.0
 **/

const IERC20 = artifacts.require("./IERC20");
const TestService = artifacts.require("./TestService");
const TestGroup = artifacts.require("./TestGroup");
const Simulator = require('./helpers/simulation.js');
require('chai').use(require('chai-as-promised')).should();

contract("TandaPay Kovan Gas Limit Tests", async (accounts) => {
    // account 0 = administrator
    // account 1 = secretary
    // account 2-4 = policyholders 
    let Dai, TandaPayService, Group;
    let activePolicyholders;
    let policyholders, subgroups;
    let admin = accounts[0];
    let secretary = accounts[1];
    let premium = web3.utils.toBN(1);
    let gasLimit = 1000000;
    before(async () => {
        activePolicyholders = [accounts[2], accounts[3], accounts[4]];
        Dai = await IERC20.at(process.env.DAI_KOVAN);
        TandaPayService = await TestService.deployed();
        /* console.log("Num Groups: ", (await TandaPayService.getCount()).toString());
        console.log("TPS Address: ", TandaPayService.address); */
        Group = await TestGroup.at(await TandaPayService.groupAddress(1));
        /* policyholders = Simulator.makePolicyholders(accounts, admin);
        subgroups = Simulator.makeSubgroups();
        for(let i = 0; i < 50; i++) {
            await Group.addPolicyholder(policyholders[i], subgroups[i], {from: secretary});
        }
        for(let i = 0; i < 3; i++) {
            await Group.addPolicyholder(activePolicyholders[i], 15, {from: secretary});
        } */
    });
    describe('TandaPayService Gas Limit Checks', async () => {
        it('addAdmin() <= 1,000,000 gas', async () => {
            let tx = await TandaPayService.addAdmin(accounts[5], {from: admin});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('removeAdmin() <= 1,000,000 gas', async () => {
            let tx = await TandaPayService.removeAdmin(accounts[5], {from: admin});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('removeSecretary() <= 1,000,000 gas', async () => {
            let tx = await TandaPayService.removeSecretary(secretary, {from: admin});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('installSecretary() <= 1,000,000 gas', async () => {
            let tx = await TandaPayService.installSecretary(secretary, Group.address, {from: admin});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('3 Claim remitGroup() <= 1,000,000 gas', async () => {
            await Group.lock({from: secretary});
            for(let i = 0; i < 3; i++) {
                await Dai.approve(Group.address, premium, {from: activePolicyholders[i]});
                await Group.payPremium({from: activePolicyholders[i]});
            }
            await Group.passDays(3);
            for(let i = 0; i < 3; i++)
                await Group.openClaim({from: activePolicyholders[i]});
            await Group.passDays(24);
            for(let i = 0; i < 3; i++)
                await Group.approveClaim(activePolicyholders[i], {from: secretary});
            await Group.passDays(3);
            let tx = await TandaPayService.remitGroup(Group.address, {from: admin});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
    });
    describe('Group Gas Limit Checks', async () => {
        it('addPolicyholder() <= 1,000,000 gas', async () => {
            let tx = await Group.addPolicyholder(accounts[5], 8, {from: secretary});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('changeSubgroup() <= 1,000,000 gas', async () => {
            let tx = await Group.changeSubgroup(accounts[5], 9, {from: secretary});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('removePolicyholder() <= 1,000,000 gas', async () => {
            let tx = await Group.removePolicyholder(accounts[5], {from: secretary});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);        
        });
        it('lock() <= 1,000,000 gas', async () => {
            let tx = await Group.lock({from: secretary});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('payPremium() <= 1,000,000 gas', async () => {
            for(let i = 0; i < 3; i++) {
                await Dai.approve(Group.address, premium, {from: activePolicyholders[i]});
                let tx = await Group.payPremium({from: activePolicyholders[i]});
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            }
        });
        it('openClaim() <= 1,000,000 gas', async () => {
            await Group.passDays(3);
            for(let i = 0; i < 3; i++) {
                let tx = await Group.openClaim({from: activePolicyholders[i]});
                (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            }
        });
        it('rejectClaim() <= 1,000,000 gas', async () => {
            await Group.passDays(24);
            let tx = await Group.rejectClaim(activePolicyholders[0], {from: secretary});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('approveClaim() <= 1,000,000 gas', async () => {
            let tx = await Group.approveClaim(activePolicyholders[1], {from: secretary});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
        });
        it('defect() <= 1,000,000 gas', async () => {
            let tx = await Group.defect({from: activePolicyholders[2]});
            (await Simulator.gasConsumed(tx)).should.be.at.most(gasLimit);
            await Group.passDays(3);
            await TandaPayService.remitGroup(Group.address, {from: admin});
        });
    });
});