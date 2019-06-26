pragma solidity >= 0.4.0 < 0.7.0;

import './ITandaPayService.sol';
import './Group.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 6.20.19
 * Implementation of main TandaPay service
 **/
contract TandaPayService is ITandaPayService {
    
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
        require(MIN_PREMIUM < _premium && _premium <= MAX_PREMIUM, "Premium is out of bounds! (Too high or low)");
        Group group = new Group(_to, _premium, address(Dai));
        groupCount.increment();
        _group = address(group);
        groups[groupCount.current()] = _group;
        secretaries[_to] = groupCount.current();
        emit GroupCreated(_group);
    }
    
    function removeSecretary(address _from) public isAdmin {
        address groupAddress = groups[secretaries[_from]];
        require(groupAddress != address(0), "Address is not a Secretary!");
        Group(groupAddress).overthrow();
        delete secretaries[_from];
        emit SecretaryRevoked(_from, groupAddress);
    }
    
    function installSecretary(address _secretary, address _group) public isAdmin() {
        require(Group(_group).secretary() == address(this), "This Group is not owned by the TandaPayService!");
        Group(_group).install(_secretary);
        emit SecretaryInstalled(_secretary);
    }
    
    function processAll() public isAdmin {
        for(uint i = 0; i < groupCount.current(); i++) {
            if(Group(groups[i]).remittable())
                remitGroup(groups[i]);
        }
    }
    
    function remitGroup(address _group) public isAdmin {
        Group(_group).remit();
        emit Remitted(_group);
    }

    function loan(address _group) public isAdmin {}
}
