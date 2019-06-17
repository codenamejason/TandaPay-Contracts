pragma solidity >= 0.4.0 < 0.7.0;

import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/drafts/Counters.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 6.17.19
 * Interface for main TandaPay service
 * Factory contract for groups
 * CRON/ Admin functionality
 **/
contract ITandaPayService {

    using Counters for Counters.Counter;

    ///EVENTS///
    event adminApproved(address _approved);
    event adminRevoked(address _revoked);
    event groupCreated(address _group);
    event secretaryRevoked(address _revoked, address _group);
    event secretaryInstalled(address _group);
    event remitted(address _group);

    ///MAPPING///
    mapping(address => bool) administrators;
    mapping(address => uint) secretaries;
    mapping(uint => address) groups;

    ///ADDRESSES///
    address constant kovan = 0xC4375B7De8af5a38a93548eb8453a498222C4fF2;
    address constant mainnet = 0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359;

    ///STRUCTS///
    struct Claim {
        address policyholder;
        claimState state;
    }
    
    struct Period {
        Counters.Counter claimIndex;
        mapping(uint8 => Claim) claims;
        mapping(address => uint8) openedClaim;
    }

    ///CONTRACTS///
    IERC20 Dai;
    Counters.Counter groupCount;
    
    ///ENUMERATIONS///
    enum periodState {LOBBY, PRE, ACTIVE, POST}
    enum claimState {REJECTED, OPEN, ACCEPTED}

    ///INTEGERS///
    uint8 constant MIN_PREMIUM = 5;
    uint8 constant MAX_PREMIUM = 50;

    ///MODIFIERS///
     modifier isAdmin() {
        require(administrators[msg.sender], "Address is not a TandaPay Administrator!");
        _;
    }

    ///FUNCTIONS///
    /**
     * @dev modifier onlyAdmin
     * Add an admin
     * @param _to the address being whitelisted
     * @dev add timelock
     **/
    function addAdmin(address _to) public;

    /**
     * @dev modifier onlyAdmin
     * Remove an admin
     * @param _from the address being blacklisted
     * @dev add timelock
     **/
    function removeAdmin(address _from) public;

    /**
     * @dev modifier isAdmin
     * @dev modifier validPremium
     * @dev construct new Group(_to, _premium)
     * Approve a secretary and create a new group
     * @param _to the address being given a secretary role
     * @param _premium the premium paid in Dai by all policyholders
     * @return _group the address of the Group contact
     **/
    function createGroup(address _to, uint8 _premium) public returns (address _group);

    /**
     * @dev modifier onlyAdmin
     * Remove secretary
     * @param _from the address being revoked the secretary role
     * @dev Ownership of Tanda group assigned to this contract
     **/
    function removeSecretary(address _from) public;
    
    /**
     * @dev modifier isAdmin
     * @dev only if group's construction Secretary was removed
     * Give a group a new secretary
     * @param _secretary the address being given the role of Secretary
     * @param _group the address of the Group contract
     **/
    function installSecretary(address _secretary, address _group) public;

    /**
     * @dev modifier onlyAdmin
     * Remit all groups available to be remitted
     * @dev gas-heavy failsafe, processAll should be done 'manually' by web3
     **/
    function processAll() public;

    /**
     * @dev modifier onlyAdmin
     * @dev modifier unlocked
     * Remit a single group assuming it is not timelocked
     * @param _group the address of the group being remitted
     **/
    function remitGroup(address _group) public;
    
    /**
     * @dev internal, called only by instantiation
     * Set the contract address for IERC20 Dai
     * @param _networkID the Network ID of the Ethereum Provider
     **/
    function determineDaiAddress(uint _networkID) internal;
}
