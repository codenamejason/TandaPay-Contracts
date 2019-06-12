pragma solidity >= 0.4.0 < 0.7.0;

import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 6.12.19
 * Interface for main TandaPay service
 * Factory contract for groups
 * CRON/ Admin functionality
 **/
contract ITandaPayService {

    ///EVENTS///
    event adminApproved(address _approved);
    event adminRevoked(address _revoked);
    event groupCreated(address _group, address _secretary);
    event secretaryRevoked(address _revoked);
    event remitted(address _group);

    ///MAPPING///
    mapping(address => bool) admin;
    mapping(address => address) approvedSecretaries;
    mapping(address => address) approvedPolicyholders;

    ///CONTRACTS///
    IERC20 Dai;

    ///ENUMERATIONS///
    enum policyholderState {UNPAID, PAID, DEFECTED}
    enum periodState {PRE, ACTIVE, POST}
    enum claimState {REJECTED, OPEN, ACCEPTED}

    ///INTEGERS///
    uint8 constant MIN_PREMIUM = 5;
    uint8 constant MAX_PREMIUM = 50;

    ///ADDRESSES///
    address constant kovan = 0xc4375b7de8af5a38a93548eb8453a498222c4ff2;
    address constant mainnet = 0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359;
    address[] groupContracts;

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
     * @dev modifier onlyAdmin
     * @dev modifier validPremium
     * Approve a secretary and create a group
     * @param _to the address being given a secretary role
     * @param _group the address of the constructed group
     **/
    function addGroup(address _to, uint8 premium) public returns (address _group);

    /**
     * @dev modifier onlyAdmin
     * Remove secretary
     * @param _from the address being revoked the secretary role
     * @dev Ownership of Tanda group assigned to this contract
     **/
    function removeSecretary(address _from) public;

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
     * @dev called by remitGroup()
     * Pays out defections and strips claims in toxic subgroups
     * @return _group the address of the group being remitted
     **/
    function processDefections() internal returns (address _group);

    /**
     * @dev called by remitGroup()
     * Process all of the remaining claims
     * @param _group the address of the group being remitted
     * @param _payout the value being paid out in the claim
     **/
    function processClaims(address _group, uint16 _payout) internal;

    /**
     * @dev called by remitGroup()
     * If possible, refund an equal portion of the Dai to each policyholder
     * @param _group the group being refunded
     **/
    function processRefunds(address _group) internal;
}

