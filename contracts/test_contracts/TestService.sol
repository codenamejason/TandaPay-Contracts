pragma solidity >= 0.4.0 < 0.7.0;

import '../IService.sol';
import './TestGroup.sol';

/**
 * @author blOX Consulting LLC
 * Date: 08.26.2019
 * Implementation of Insurance Service/ Group Factory Contract
 */
contract TestService is IService {

    ///MODIFIERS///
     modifier onlyAdmin() {
        require(administrators[msg.sender], "Address is not a TandaPay Administrator!");
        _;
    }

    ///CONSTRUCTOR///
    
    /**
     * Construct a new Insurace Service
     * @param _dai address of the Dai ERC20 token
     */
    constructor(address _dai) public {
        administrators[msg.sender] = true;
        Dai = IERC20(_dai);
        emit AdminApproved(msg.sender);
    }

    ///INTERFACE MUTABLE IMPLEMENTATION///

    function addAdmin(address _to) public onlyAdmin {
        require(!administrators[_to], "Address is already an Administrator!");
        administrators[_to] = true;
        emit AdminApproved(_to);
    }

    function removeAdmin(address _from) public onlyAdmin {
        require(administrators[_from], "Address is not an Administrator!");
        delete administrators[_from];
        emit AdminRevoked(_from);
    }

    function createGroup(address _to, uint _volume, uint _payout) public returns (address _group) {
        require(groups[secretaries[_to]] == address(0), "Address is already a Secretary!");
        TestGroup group = new TestGroup(address(Dai), _to, _volume, _payout);
        groupCount = groupCount.add(1);
        _group = address(group);
        groups[groupCount] = _group;
        secretaries[_to] = groupCount;
        emit GroupCreated(_group);
    }

    function remitGroup(address _group) public onlyAdmin {
        uint period = (TestGroup(_group).activePeriod()).sub(1);
        TestGroup(_group).endPeriod(period);
        emit Remitted(_group, period);
    }

    function addPolicyholderToGroup(address _group, address _to, uint _subgroup) public onlyAdmin {
        TestGroup(_group).addPolicyholder(_to, _subgroup);
    }

    function changeSubgroupInGroup(address _group, address _to, uint _subgroup) public onlyAdmin {
        TestGroup(_group).changeSubgroup(_to, _subgroup);
    }

    function loan(address _group, uint _months) public {
        uint endowment = TestGroup(_group).calculateEndowment(_months);
        require(Dai.balanceOf(address(this)) >= endowment, "Insufficient Dai to make Loans!");
        require(!TestGroup(_group).loaned(), "Cannot loan to a group twice!");

        address secretary = TestGroup(_group).getSecretary();
        Dai.transfer(secretary, endowment);
        TestGroup(_group).makeLoan(endowment, _months);
        emit Loaned(_group);
    }

    ///INTERFACE VIEWABLE IMPLEMENTATION///

    function isAdmin(address _query) public view returns (bool) {
        return administrators[_query];
    }

    function isSecretary(address _query) public view returns (uint _index) {
        return secretaries[_query];
    }

    function getGroup(uint _index) public view returns (address _group) {
        return groups[_index];
    }

    function getGroupCount() public view returns (uint _index) {
        return groupCount;
    }
}