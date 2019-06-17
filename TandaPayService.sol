pragma solidity >= 0.4.0 < 0.7.0;

import './ITandaPayService.sol';
import './Group.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 6.17.19
 * Implementation of main TandaPay service
 **/
contract TandaPayService is ITandaPayService {
    
    constructor() public {
        administrators[msg.sender] = true;
        determineDaiAddress(42); //pass in as constructor argument?
        emit adminApproved(msg.sender);
    }
    
    function createGroup(address _to, uint8 _premium) public isAdmin() returns (address _group) {
        require(groups[secretaries[_to]] == address(0) , "Address is already a Secretary!");
        require(MIN_PREMIUM < _premium && _premium <= MAX_PREMIUM, "Premium is out of bounds! (Too high or low)");
        Group group = new Group(_to, _premium, address(Dai));
        _group = address(group);
        groups[groupCount.current()] = _group;
        secretaries[_to] = groupCount.current();
        groupCount.increment();
        emit groupCreated(_group);
    }
    
    function removeSecretary(address _from) public isAdmin() {
        address groupAddress = groups[secretaries[_from]];
        require(groupAddress != address(0), "Address is not a Secretary!");
        Group(groupAddress).overthrow();
        delete secretaries[_from];
        emit secretaryRevoked(_from, groupAddress);
    }
    
    function installSecretary(address _secretary, address _group) public isAdmin() {
        require(Group(_group).secretary() == address(this), "This Group is not owned by the TandaPayService!");
        Group(_group).install(_secretary);
        emit secretaryInstalled(_secretary);
    }
    
    function addAdmin(address _to) public isAdmin() {
        require(!administrators[_to], "Address is already an Administrator!");
        administrators[_to] = true;
        emit adminApproved(_to);
    }
    
    function removeAdmin(address _from) public isAdmin() {
        require(administrators[_from], "Address is not an Administrator!");
        administrators[_from] = false;
        emit adminRevoked(_from);
    }
    
    function processAll() public isAdmin() {
        for(uint i = 0; i < groupCount.current(); i++) {
            if(Group(groups[i]).remittable())
                remitGroup(groups[i]);
        }
    }
    
    function remitGroup(address _group) public isAdmin() {
        Group(_group).remit();
        emit remitted(_group);
    }
    
    ///@dev Change later to best practice
    function determineDaiAddress(uint _networkID) internal {
        Dai = IERC20(kovan);
    }
    
}
