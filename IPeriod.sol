pragma solidity >= 0.4.0 < 0.7.0;

import "./TandaLibrary.sol";

/**
 * @author blOX Consulting LLC.
 * Date: 06.09.2019
 * Interface for Periods
 * For claim data & policyholder's money movements
 **/
contract IPeriod {
    
    ///EVENTS///
    event premiumPaid(address _policyholder);
    event activePeriod(address _secretary);
    event postPeriod(address _secretary);
    event claimOpened(address _policyholder);
    event claimRejected(address _policyholder);
    event claimApproved(address _policyholder);
    event defected(address _defector);

    ///MAPPINGS///
    mapping(address => mapping(uint => TandaLibrary.period)) periods;
    mapping(address => address[]) participants;
    
    ///FUNCTIONS///
    /**
     * @dev modifier onlyPolicyholder
     * Policyholder pays their premium for the month
     **/
    function payPremium() public;
    
    /**
     * @dev modifier onlySecretary, prePeriod
     * Secretary activates the 27 day insurance contract
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
     * Policyholder defects from the insurance contract
     **/
    function defect() public;
}

