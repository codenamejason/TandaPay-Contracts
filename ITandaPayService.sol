pragma solidity >= 0.4.0 < 0.7.0;

import "./TandaLibrary.sol";

/**
 * @author blOX Consulting LLC.
 * Date: 6.8.19
 * Interface for main TandaPay service. Would store references to all of the other contracts.
 **/
contract ITandaPayService {
    
    ///EVENTS///
    event adminAdded(address _added);
    event adminRemoved(address _removed);
    event secretaryApproved(address _approved);
    event secretaryRevoked(address _revoked);
    
    ///MAPPING///
    mapping(address => bool) admin;
    mapping(address => bool) approvedSecretaries;
    
    ///CONTRACTS///
    //Group GroupContract;
    //Period PeriodContract;
    //Cron CronContract;
    
    ///FUNCTIONS///
    
    /**
     * @dev modifier onlyAdmin
     * Add an admin 
     * @param _to the address being whitelisted
     **/
    function addAdmin(address _to) public;
    
    /**
     * @dev modifier onlyAdmin
     * Remove an admin
     * @param _from the address being blacklisted
     **/
    function removeAdmin(address _from) public;
     
    /**
     * @dev modifier onlyAdmin
     * Approve a secretary to create a group
     **/
    function addSecretary(address _to) public;
      
    /**
     * @dev modifier onlyAdmin
     * Remove secretary group privledge
     **/
    function removeSecretary(address _from) public;
    
}

