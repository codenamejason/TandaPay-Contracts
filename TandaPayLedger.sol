pragma solidity >=0.5.0;
import "./ITandaPayLedger.sol";
import "./User.sol";
import "./Groups.sol";
import "http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
* @title TandaPay Ledger
* @author blOX Consulting
*/
contract TandaPayLedger is ITandaPayLedger, Ownable {
    
    address constant DAI_ADDRESS = 0xC4375B7De8af5a38a93548eb8453a498222C4fF2;
    
    mapping(string => address) usernameResolver;
    mapping(string => uint) groupNameResolver;
    
    UserToken UserTokenContract;
    GroupToken GroupTokenContract;
    ERC20 DaiTokenContract;
    
    modifier onlySecretary(uint _groupID, address _user) {
        address secretary = GroupTokenContract.ownerOf(_groupID);
        require(secretary != address(0x00), "TANDA ERC721: No secretary at group mapping");
        require(secretary == _user, "TANDA ERC721: Permission denied, not the group's secretary!");
        _;
    }
    
    constructor() public {
        UserTokenContract = new UserToken();
        emit UserTokenInitialized(address(UserTokenContract), address(this));
        GroupTokenContract = new GroupToken(address(UserTokenContract));
        emit GroupTokenInitialized(address(GroupTokenContract), address(this));
        DaiTokenContract = ERC20(DAI_ADDRESS);
        emit TandaPayLedgerInitialized(address(this), msg.sender);
    }
    
    function createNewTandaGroup(string memory _name) public returns (uint id) {
        require(groupNameResolver[_name] == 0, "TPL: A group with this name exists!");
        uint _secretaryID = UserTokenContract.mintSecretary(msg.sender);
        uint _groupID = GroupTokenContract.mintGroup(_secretaryID, _name);
        groupNameResolver[_name] = _groupID;
        UserTokenContract.mintPolicyholder(msg.sender, _groupID);
        return groupNameResolver[_name];
    }
    
    function addPolicyHolder(uint _groupID, address _address) public onlySecretary(_groupID, msg.sender) returns (uint id) {
        //require(groups[_groupID].policyholders[GROUP_MAX - 1] == 0, "TANDA ERC721: Tanda is at maximum capacity!");
        uint _newPH = UserTokenContract.mintPolicyholder(_address, _groupID);
        GroupTokenContract.mapPH(_groupID, _newPH);
        return _newPH;
    }
}

