pragma solidity >= 0.4.0 < 0.7.0;

import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Secondary.sol';
import './TandaLibrary.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 06.09.2019
 * Interface for Dai Timelock
 * 1 deployed per group, makes the Dai inacessable for 27 days
 * Completely remits on the 30th day
 **/
contract ITimelock is Secondary {
    
    ///CONTRACTS///
    IERC20 Dai;
    
    ///EVENTS
    event locked(address _secretary, uint timelock);
    
    ///STATE VARIABLES///
    address secretary;
    uint256 timelock;
    uint8 premium;
    

    ///FUNCTIONS///
    
    /**
     * Lock the funds that have been sent to this address
     **/
    function lock() public;
    
    
}

