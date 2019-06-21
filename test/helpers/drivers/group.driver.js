/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * Groups.sol Smart Contract Driver
 */
module.exports = {

    /**
     * Return the secretary of an arbitrary Tanda Group
     * @param _group truffle-contract object of the Tanda Group contract
     * @return the address specified as the Group's secretary
     */
    getSecretary: async (_group) => {
        return await _group.secretary();
    },

     /**
     * Add a single policyholder to the Tanda Group
     * @param _group truffe-contract object of Group contract
     * @param _policyholder the web3 account object of the Policyholder being added
     * @param _subgroup the uint subgroup id to assign to the Policyholder
     * @param _secretary the web3 account object of the Secretary of _group
     * @return the signed transaction object created by truffle
     */
    addPolicyholder: async (_group, _policyholder, _subgroup, _secretary) => {
        let tx = await _group.addPolicyholder(_policyholder.address, _subgroup, { from: _secretary.address });
        console.log(this.addedPolicyholderAddress(tx))
    },

    /**
     * Get the address of a group created by a transaction object
     * @dev assumes TX is valid
     * @param tx the transaction being mined for data
     * @return the address of the newly deployed Group contract
     */
    addedPolicyholderAddress: async (tx) => { 
        return tx.logs.filter(logs => logs.event == 'PolicyholderAdded')[0].args._group; 
    },
}