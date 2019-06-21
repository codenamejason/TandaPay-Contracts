/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * DaiContract.sol (ERC20) Smart Contract Driver
 */
module.exports = {
    /**
     * Get the Dai balances of each policyholder in an array of accounts
     * @param _accounts array of web3 account objects storing addresses being queried for Dai balances
     * @param _dai the Dai truffe-contract object
     * @return an array of balances pulled from the Dai ERC20 contract
     */
    getDaiBalances: async (_accounts, _dai) => {
        let balances = [];
        for(let i = 1; i < _accounts.length; i++) 
            balances[i] = await _dai.balanceOf(_accounts[i].address);
        return balances;
    },
    
    /**
     * Give Dai to an array of policyholder accounts
     * @param _accounts array of web3 account objects storing addresses being given Dai tokens
     * @param _dai the Dai truffle-contract object
     * @param _quantity the number of Dai being minted to each address
     * @param _minter web3 account object of the address that has minter rights for Dai
     */
    giveDai: async (_accounts, _dai, _quantity, _minter) => {
        for(let i = 1; i < _accounts.length; i++) 
            await _dai.mint(_accounts[i].address, _quantity, { from: _minter });
    }

    
}