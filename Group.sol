pragma solidity >= 0.4.0 < 0.7.0;

import './IGroup.sol';
import 'http://github.com/OpenZeppelin/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract Group is IGroup {
    
    IERC20 Dai;
    
    timelock locks;
    
    modifier activePolicyholder(address _query) {
        require(periods[periodIndex].policyholders[_query] == policyholderState.PAID,
            "Policyholder is not active in the current Period!");
        _;
    }
    
    modifier correctPeriod(periodState _state) {
        require(periods[periodIndex].state == _state, "Incorrect period state for this action!");
        _;
    }
    
    modifier isSecretary(address _query) {
        require(secretary == _query, "Address is not this Group's Secretary!");
        _;
    }
    
    modifier isPolicyholder(address _query) {
        require(policyholders[_query] != 0, "Address is not a Policyholder in this Group!");
        _;
    }
    
    constructor(address _secretary, uint8 _premium) public {
        secretary = _secretary;
        premium = _premium;
        toggleKovan();
    }
    
    function addPolicyholder(address _to, uint8 _subgroup) public isSecretary(msg.sender) correctPeriod(periodState.NONE) {
        require(policyholders[_to] == 0, "Policyholder already exists!");
        require(subgroupCounts[_subgroup] < 7, "Subgroup is full!");
        policyholders[_to] = _subgroup;
        subgroupCounts[_subgroup]++;
        emit policyholderAdded(_to);
    }
    
    function removePolicyholder(address _from) public isSecretary(msg.sender) correctPeriod(periodState.NONE) {
        require(policyholders[_from] != 0, "Policyholder does not exist!");
        subgroupCounts[policyholders[_from]]--;
        policyholders[_from] = 0;
        emit policyholderRemoved(_from);
    }
    
    function changeSubgroup(address _policyholder, uint8 _subgroup) public isSecretary(msg.sender) correctPeriod(periodState.NONE){
        require(subgroupCounts[_subgroup] < 7, "Subgroup is full!");
        subgroupCounts[policyholders[_policyholder]]--;
        subgroupCounts[_subgroup]++;
        policyholders[_policyholder] = _subgroup;
        emit subgroupChange(_policyholder, _subgroup);
    }
    
    function lock() public isSecretary(msg.sender) correctPeriod(periodState.NONE) {
        require(size >= 50, "Insufficient size to begin pre-period!");
        locks.pre = now + 3 days;
        locks.active = now + 27 days;
        locks.post = now + 30 days;
        emit locked(locks.pre, locks.active, locks.post);
    }
    
    function payPremium() public isPolicyholder(msg.sender) correctPeriod(periodState.PRE) {
        uint8 overpayment = (premium / subgroupCounts[policyholders[msg.sender]]);
        require(Dai.balanceOf(msg.sender) >= premium + overpayment, "Insufficient Dai balance for Tanda Insurance!");
        Dai.approve(address(this), premium + overpayment);
        Dai.transferFrom(msg.sender, address(this), premium + overpayment);
        activeParticipants[participantIndex] = msg.sender;
        participantToIndex[msg.sender] = participantIndex++;
        emit premiumPaid(msg.sender);
    }
    
    function openClaim() public activePolicyholder(msg.sender) correctPeriod(periodState.ACTIVE) {
        require(periods[periodIndex].openedClaim[msg.sender] != 0, "Claimant already has an existing Claim!");
        uint8 index = periods[periodIndex].claimIndex++;
        periods[periodIndex].claims[index].policyholder = msg.sender;
        periods[periodIndex].claims[index].state = claimState.OPEN;
        emit claimOpened(msg.sender);
    }

    function rejectClaim(uint8 _index) public isSecretary(msg.sender) correctPeriod(periodState.POST) {
        require(periods[periodIndex].claims[_index].state != claimState.REJECTED, "Can only reject open Claims!");
        periods[periodIndex].claims[_index].state = claimState.REJECTED;
        emit claimRejected(periods[periodIndex].claims[_index].policyholder);
    }

    function approveClaim(uint8 _index) public isSecretary(msg.sender) correctPeriod(periodState.POST) {
        require(periods[periodIndex].claims[_index].state != claimState.REJECTED, "Can only approve open Claims!");
        periods[periodIndex].claims[_index].state = claimState.ACCEPTED;
        emit claimApproved(periods[periodIndex].claims[_index].policyholder);
    }
    
    function defect() public activePolicyholder(msg.sender) correctPeriod(periodState.POST) {
        periods[periodIndex].claims[periods[periodIndex].openedClaim[msg.sender]].state = claimState.REJECTED;
        periods[periodIndex].defectionCount[policyholders[msg.sender]]++;
        uint8 index = participantToIndex[msg.sender];
        activeParticipants[index] = activeParticipants[participantIndex];
        participantToIndex[activeParticipants[participantIndex--]] = index;
        Dai.transfer(msg.sender, premium);
        emit defected(msg.sender);
    }
    
    /**
     * @dev move to interface?
     * @dev more workshopping: eject contract? coast til end?
     * Give secretary rights to the TandaPayService contract
     * Admins can reassign the role using TandaPayService at an arbitrary time
     **/
    function overthrow() public onlyPrimary {
        secretary = primary();
    }
    
    /**
     * @dev move to interface
     * install a 
     **/
    function install(address _secretary) public onlyPrimary {
        require(secretary == primary(), "This contract is not owned by the TandaPayService!");
        secretary = _secretary;
    }
    
    /**
     * @dev to be removed in Draft 2
     * Set the Dai IERC20 contract to track the Ethereum mainnent Dai Stablecoin
     **/
    function toggleMainnet() public onlyPrimary {
        Dai = IERC20(0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);
    }
    
    /**
     * @dev to be removed in Draft 2
     * @dev standard constructor call
     * Set the Dai IERC20 contract to track the Kovan Dai Stablecoin
     **/
    function toggleKovan() public onlyPrimary {
        Dai = IERC20(0xC4375B7De8af5a38a93548eb8453a498222C4fF2);
    }
}
