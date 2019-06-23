/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * TandaPayService.sol Smart Contract Driver
 */
const GroupContract = artifacts.require("Group");
const TandaPayServiceContract = artifacts.require('./TandaPayService');

module.exports = {

    /**
     * Create a new TandaPayService contract
     * @param _daiAddress the address of the deployed ERC20 contract for Dai
     * @param _admin web3 account object of address allowed to create new Tanda Groups
     * @return the truffle-contract object of TandaPayServoce
     */
    createService: async(_daiAddress, _admin) => {
        let TandaPayService = new TandaPayServiceContract(_daiAddress);
        return TandaPayService;
    },

    /**
     * Create a new TandaPay group
     * @param _service truffle-contract object of Group factory contract TandaPayService
     * @param _secretary web3 account object of address being given Secretary rights for this Tanda Group
     * @param _premium the number of Dai tokens, in BigNumber(BN), required to participate in the Group
     * @param _admin web3 account object of address allowed to create new Tanda Groups
     * @return truffle-contract object of newly created Group contract
     */
    createGroup: async (_service, _secretary, _premium, _admin) => {
        //console.log("Secretary: ", await _service.createGroup.sendTransaction);
        console.log(_premium.toNumber());
        console.log("service at: ", _service.createGroup)
        let createGroupTX = await _service.createGroup(_secretary, _premium, {from: _admin, gas: 6721975});
        console.log("2");
        console.log(createGroupTX);
    },

    /**
     * Add an admin account to a given TandaPayService
     * @param _service truffle-contract object of TandaPayService
     * @param _account the account being added as an administrator
     * @param _admin the account permitted for addAdmin
     */
    addAdmin: async(_service, _account, _admin) => {

    },

    /**
     * Remove an admin account from a given TandaPayService
     * @param _service truffle-contract object of TandaPayService
     * @param _account the account being removed from administrators
     * @param _admin the account permitted for removeAdmin
     */
    removeAdmin: async(_service, _account, _admin) => {

    },

    /**
     * Remove an account from secretary role in a given Group
     * @param _group truffle-contract object of Group
     * @param _admin the acocunt permitted for removeSecretary
     */
    removeSecretary: async(_group, _admin) => {

    },

    /**
     * Set a new secretary in a reposessed Group
     * @param _group truffle-contract object of Group
     * @param _account the account being added as secretary
     * @param _admin the account permitted for installSecretary
     */
    installSecretary: async(_group, _account, _admin) => {

    },

    /**
     * Remit a given Group's insurance escrow
     * @param _group truffle-contract object of Group
     * @param _admin the account permitted for CRON operations
     */
    remitGroup: async(_group, _admin) => {
    },

}