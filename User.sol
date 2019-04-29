pragma solidity ^0.5.0;
import "http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol";
import "http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/ownership/Secondary.sol";
import "./TandaPayLedger.sol";
import "./Groups.sol";

contract UserToken is ERC721Enumerable, Secondary {
    string private _name = "TandaPay USER";
    string private _symbol = "USER";
    Counters.Counter index;

    event NewSecretary(uint _userID);
    event NewPolicyholder(uint _userID, uint _groupID);
    
    mapping(uint => User) users;

    struct User {
        address account;
        uint group;
        uint id;
        bool secretary; //insecure, for demo purposes
    }

    function mintSecretary(address _to) public onlyPrimary returns (uint id) {
        id = Counters.current(index);
        index.increment();
        super._mint(_to, id);
        users[id].account = _to;
        users[id].id = id;
        users[id].secretary = true;
        emit NewSecretary(id);
    }
    

    function mintPolicyholder(address _to, uint _groupID) public onlyPrimary returns (uint id) {
        id = index.current();
        index.increment();
        super._mint(_to, id);
        users[id].account = _to;
        users[id].id = id;
        emit NewPolicyholder(id, _groupID);
    }

    /**
     * @dev Gets the token name.
     * @return string representing the token name
     */
    function name() external view returns (string memory) {
        return _name;
    }

    /**
     * @dev Gets the token symbol.
     * @return string representing the token symbol
     */
    function symbol() external view returns (string memory) {
        return _symbol;
    }
    
}
