/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * Main script for test suite simulation
 */

 module.exports = {
    
    /**
     * Make an array of 51 web3 account objects
     * @dev accountsArr[0] will always be secretary
     * @dev accountsArr[1] -> accountsArr[50] are policyholders
     * @param web3Accounts the module 'web3.eth.accounts'
     * @return an array of 51 newly generated web3 account objects
     */
    makeAccounts: () => {
        for(let i = 0; i < 51; i++)
            web3.eth.personal.newAccount("password");
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
     * Unlock all ethereum addresses in the Tanda Group
     * @param accounts array of 51 addresses
     */
    unlockAll: async (accounts) => {
        for(let i = 0; i < accounts.length; i++)
            await web3.eth.accounts.wallet.add(accounts[i]);
        console.log(web3.eth.accounts.wallet);
    }
}