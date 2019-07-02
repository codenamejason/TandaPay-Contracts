/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * Main script for test suite simulation
 */

const { GroupDriver } = require("./driver.js");
const time = require("./time")

 module.exports = {
    
    /**
     * Set array of web3 account objects according to web3.eth.accounts
     * @dev use offset to choose starting index for policyholders in web3 accounts
     * @param _accounts the accounts wallet object provided by truffle
     * @param _admin account permitted
     * @return array of 50 policyholders
     */
    makePolicyholders: (_accounts, _admin) => {
        let policyholders = [];
        let offset = 10;
        for(let i = 0; i < 50; i++) 
            policyholders[i] = _accounts[i+offset];
        return policyholders;
    },

    /**
     * Make an array of integers representing subgroups for policyholders
     * @return a randomized array of integers to assign to policyholders
     */
    makeSubgroups: () => {
        let subgroups = [];
        for(let i = 0; i < 50; i++) 
            subgroups.push(Math.floor(i/5) + 1); // +1 because no 0 subgroup @dev hacky
        let shuffled_subgroups = module.exports.fisherYatesShuffle(subgroups);
        return shuffled_subgroups;         
    },

    /**
     * Dust all existing accounts in the global web3 instance with .02 Ether, except for the first account
     * @dev this is a pretty crude hack; don't want to waste more time looking for a 'correct' solution
     * @param _accounts all web3 accounts
     **/
    dust: async (_accounts) => {
        let quantity = web3.utils.toWei('1', 'ether');
        for(let i = 2; i < _accounts.length; i++)
            await web3.eth.sendTransaction({from: _accounts[1], to: _accounts[i], value: quantity});
    },

    /**
     * Mint Dai to an array of accounts, generally an array of Policyholders.
     * @dev use quantity to choose stipend of Dai to mint to each address
     * @param Dai truffle-contract object of Dai contract
     * @param _accounts array of addresses to mint to
     * @param _minter address permitted to mint from the Dai contract
     */
    mintPolicyholders: async (Dai, _accounts, _minter) => {
        let quantity = web3.utils.toBN(300);
        for(let i = 0; i < _accounts.length; i++) 
            await Dai.mint(_accounts[i], quantity, {from: _minter});
    },

    /**
     * Add every address in _accounts to Tanda Group _group as a Policyholder
     * @param _group truffle-contract object of Group contract
     * @param _accounts array of addresses to add to Group contract as Policyholders
     * @param _subgroups array of integers corresponding to account subgroup id
     * @param _secretary address permitted to add Policyholders in the Group contract
     */
    allPHinGroup: async (_group, _accounts, _subgroups, _secretary) => {
        for(let i = 0; i < _accounts.length; i++)
            await GroupDriver.addPolicyholder(_group, _accounts[i], _subgroups[i], _secretary);
    },

    /**
     * Return an array of all addresses in subgroup id targetIndex
     * @param _policyholders array of Ethereum addresses
     * @param _subgroups array of integers for subgroup ID
     * @param _targetIndex subgroup ID to query
     * @return array of all addresses in _policyholders with subgroup ID in _subgroups of _targetIndex
     */
    getSubgroupMembers: async (_policyholders, _subgroups, _targetIndex) => {
        let subgroup = [];
        for(let i = 0; i < _policyholders.length; i++) {
            if(_subgroups[i] == _targetIndex)
                subgroup.push(_policyholders[i]);
        }
        return subgroup;
    },

    /**
     * Pay premium in Tanda Group for every address in _accounts as Policyholder
     * @param _group truffle-contract object of Group contract
     * @param _dai truffle-contract object of Dai contract
     * @param _accounts array of addresses to pay Premium to Group contract as Policyholder
     */
    payPremiumAll: async (_group, _dai, _accounts) => {
        for(let i = 0; i < _accounts.length; i++)
            await GroupDriver.payPremium(_group, _dai, _accounts[i]);
    },

    /**
     * Increase the time in the local EVM
     * @dev TandaPay's significant times are all days apart; this is a shorthand
     * @param _days the number of days for the evm to pass
     */
    passDays: async (_days) => {
        await time.increase(time.duration.days(web3.utils.toBN(_days)));
    },

    /**
     * Determine the empirical gas consumption of a valid transaction
     * @param _tx truffle-contract transaction object being queried for gas consumption
     * @return total gas consumed in _tx as a string object
     */
    gasConsumed: async (_tx) => {
        return await _tx.receipt.gasUsed;
    },

    /**
     * Use Fisher-Yates array randomization algorithm on unshuffled subgroup array
     * @dev https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array/2450976#2450976
     * @param arr (can be an array of arbitrary objects) the array of subgroup integers being randomized
     * @return a randomized array of subgroup integers to assign to policyholders
     */
    fisherYatesShuffle: (arr) => {
        let index = arr.length;
        let temporary;
        let random;
        while(0 != index) {
            random = Math.floor(Math.random() * index);
            index--;
            temporary = arr[index];
            arr[index] = arr[random];
            arr[random] = temporary;
        }
        return arr;
    }
}