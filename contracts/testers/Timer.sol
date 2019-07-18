pragma solidity >= 0.4.0 < 0.7.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/ownership/Secondary.sol';

/**
 * Contract for simulating/ manipulating time lock
 */
contract Timer is Secondary {

    using SafeMath for uint;

    uint private current;
    
    /**
     * Set the current time to be reflected in the TandaPay Group
     * @param _time uint UNIX time
     */
    function setCurrent(uint _time) public onlyPrimary {
        current = _time;
    }

    /**
     * Increment the current time reflected in the TandaPay Group
     * @dev Can only increment by days
     * @param _time the number of days to increment the internal clock
     */
    function incrementDays(uint _time) public onlyPrimary {
        current = current.add(_time);
    }

    /**
     * Get the current time reflected in the TandaPay Group
     * @return uint UNIX time
     */
    function getCurrent() public view onlyPrimary returns (uint) {
        return current;
    }
}