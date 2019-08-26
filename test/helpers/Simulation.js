
/**
 * @author blOX Consulting LLC
 * @date 08.26.2019
 * Simulator Test ToolKit
 */

const time = require("./time.js")

module.exports = {
    
    /**
     * Increase the time in the local EVM
     * @dev TandaPay's significant times are all days apart; this is a shorthand
     * @param _days the number of days for the evm to pass
     */
    passDays: async (_days) => {
        await time.increase(time.duration.days(web3.utils.toBN(_days)));
    },

    /**
     * Parse an integer representation of subperiod state to human readable form
     * @param _subperiod uint subperiod state as determined by Smart Contract
     * @return a string representing the state
     */
    parseSubperiod: (_subperiod) => {
        if(_subperiod == 0)
            return 'LOBBY';
        else if(_subperiod == 1)
            return 'PRE';
        else if(_subperiod == 2)
            return 'ACTIVE';
        else if(_subperiod == 3)
            return 'POST';
        else
            return 'ENDED';
    },

    /**
     * Set array of web3 account objects according to web3.eth.accounts
     * @dev use offset to choose starting index for policyholders in web3 accounts
     * @param _accounts the accounts wallet object provided by truffle
     * @param _index index in _accounts array to begin from
     * @return array of 50 policyholder addresses
     */
    makePolicyholders: (_accounts, _index) => {
        let policyholders = [];
        for(let i = 0; i < 50; i++) 
            policyholders[i] = _accounts[i + _index];
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
     * @param _bank address of account sending Ether
     **/
    dust: async (_accounts, _bank) => {
        let quantity = web3.utils.toWei('1', 'ether');
        for(let i = 2; i < _accounts.length; i++)
            await web3.eth.sendTransaction({from: _bank, to: _accounts[i], value: quantity});
    },

    /**
     * Mint Dai to an array of accounts
     * @param _dai truffle-contract object of Dai contract
     * @param _value the number of Dai ERC20 test tokens to mint to each account
     * @param _accounts array of addresses to mint to
     * @param _minter address permitted to mint from the Dai contract
     */
    mintAccounts: async (_dai, _value, _accounts, _minter) => {
        let value = web3.utils.toBN(_value);
        for(let i = 0; i < _accounts.length; i++) 
            await _dai.mint(_accounts[i], value, {from: _minter});
    },

    /**
     * Add every address in _accounts to Tanda Group _group as a Policyholder
     * @param _group truffle-contract object of Group contract
     * @param _accounts array of addresses to add to Group contract as Policyholders
     * @param _subgroups array of integers corresponding to account subgroup id
     * @param _secretary address permitted to add Policyholders in the Group contract
     */
    simAddPolicyholder: async (_group, _accounts, _subgroups, _secretary) => {
        for(let i = 0; i < _accounts.length; i++)
            await _group.addPolicyholder(_accounts[i], _subgroups[i], {from: _secretary});
    },

    /**
     * Pay premium in Tanda Group for every address in _accounts as Policyholder
     * @param _group truffle-contract object of Group contract
     * @param _dai truffle-contract object of Dai contract
     * @param _period uint period index to participate in
     * @param _accounts array of addresses to pay Premium to Group contract as Policyholder
     */
    simMakePayment: async (_group, _dai, _period, _accounts) => {
        for(let i = 0; i < _accounts.length; i++) {
            let payment = await _group.calculatePayment(_accounts[i]);
            await _dai.approve(_group.address, payment, {from: _accounts[i]});
            await _group.makePayment(_period, {from: _accounts[i]});
        }
    },

    /**
     * Return the Dai balances of a given array of accounts
     * @param _dai truffle-contract Dai ERC20 Token
     * @param _accounts array of addresses to be queried for Dai balances
     * @return balances of addresses in _accounts as BN objects
     */
    simBalances: async (_dai, _accounts) => {
        let balances = [];
        for(let i = 0; i < _accounts.length; i++)
            balances[i] = await _dai.balanceOf(_accounts[i]);
        return balances;
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
    },

    /**
     * Get the address of a group deployed by the Service parent contract
     * @param _tx the transaction from the contract creation
     * @return address of the new group
     **/ 
    groupAddress: (_tx) => {
        return _tx.logs.filter(log => log.event == 'GroupCreated')[0].args._group;
    }
}