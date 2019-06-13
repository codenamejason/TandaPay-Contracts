pragma solidity >= 0.4.0 < 0.7.0;

import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Secondary.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 06.12.2019
 * Interface for TandaGroups
 * User services: Policyholder and Secretary
 * Groups are deployed for secretaries by TandaPayService
 **/
contract IGroup is Secondary {
    
    ///EVENTS///
    event policyholderAdded(address _policyholder);
    event policyholderRemoved(address _policyholder);
    event subgroupChange(address _policyholder);
    event premiumPaid(address _policyholder);
    event locked(uint timelock);
    event refund();
    event activePeriod();
    event postPeriod();
    event claimOpened(address _policyholder);
    event claimRejected(address _policyholder);
    event claimApproved(address _policyholder);
    event defected(address _defector);

    ///MAPPINGS///
    mapping(address => uint8) policyholders;
    mapping(uint16 => period) periods;

    ///ADDRESSES///
    address this;
    address secretary;
    address[] activeParticipants;

    ///ENUMERATIONS///
    enum policyholderState {UNPAID, PAID, DEFECTED}
    enum periodState {PRE, ACTIVE, POST}
    enum claimState {REJECTED, OPEN, ACCEPTED}

    ///INTEGERS///
    uint8 premium;
    uint8 size;
    uint16 periodIndex;
    uint timelock;

    ///STRUCTS///
    struct claim {
        address policyholder;
        claimState state;
    }
    
    struct period {
        periodState state;
        claim[] claims;
        mapping(address => policyholderState) policyholders;
        mapping(uint8 => uint8) defectionCount;
    }

    ///FUNCTIONS///
    /**
     * @dev modifier onlySecretary
     * Add a Policyholder to the group
     * @param _to the address of the Policyholder being added
     * @param _subgroup the subgroup they are to be added to
     **/
    function addPolicyholder(address _to, uint8 _subgroup) public;
    
    /**
     * @dev modifier onlySecretary
     * Remove a Policyholder from the group
     * @param _from the address of the Policyholder being removed
     **/
    function removePolicyholder(address _from) public;
    
    /**
     * @dev modifier onlySecretary
     * Change the subgroup of a given policyholder
     * @param _policyholder the address of the policyholder switching groups
     * @param _subgroup the subgroup being switched to
     **/
    function changeSubgroup(address _policyholder, uint8 _subgroup) public;

    /**
     * @dev modifier onlyPolicyholder
     * Policyholder pays their premium for the month
     **/
    function payPremium() public;
    
    /**
     * @dev modifier onlySecretary, prePeriod
     * Secretary activates the 27 day insurance contract
     * Premiums are locked into this group's address
     * @dev restrictions on participant #?
     **/
    function startPeriod() public;
    
    /**
     * @dev modifier onlyPolicyholder, activePeriod
     * Policyholder opens a new claim
     **/
    function openClaim() public;
    
    /**
     * @dev function onlySecretary, activePeriod
     * Secretary rejects a claim
     * @param _index the index of the claim within the period
     **/
    function rejectClaim(uint _index) public;
    
    /**
     * @dev function onlySecretary, activePeriod
     * Secretary approves a claim
     * @param _index the index of the claim being approved
     **/
    function approveClaim(uint _index) public;
    
    /**
     * @dev function onlyPolicyholder, postPeriod
     * Policyholder defects from the Tanda Group
     * @dev automatically remit and eject
     **/
    function defect() public;
}
