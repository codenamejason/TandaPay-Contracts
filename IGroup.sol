pragma solidity >= 0.4.0 < 0.7.0;

import "./TandaLibrary.sol";

/**
 * @author blOX Consulting LLC.
 * Date: 06.09.2019
 * Interface for TandaGroups
 * For Secretary Group management/ Policyholder Subgroup management 
 **/
contract IGroup {
    
    ///EVENTS///
    event created(address _secretary);
    event policyholderAdded(address _secretary, address _policyholder);
    event policyholderRemoved(address _secretary, address _policyholder);
    event subgroupChange(address _secretary, address _policyholder);
    
    ///MAPPING///
    mapping(address => TandaLibrary.group) groups;
    mapping(address => address) policyholderToGroup;
    
    ///FUNCTIONS///

    /**
     * @dev sender must be approved to be Secretary
     * @dev sender must not already have an existing groups
     * Create a new Tanda groups
     * @param _premium the premium paid by the Policyholder
     * @dev TandaLibrary.MIN_PREMIUM <= _premium <= TandaLibrary.MAX_PREMIUM
     **/
    function create(uint8 _premium) public;
    
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
}

