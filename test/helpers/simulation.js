/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * Main script for test suite simulation
 */

const { DaiDriver } = require("./driver.js");

 module.exports = {
    
    /**
     * Set array of web3 account objects according to web3.eth.accounts
     * @param accounts the accounts wallet object provided by truffle
     * @return array of 50 unlocked account objects
     */
    makePolicyholders: (accounts) => {
        let policyholders = [];
        for(let i = 0; i < 50; i++) 
            policyholders[i] = accounts[i+2];
        return policyholders;
    },

    /**
     * Make an array of integers representing subgroups for policyholders
     * @return a randomized array of integers to assign to policyholders
     */
    makeSubgroups: () => {
        let subgroups = [];
        for(let i = 0; i < 50; i++) 
            subgroups.push(Math.floor(i/7));
        let shuffled_subgroups = module.exports.fisherYatesShuffle(subgroups);
        return shuffled_subgroups;         
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
     * Mint Dai and give it to an arbitrary amount of addresses
     * @param _dai truffle-contract object of Dai
     * @param _accounts array of addresses to send Dai to
     * @param _quantity the number of Dai tokens to mint to each address
     * @param _minter account permitted to call mint
     */
    payDaiAccounts: async (_dai, _accounts, _quantity, _minter) => {
        for(let i = 0; i < _accounts.length; i++)
            await DaiDriver.giveDai(_dai, _accounts[i], _quantity, _minter);
    },

    /**
     * Send ether to an arbitrary amount of addresses
     * @dev used to ensure addresses can cover gas fee
     * @param _accounts array of addresses to send Ether to
     * @param _quantity the number of Ether to send to each address, as a BN object
     * @param _admin account with sufficient ether to cover the transactions
     */
    payEtherAccounts: async (_accounts, _quantity, _admin) => {
        for(let i = 0; i < _accounts.length; i++)
            await web3.eth.sendTransaction({from: _admin, to: _accounts[i], value: _quantity})
    }
}