pragma solidity >= 0.4.0 < 0.7.0;

import 'openzeppelin-solidity/contracts/ownership/Secondary.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import 'openzeppelin-solidity/contracts/drafts/Counters.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
/**
 * @author blOX Consulting LLC.
 * Date: 07.11.2019
 * Interface for TandaPay Groups
 * User services: Policyholder and Secretary
 * Groups are deployed for secretaries by TandaPayService
 **/
contract IGroup is Secondary {
    
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    
    ///EVENTS///(
    event Loaned();
    event PolicyholderAdded(address _policyholder);
    event PolicyholderRemoved(address _policyholder);
    event SubgroupChange(address _policyholder, uint8 _oldSubgroup);
    event PremiumPaid(address _policyholder);
    event Locked();
    event ClaimOpened(address _policyholder);
    event ClaimRejected(address _policyholder);
    event ClaimApproved(address _policyholder);
    event Defected(address _defector);
    event Overthrown(address _secretary);
    event Installed(address _secretary);
    event ToxicClaimStripped(address _policyholder);

    ///MAPPINGS///
    mapping(address => uint8) policyholders;
    mapping(uint8 => Counters.Counter) subgroupCounts;
    mapping(uint8 => Counters.Counter) defectionCount;
    mapping(uint8 => bool) toxicSubgroup;
    mapping(uint16 => Period) periods;
    mapping(uint8 => address) activeParticipants;
    mapping(address => uint8) participantToIndex;
    mapping(uint => uint) locks;

    ///CONTRACTS///
    IERC20 Dai;
    Counters.Counter groupSize;
    Counters.Counter periodIndex;
    Counters.Counter participantIndex;
    Counters.Counter subgroupIndex;
    
    ///ADDRESSES///
    address public secretary;

    ///ENUMERATIONS///
    enum periodState {LOBBY, PRE, ACTIVE, POST}

    ///INTEGERS///
    uint8 premium;
    uint8 constant DEFECTION_THRESHOLD = 2;

    ///STRUCTS///
    
    struct Period {
        Counters.Counter claimIndex;
        mapping(uint8 => address) claims;
        mapping(address => uint8) hasClaim;
    }

    struct Loan {
        uint months;
        uint debt;
    }

    Loan loan;

    ///MODIFIERS///
    modifier onlySecretary() {
        require(secretary == msg.sender, "Address is not this Group's Secretary!");
        _;
    }
    
    modifier onlyPolicyholder() {
        require(policyholders[msg.sender] != 0, "Address is not a Policyholder in this Group!");
        _;
    }
    
    modifier activePolicyholder() {
        require(participantToIndex[msg.sender] != 0, "Policyholder is not active in the current Period!");
        _;
    }
    
    modifier correctPeriod(periodState _state) {
        require(locks[uint(_state)] > now , "Too late in period for this Action!");
        require(locks[uint(_state) - 1] <= now, "Too early in period for this Action!");
        _;
    }
    
    modifier unlocked() {
        require(locks[uint8(periodState.POST)] <= now,
            "Cannot perform remittance while Insurance escrow is timelocked!");
        _;
    }

    modifier lockable() {
        bool lock = true;
        for (uint i = 0; i < subgroupIndex.current(); i++) {
            if (subgroupCounts[uint8(i)].current() < 4 || subgroupCounts[uint8(i)].current() > 7)
                lock = false;
        }
        require(lock, "Invalid subgroup configuration!");
        require(groupSize.current() >= 50, "Insufficient size to begin pre-period!");
        require(locks[uint(periodState.POST)] <= now, "Group is already in an escrow cycle!");
        if (loan.months == 0)
            require(loan.debt == 0, "Group is bankrupt and cannot be locked!");
        _;
    }

    ///FUNCTIONS///

    /**
     * @dev onlyPrimary
     * @dev must fail isLoaned()
     * @dev modifier correctPeriod(periodState.LOBBY)
     * Lend Group Dai from TandaPayService
     * @param _months uint the number of months this group has to repay a loan
     * @param _debt uint the number of Dai loaned to this group
     */
    function addLoan(uint _months, uint _debt) public;

    /**
     * @dev view only
     * Determine whether or not a Group is currently the beneficiary of a loan
     */
    function isLoaned() public view returns (bool);

    /**
     * @dev modifier isSecretary
     * @dev modifier correctPeriod(periodState.LOBBY)
     * Add a Policyholder to the group
     * @param _to the address of the Policyholder being added
     * @param _subgroup the subgroup they are to be added to
     **/
    function addPolicyholder(address _to, uint8 _subgroup) public;
    
    /**
     * @dev modifier isSecretary
     * @dev modifier correctPeriod(periodState.LOBBY)
     * Remove a Policyholder from the group
     * @param _from the address of the Policyholder being removed
     **/
    function removePolicyholder(address _from) public;
    
    /**
     * @dev modifier isSecretary
     * @dev modifier correctPeriod(periodState.LOBBY)
     * Change the subgroup of a given policyholder
     * @param _policyholder the address of the policyholder switching groups
     * @param _subgroup the subgroup being switched to
     **/
    function changeSubgroup(address _policyholder, uint8 _subgroup) public;

    /**
     * @dev modifier isSecretary
     * @dev ensure groupSize >= 50, group is not in escrow, subgroup counts are okay
     * Lock all funds in the Insurance smart contract
     */
    function lock() public;

    /**
     * @dev modifier isPolicyholder
     * @dev modifier correctPeriod(periodState.PRE)
     * Policyholder pays their Dai Premium to the Group contract for escrow 
     **/
    function payPremium() public;
    
    /**
     * @dev modifier isSecretary
     * @dev modifier correctPeriod(periodState.ACTIVE)
     * Secretary whitelists a new claim
     **/
    function submitClaim(address _policyholder) public;
    
    /**
     * @dev modifier activePolicyholder
     * @dev modifier correctPeriod(periodState.POST)
     * Policyholder defects from the Tanda Group
     **/
    function defect() public;
    
    /**
     * @dev modifier onlyPrimary
     * Determine whether a group is ready to be remitted from escrow
     * @return true if the group is ready to remit, and false otherwise
     **/
    function remittable() public view returns (bool);
    
    /**
     * @dev modifier onlyPrimary
     * @dev must pass remittable
     * Remit this group's Insurance Escrow
     **/
    function remit() public;

    /**
     * @dev modifier onlyPrimary
     * Give secretary rights to the TandaPayService contract
     **/
    function overthrow() public;
    
    /**
     * @dev modifier onlyPrimary
     * @dev can only be called if Secretary is TandaPayService
     * Change the secretary of this group
     * @param _secretary the address being authorized as Secretary in this Group contract
     **/
    function install(address _secretary) public;
}
