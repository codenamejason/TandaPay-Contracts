pragma solidity >= 0.4.0 < 0.7.0;

import './ITandaPayService.sol';
import './Group.sol';
import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract TandaPayService is ITandaPayService {
    
    event secretaryInstalled(address _group);
    
    mapping(uint => Group) groups;
    
     struct claim {
        address policyholder;
        claimState state;
    }
    
    struct period {
        periodState state;
        uint8 claimIndex;
        mapping(uint8 => claim) claims;
        mapping(address => uint8) openedClaim;
        mapping(address => policyholderState) policyholders;
        mapping(uint8 => uint8) defectionCount;
    }
    
    modifier isAdmin(address _query) {
        require(administrators[_query], "Address is not a TandaPay Administrator!");
        _;
    }
    
    modifier unlocked(address _group) {
        //require(Group(_group).periodState == periodState.POST, "Cannot remit timelocked contract until Post Period!");
        _;
    }
    
    constructor() public {
        administrators[msg.sender] = true;
        emit adminApproved(msg.sender);
    }
    
    function createGroup(address _to, uint8 _premium) public isAdmin(msg.sender) returns (address _group) {
        require(secretaries[_to] == address(0) , "Address is already a Secretary!");
        require(MIN_PREMIUM < _premium && _premium <= MAX_PREMIUM, "Premium is out of bounds! (Too high or low)");
        groups[groupCount] = new Group(_to, _premium);
        _group = address(groups[groupCount]);
        groupCount++;
        emit groupCreated(_group);
    }
    
    function removeSecretary(address _from) public isAdmin(msg.sender) {
        address groupAddress = secretaries[_from];
        require(groupAddress != address(0), "Address is not a Secretary!");
        Group(groupAddress).overthrow();
        secretaries[_from] = address(0);
        emit secretaryRevoked(_from, groupAddress);
    }
    
    /**
     * @dev only if group's original secretary was removed
     * Give a group a new secretary
     * @param _secretary the address being given the role of Secretary
     * @param _group the address of the Group contract
     **/
    function installSecretary(address _secretary, address _group) public isAdmin(msg.sender) {
        require(Group(_group).secretary() == address(this), "This Group is not owned by the TandaPayService!");
        Group(_group).install(_secretary);
        emit secretaryInstalled(_secretary);
    }
    
    function addAdmin(address _to) public isAdmin(msg.sender) {
        require(!administrators[_to], "Address is already an Administrator!");
        administrators[_to] = true;
        emit adminApproved(_to);
    }
    
    function removeAdmin(address _from) public isAdmin(msg.sender) {
        require(administrators[_from], "Address is not an Administrator!");
        administrators[_from] = false;
        emit adminRevoked(_from);
    }
    
    function remitGroup(address _group) public isAdmin(msg.sender) {
        Group tanda = Group(_group);
        period storage p = tanda.periods[tanda.periodIndex];
        //for(uint i = 0; i < tanda.)
    }
    
}
