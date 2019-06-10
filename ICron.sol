pragma solidity >= 0.4.0 < 0.7.0;

import "./TandaLibrary.sol";

/**
 * @author blOX Consulting LLC.
 * Date: 06.09.2019
 * Interface for Cron (Time-based events)
 **/
contract ICRON {
    
    ///EVENTS///
    event remitted(address _secretary);
    
    ///MAPPINGS///
    //mapping(address => Timelock) timelocks;
    
    ///FUNCTIONS///
    /**
     * @dev modifier unlocked
     * Remit a group's claims with the corresponding timelock
     * @param the address of the secretary to remit for
     **/
    function remit(address _secretary) public;
    
    /**
     * @dev called by remit()
     * Pays out defections and strips claims in toxic subgroups
     **/
    function processDefections() internal;
    
    /**
     * @dev called by remit()
     * Process all of the remaining claims
     **/
    function processClaims() internal;
    
    /**
     * @dev called by processClaims()
     * Process a single claim given that it is valid
     * @param _claim the claim being processed
     * @param _payout the value of Dai being paid in the claim
     **/
    function processClaim(TandaLibrary.claim memory _claim, uint8 _payout) internal;
    
    /**
     * @dev called by remit()
     * If possible, refund the Dai to each policyholder
     **/
    function refunds() internal;
}

