/**
 * @author blOX Consulting LLC
 * @date 06.25.19
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
     * Get the premium of a given Group contract
     * @param _group truffle-contract object of Group
     * @return the value of premium, as a BN object
     */
    getPremium: async (_group) => {
        return await _group.getPremium();
    },

    /**
     * Add a single policyholder to the Tanda Group
     * @param _group truffe-contract object of Group contract
     * @param _policyholder the web3 account object of the Policyholder being added
     * @param _subgroup the uint subgroup id to assign to the Policyholder
     * @param _secretary the web3 account object of the Secretary of _group
     * @return the truffle-contract transaction object from the blockchain
     */
    addPolicyholder: async (_group, _policyholder, _subgroup, _secretary) => {
        return await _group.addPolicyholder(_policyholder, _subgroup, { from: _secretary });
    },

    /**
     * Remove a policyholder from a given Group contract
     * @param _group truffle-contract object of Group
     * @param _policyholder account being removed form policyholder role
     * @param _secretary account permitted to call removePolicyholder
     */
    removePolicyholder: async (_group, _policyholder, _secretary) => {
        return await _group.removePolicyholder(_policyholder, {from: _secretary});
    },

    /**
     * Change the subgroup of a policyholder in a given Group contract
     * @param _group truffle-contract object of Group
     * @param _policyholder policyholder account switching subgroup
     * @param _subgroup the subgroup the policyholder is switching to
     * @param _secretary account permitted to call changeSubgroup
     */
    changeSubgroup: async (_group, _policyholder, _subgroup, _secretary) => {
        return await _group.changeSubgroup(_policyholder, _subgroup, {from: _secretary});
    },

    /**
     * Lock an escrow contract in a given Group, begin active phase
     * @param _group truffle-contract object of Group
     * @param _secretary account permitted to call lock
     */
    lock: async (_group, _secretary) => {
        return await _group.lock({from: _secretary});
    },

    /**
     * Pay a premium in a given Group as a policyholder
     * @param _group truffle-contract object of Group
     * @param _policyholder account permitted to call payPremium
     */
    payPremium: async (_group, _policyholder) => {
        return await _group.payPremium({from: _policyholder})
    },

    /**
     * Open a claim in a given Group as a policyholder
     * @param _group truffle-contract object of Group
     * @param _policyholder account permitted to call openClaim
     */
    openClaim: async (_group, _policyholder) => {
        return await _group.openClaim({from: _policyholder});
    },

    /**
     * Reject a claim in a given Group contract
     * @param _group truffle-contract object of Group
     * @param _claimant policyholder address identifying claim
     * @param _secretary account permitted to call rejectClaim
     */
    rejectClaim: async (_group, _claimant, _secretary) => {

    },

    /**
     * Approve a claim in a given Group contract
     * @param _group truffle-cotnract object of Group
     * @param _claimant policyholder address identifying claim
     * @param _secretary account permitted to call approveClaim
     */
    approveClaim: async (_group, _claimant, _secretary) => {

    },

    /**
     * Defect from a given Group contract as a policyholder
     * @param _group truffle-contract object of Group
     * @param _policyholder account permitted to call defect
     */
    defect: async (_group, _policyholder) => {
        return await _group.defect({from: _policyholder});
    },

    /**
     * Determine whether a Group contract's escrow is ready to remit
     * @param _group truffle-contract object of Group
     * @return true if the timelock has expired, and false otherwise
     */
    remittable: async(_group) => {

    }
}