pragma solidity ^0.5.0;
import "http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol";
import "http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Secondary.sol";
import "./TandaPayLedger.sol";
import "./User.sol";

contract GroupToken is ERC721Enumerable, Secondary {
    string private _name = "TandaPay Group";
    string private _symbol = "TANDA";
    Counters.Counter index;
    UserToken UserTokenContract;
    
    
    event NewGroup(uint _groupID, uint _secretaryID);

    uint constant GROUP_MAX = 55;

    mapping(uint => Group) groups;

    struct Policyholder {
        uint userID;
        uint groupIndex;
    }

    struct Group {
        string name;
        uint id;
        uint secretary;
        mapping(uint => Policyholder) policyholders;
    }

    constructor(address _usertoken) public {
        UserTokenContract = UserToken(_usertoken);
        index.increment();
    }

    function mintGroup(uint _secretaryID, string memory _groupname) public returns (uint id) {
        id = index.current();
        index.increment();
        super._mint(UserTokenContract.ownerOf(_secretaryID), id);
        groups[id].name = _groupname;
        groups[id].secretary = _secretaryID;
        emit NewGroup(id, _secretaryID);
        return id;
    }
    
    function mapPH(uint _groupID, uint _phID) public onlyPrimary {
        groups[_groupID].policyholders[_phID].userID = _phID;
    }
    
    
    ///commit premium
    ///remove
    ///insurance
}
