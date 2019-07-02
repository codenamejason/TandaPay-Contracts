/**
 * @author blOX Consulting LLC
 * @date 06.25.19
 * TandaPayService.sol Smart Contract Driver
 */
const GroupContract = artifacts.require("./Group");
const TandaPayService = artifacts.require('./TandaPayService');

module.exports = {

    /**
     * Return the TandaPayService Contract deployed in migrations
     * @return the truffle-contract object of the TandaPayService Contract
     */
    deploy: async() => {
        return await TandaPayService.deployed();
    },

    /**
     * Create a new TandaPay group
     * @param _service truffle-contract object of Group factory contract TandaPayService
     * @param _secretary web3 account object of address being given Secretary rights for this Tanda Group
     * @param _premium the number of Dai tokens, in BigNumber(BN), required to participate in the Group
     * @param _admin the account permitted for createGroup
     * @return truffle-contract object of newly created Group contract
     */
    createGroup: async (_service, _secretary, _premium, _admin) => {
        let tx = await _service.createGroup(_secretary, _premium, {from: _admin});
        let address = tx.logs.filter(log => log.event == 'GroupCreated')[0].args._group;
        return await GroupContract.at(address);
    },

    /**
     * Add an admin account to a given TandaPayService
     * @param _service truffle-contract object of TandaPayService
     * @param _account the account being added as an administrator
     * @param _admin the account permitted for addAdmin
     * @return the truffle-contract transaction object from the blockchain
     */
    addAdmin: async(_service, _account, _admin) => {
        return await _service.addAdmin(_account, {from: _admin});
    },

    /**
     * Remove an admin account from a given TandaPayService
     * @param _service truffle-contract object of TandaPayService
     * @param _account the account being removed from administrators
     * @param _admin the account permitted for removeAdmin
     * @return the truffle-contract transanction object from the blockchain
     */
    removeAdmin: async(_service, _account, _admin) => {
        return await _service.removeAdmin(_account, {from: _admin});
    },

    /**
     * Remove an account from secretary role in a given Group
     * @param _service truffle-contract object of TandaPayService
     * @param _group truffle-contract object of Group
     * @param _admin the acocunt permitted for removeSecretary
     * @return the truffle-contract transaction object from the blockchain
     */
    removeSecretary: async(_service, _group, _admin) => {
        let secretary = await _group.secretary();
        return await _service.removeSecretary(secretary, {from: _admin});
    },

    /**
     * Set a new secretary in a reposessed Group
     * @param _service truffle-contract object of TandaPayService
     * @param _group truffle-contract object of Group
     * @param _account the account being added as secretary
     * @param _admin the account permitted for installSecretary
     * @return the truffle-contract transaction object from the blockchain
     */
    installSecretary: async(_service, _group, _account, _admin) => {
        return await _service.installSecretary(_account, _group.address, {from: _admin});
    },

    /**
     * Remit a given Group's insurance escrow
     * @param _service truffle-contract object of TandaPayService
     * @param _group truffle-contract object of Group
     * @param _admin the account permitted for CRON operations (remitting escrow)
     */
    remitGroup: async(_service, _group, _admin) => {
        return await _service.remitGroup(_group.address, {from: _admin});
    },

}