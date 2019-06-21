/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * TandaPayService.sol Smart Contract Driver
 */
const GroupContract = artifacts.require("Group");

module.exports = {

    /**
     * Create a new TandaPay group
     * @param _service truffle-contract object of Group factory contract TandaPayService
     * @param _secretary web3 account object of address being given Secretary rights for this Tanda Group
     * @param _premium the number of Dai tokens, in BigNumber(BN), required to participate in the Group
     * @param _admin web3 account object of address allowed to create new Tanda Groups
     * @return truffle-contract object of newly created Group contract
     */
    createGroup: async (_service, _secretary, _premium, _adminAccount) => {
        let createGroupTX = await _service.createGroup(_secretary.address, _premium, {from: _adminAccount });
        let address = module.exports.groupCreatedAddress(createGroupTX);
        let group = GroupContract.at(address);
        return group;
    },

    /**
     * Get the address of a group created by a transaction object
     * @dev assumes TX is valid
     * @param tx the transaction being mined for data
     * @return the address of the newly deployed Group contract
     */
    groupCreatedAddress: (tx) => { 
        return tx.logs.filter(logs => logs.event == 'GroupCreated')[0].args._group; 
    },
    

}