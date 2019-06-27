/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * DaiContract.sol (ERC20) Smart Contract Driver
 */
const DaiContract = artifacts.require('./DaiContract');
module.exports = {
    
    /**
     * Return the Dai Contract deployed in migrations
     * @return the truffle-contract object of the Dai Contract
     */
    deploy: async () => {
        return await DaiContract.deployed();
    },

    /**
     * Give Dai to an address
     * @param _account the account being given Dai tokens
     * @param _dai truffle-contract object of Dai
     * @param _quantity the number of Dai being minted
     * @param _minter account permitted to call mint
     */
    giveDai: async (_dai, _account, _quantity, _minter) => {
        await _dai.mint(_account, _quantity, { from: _minter });
    },

    /**
     * Get the Dai balance of an address
     * @param _dai truffle-contrcat object of Dai
     * @param _account the address being queried for balance
     * @return Dai token balance of the account, as a BN object
     */
    getDaiBalance: async (_dai, _account) => {
        return await _dai.balanceOf(_account);
    }
}