pragma solidity >= 0.4.0 < 0.7.0;

import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * Contract for simulating/ manipulating time lock
 */
contract Timer {

    using SafeMath for uint;

    uint private current;
    
    /**
     * Set the current time to be reflected in the TandaPay Group
     * @param _time uint UNIX time
     */
    function setCurrent(uint _time) public {
        current = _time;
    }

    /**
     * Increment the current time reflected in the TandaPay Group
     * @dev Can only increment by days
     * @param _time the number of days to increment the internal clock
     */
    function incrementDays(uint _time) public {
        uint unix = _time.mul(1 days);
        current = current.add(unix);
    }

    /**
     * Get the current time reflected in the TandaPay Group
     * @return uint UNIX time
     */
    function getCurrent() public view returns (uint) {
        return current;
    }
}