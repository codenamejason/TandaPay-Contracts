pragma solidity >= 0.4.0 < 0.7.0;

import '../ITandaPayService.sol';
import './TestGroup.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 7.18.19
 * Tester for TandaPayService to allow Time Manipulation on live networks
 **/
contract TestService is ITandaPayService {
    
    constructor(address _dai) public {
        administrators[msg.sender] = true;
        Dai = IERC20(_dai);
        emit AdminApproved(msg.sender);
    }

    function addAdmin(address _to) public isAdmin() {
        require(!administrators[_to], "Address is already an Administrator!");
        administrators[_to] = true;
        emit AdminApproved(_to);
    }
    
    function removeAdmin(address _from) public isAdmin() {
        require(administrators[_from], "Address is not an Administrator!");
        delete administrators[_from];
        emit AdminRevoked(_from);
    }
    
    function createGroup(address _to, uint8 _premium) public isAdmin() returns (address _group) {
        require(groups[secretaries[_to]] == address(0), "Address is already a Secretary!");
        require(_premium == 1, "Kovan Test Service requires Premium of 1!");
        TestGroup group = new TestGroup(_to, _premium, address(Dai));
        groupCount.increment();
        _group = address(group);
        groups[groupCount.current()] = _group;
        secretaries[_to] = groupCount.current();
        emit GroupCreated(_group);
    }
    
    function removeSecretary(address _from) public isAdmin {
        address groupAddress = groups[secretaries[_from]];
        require(groupAddress != address(0), "Address is not a Secretary!");
        TestGroup(groupAddress).overthrow();
        delete secretaries[_from];
        emit SecretaryRevoked(_from, groupAddress);
    }
    
    function installSecretary(address _secretary, address _group) public isAdmin() {
        require(TestGroup(_group).secretary() == address(this), "This Group is not owned by the TandaPayService!");
        TestGroup(_group).install(_secretary);
        emit SecretaryInstalled(_secretary);
    }
    
    function processAll() public isAdmin {
        for(uint i = 0; i < groupCount.current(); i++) {
            if(TestGroup(groups[i]).remittable())
                remitGroup(groups[i]);
        }
    }
    
    function remitGroup(address _group) public isAdmin {
        TestGroup(_group).remit();
        emit Remitted(_group);
    }

    function loan(address _group) public isAdmin {}

    /**
     * @dev TESTSERVICE Function
     * Set the internal clock of a TestGroup
     * @param _group address of the TestGroup being time-tested
     * @param _time uint the UNIX time to set the internal clock to
     */
    function setTestClock(address _group, uint _time) public isAdmin {
        TestGroup(_group).setTime(_time);
    }

    /**
     * @dev TESTSERVICE Function
     * Increment the internal clock by _days days
     * @param _group address of the TestGroup being time-tested
     * @param _days uint the number of days to increment the internal clock
     */
     function passDaysTestClock(address _group, uint _days) public isAdmin {
        TestGroup(_group).passDays(_days);
     }

    /// VIEW ///

    /**
     * Return the number of deployed Groups
     * @return count uint Group index
     */
    function getCount() public view returns (uint count) {
        count = groupCount.current();
    }

    /**
     * Return the Group Contract address stored at _index in mapping groups
     * @param _index uint group index in TandaPayService
     * @return group address of Group Contract
     */
    function groupAddress(uint _index) public view returns (address group) {
        group = groups[_index];
    }

    /**
     * @dev TESTSERVICE Function
     * Get the current internal clock of a TestGroup
     * @param _group address of the group to query
     * @return time uint UNIX internal time of TestGroup
     */
    function getTestClock(address _group) public view returns (uint time) {
        time = TestGroup(_group).getTime();
    }
}
