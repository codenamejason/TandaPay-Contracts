pragma solidity >= 0.4.0 < 0.7.0;

import '../IGroup.sol';
import './Timer.sol';


/**
 * @author blOX Consulting LLC.
 * Date: 7.15.19
 * Interface for TandaPay Group Tester 
 * Timelock is modified to allow testing
 **/
contract TestGroup is IGroup {

    Timer timer;
    Loan loan; //@dev working on loan now
    
    modifier correctPeriodTest(periodState _state) {
        require(locks[uint(_state)] > timer.getCurrent(), "Too late in period for this Action!");
        require(locks[uint(_state) - 1] <= timer.getCurrent(), "Too early in period for this Action!");
        _;
    }
    
    modifier unlocked() {
        require(locks[uint8(periodState.POST)] <= timer.getCurrent(),
            "Cannot perform remittance while Insurance escrow is timelocked!");
        _;
    }

    function isUnlocked() public view returns (bool) {
        return locks[uint8(periodState.POST)] <= timer.getCurrent();
    }

    constructor(address _secretary, uint8 _premium, address _dai) public {
        secretary = _secretary;
        premium = _premium;
        Dai = IERC20(_dai);
        timer = new Timer();
    }
    
    function addPolicyholder(address _to, uint8 _subgroup) public isSecretary() unlocked {
        require(policyholders[_to] == 0, "Policyholder already exists!");
        require(subgroupCounts[_subgroup].current() < 7, "Subgroup is full!");
        
        policyholders[_to] = _subgroup;
        subgroupCounts[_subgroup].increment();
        groupSize.increment();
        emit PolicyholderAdded(_to);
    }
    
    function removePolicyholder(address _from) public isSecretary() unlocked {
        require(policyholders[_from] != 0, "Policyholder does not exist!");
        
        subgroupCounts[policyholders[_from]].decrement();
        policyholders[_from] = 0;
        groupSize.decrement();
        emit PolicyholderRemoved(_from);
    }
    
    function changeSubgroup(address _policyholder, uint8 _subgroup) public isSecretary() unlocked {
        require(subgroupCounts[_subgroup].current() < 7, "Subgroup is full!");
        
        subgroupCounts[policyholders[_policyholder]].decrement();
        subgroupCounts[_subgroup].increment();
        uint8 old = policyholders[_policyholder];
        policyholders[_policyholder] = _subgroup;
        emit SubgroupChange(_policyholder, old);
    }
    
    function lock() public isSecretary() unlocked {
        require(groupSize.current() >= 50, "Insufficient size to begin pre-period!");
        require(locks[uint(periodState.POST)] <= timer.getCurrent(), "Group is already in an escrow cycle!");

        timer.setCurrent(now);
        locks[uint(periodState.LOBBY)] = timer.getCurrent();
        locks[uint(periodState.PRE)] = timer.getCurrent().add(3 days);
        locks[uint(periodState.ACTIVE)] = timer.getCurrent().add(27 days);
        locks[uint(periodState.POST)] = timer.getCurrent().add(30 days);
        emit Locked();
    }
    
    function payPremium() public isPolicyholder() correctPeriodTest(periodState.PRE) {
        require(participantToIndex[msg.sender] == 0, "Address has already paid premium as a Policyholder!");
        uint subgroup = subgroupCounts[policyholders[msg.sender]].current();
        uint overpayment = uint256(premium).div(subgroup);
        uint total = uint256(premium).add(overpayment);
        require(Dai.allowance(msg.sender, address(this)) >= total, "Insufficient Dai allowance for Tanda Insurance!");

        Dai.transferFrom(msg.sender, address(this), total);
        participantIndex.increment();
        activeParticipants[uint8(participantIndex.current())] = msg.sender;
        participantToIndex[msg.sender] = uint8(participantIndex.current());
        emit PremiumPaid(msg.sender);
    }
    
    function openClaim() public activePolicyholder() correctPeriodTest(periodState.ACTIVE) {
        Period storage period = periods[uint16(periodIndex.current())];
        require(period.openedClaim[msg.sender] == 0, "Claimant already has an existing Claim!");
        
        period.claimIndex.increment();
        uint8 index = uint8(period.claimIndex.current());
        period.claims[index].policyholder = msg.sender;
        period.claims[index].state = claimState.OPEN;
        period.openedClaim[msg.sender] = index;
        emit ClaimOpened(msg.sender);
    }

    function rejectClaim(address _claimant) public isSecretary() correctPeriodTest(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 index = period.openedClaim[_claimant];
        require(index != 0, "Policyholder does not have an existing Claim!");
        require(period.claims[index].state != claimState.REJECTED, "Can only reject open Claims!");
        
        period.claims[index].state = claimState.REJECTED;
        emit ClaimRejected(_claimant);
    }

    function approveClaim(address _claimant) public isSecretary() correctPeriodTest(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 index = period.openedClaim[_claimant];
        require(index != 0, "Policyholder does not have existing claim!");
        require(period.claims[index].state != claimState.REJECTED, "Can only approve open Claims!");
        
        period.claims[index].state = claimState.ACCEPTED;
        emit ClaimApproved(_claimant);
    }
    
    function defect() public activePolicyholder() correctPeriodTest(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        if(period.openedClaim[msg.sender] != 0)
            removeClaim(period.openedClaim[msg.sender]);
        uint8 subgroup = policyholders[msg.sender];
        Counters.Counter storage subgroupDefectionCount = defectionCount[subgroup];
        subgroupDefectionCount.increment();
        if(subgroupDefectionCount.current() >= DEFECTION_THRESHOLD)
            toxicSubgroup[subgroup] = true;
        Dai.transfer(msg.sender, premium);
        removeParticipant(msg.sender);
        emit Defected(msg.sender);
    }
    
    function overthrow() public onlyPrimary {
        emit Overthrown(secretary);
        secretary = primary();
    }
    
    function install(address _secretary) public onlyPrimary {
        require(secretary == primary(), "This contract is not owned by the TandaPayService!");
        secretary = _secretary;
        emit Installed(secretary);
    }
    
    function remittable() public view returns (bool) {
        uint timelock = locks[uint(periodState.POST)];
        return(timelock != 0 && timelock < timer.getCurrent());
    }
    
    function remit() public onlyPrimary unlocked {
        stripToxicSubgroups();
        payClaims();
        payRefunds();
        unlock();
    }
    
    function stripToxicSubgroups() internal {
        Period storage period = periods[uint16(periodIndex.current())];
        for(uint8 i = 1; i <= period.claimIndex.current(); i++) {
            Claim storage claim = period.claims[i];
            uint8 subgroup = policyholders[claim.policyholder];
            if(toxicSubgroup[subgroup]) {
                emit ToxicClaimStripped(claim.policyholder);
                removeClaim(i);
                i--;
                period.claimIndex.decrement();
            }
        }
    }

    function payClaims() internal {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 claimIndex = uint8(period.claimIndex.current());
        uint payout = getPayout();
        for(uint8 i = 1; i <= claimIndex; i++) {
            address claimant = period.claims[i].policyholder;
            Dai.transfer(claimant, payout);
            removeParticipant(claimant);
        }
    }
    
    function payRefunds() internal {
        if(Dai.balanceOf(address(this)) > 0) {
            uint8 participantsLength = uint8(participantIndex.current());
            uint share = Dai.balanceOf(address(this)).div(participantsLength);
            for(uint8 i = 1; i <= participantsLength; i++) {
                address participant = activeParticipants[i];
                Dai.transfer(participant, share);
                delete activeParticipants[i];
                delete participantToIndex[participant];
                participantIndex.decrement();
            }
        }
    }
    
    function removeClaim(uint8 _index) internal {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 claimIndex = uint8(period.claimIndex.current());
        address claimant = period.claims[claimIndex].policyholder;
        period.claims[_index] = period.claims[claimIndex];
        address newClaimant = period.claims[claimIndex].policyholder;
        delete period.claims[claimIndex];
        delete period.openedClaim[claimant];
        period.claimIndex.decrement();
        period.openedClaim[newClaimant] = claimIndex;
    }
    
    function removeParticipant(address _participant) internal {
        uint8 index = participantToIndex[_participant];
        uint8 maxIndex = uint8(participantIndex.current());
        activeParticipants[index] = activeParticipants[maxIndex];
        delete activeParticipants[maxIndex];
        delete participantToIndex[_participant];
        participantToIndex[activeParticipants[index]] = index;
        participantIndex.decrement();
    }
    
    function unlock() internal unlocked {
        delete locks[uint(periodState.LOBBY)];
        delete locks[uint(periodState.PRE)];
        delete locks[uint(periodState.ACTIVE)];
        delete locks[uint(periodState.POST)];
        periodIndex.increment();
    }

    /// VIEW FUNCTIONS ///
    
    function isLoaned() public view returns (bool) {
        return (loan.deficit > 0);
    }

    /**
     * Determine the number of Policyholder addresses a Secretary has added to their Group
     * @return uint16 the number of whitelisted Policyholder addresses
     */
    function size() public view returns (uint16) {
        return uint16(groupSize.current());
    }
    
    /**
     * Determine the full premium payment that must be made to the Group escrow
     * @return _premium uint8 value in Dai that a policyholder must pay
     */
    function getPremium() public view isPolicyholder returns (uint8 _premium) {
        uint subgroup = subgroupCounts[policyholders[msg.sender]].current();
        uint overpayment = uint256(premium).div(subgroup);
        uint total = uint256(premium).add(overpayment);
        _premium = uint8(total);
    }

    /**
     * Determine the number of members within a given subgroup
     * @param _subgroup uint8 index to be queried in mapping subgroupCounts
     * @return uint8 number of Policyholders in the specified subgroup
     */
    function getSubgroupCount(uint8 _subgroup) public view returns (uint8) {
        return uint8(subgroupCounts[_subgroup].current());
    }

    /**
     * Determine whether the address queried is a Premium-Paid Policyholder in this Group
     * @return true if the address has Paid a Dai premium for the escrow in this Group this Period
     */
    function isActive(address _query) public view returns (bool) {
        return (participantToIndex[_query] != 0);
    }

    /**
     * Determine whether the address queried is a Policyholder in this Group
     * return true if the address is a Policyholder, and false otherwise
     */
    function isPH(address _query) public view returns (bool) {
        return (policyholders[_query] != 0);
    }

    /**
     * Determine the UNIX timestamps that dictate the Group's escrow timelocks
     * @return pre uint UNIX time when the PRE period begins
     * @return active uint UNIX time when the PRE period ends and the ACTIVE period begins
     * @return post uint UNIX time when the ACTIVE period ends and the POST period begins
     * @return unlockLobby uint UNIX time when the POST period ends and the TandaPayService can remit the Group's escrow
     */
    function getLocks() public view returns (uint pre, uint active, uint post, uint unlockLobby) {
        pre = locks[0];
        active = locks[1];
        post = locks[2];
        unlockLobby = locks[3];
    }

    /**
     * Determine how many policyholders have paid their premiums in the current period
     * @return index uint8 index in mapping activeParticipants
     */
    function getParticipantIndex() public view returns (uint8 index) {
        index = uint8(participantIndex.current());
    }

    /**
     * Determine the associated information of a given Claim in the given Period
     * @dev claimState: [0, 1, 2] :: [REJECTED, OPEN, ACCEPTED]
     * @param _index uint8 index of Claim in mapping claims
     * @return claimant address of Policyholder account that opened claim
     * @return uint state the state of the Claim in the Group
     */
    function getClaim(uint8 _index) public view returns (address claimant, uint state) {
        Period storage period = periods[uint16(periodIndex.current())];
        Claim memory claim = period.claims[_index];
        claimant = claim.policyholder;
        state = uint(claim.state);
    }

    /**
     * Determine the current Claim index of the current Period
     * @return index uint8 current index in mapping claims
     */
    function getClaimIndex() public view returns (uint8 index) {
        Period storage period = periods[uint16(periodIndex.current())];
        index = uint8(period.claimIndex.current());
    }

    /**
     * Determine the Claim associated with a given policyholder in the current Group
     * @dev should be 0 if address has not opened a claim this period
     * @param _query the address being used as a key to search for a Claim
     * @return index uin8 index of Claim in mapping claims
     */
    function addressToClaim(address _query) public view returns (uint8 index) {
        Period storage period = periods[uint16(periodIndex.current())];
        index = period.openedClaim[_query];
    }

    /**
     * Determine the current payout for a single claimant
     * @dev counts all claims with state ACCEPTED and OPEN
     * @return uint16 value of Dai that will be transferred to claimants
     */
    function getPayout() public view returns (uint16) {
        uint index = getClaimIndex();
        if(index == 0)
            index = index.add(1);
        uint maxPayout = uint256(premium).mul(25);
        uint payout = Dai.balanceOf(address(this)).div(index);
        if(payout > maxPayout)
            payout = maxPayout;
        return uint16(payout);
    }

    /**
     * Determine the period number of this Group contract
     * @dev should be 0 if lock() has never been called
     * @return period uint16 period index 
     */
    function getPeriod() public view returns (uint16 period) {
        return uint16(periodIndex.current());
    }

    /**
     * Determine the current periodState as an unsigned integer
     * @dev [0, 1, 2, 3] :: [PRE, ACTIVE, POST, LOBBY]
     * @return state uint8 integer representation of period state
     */
    function uintGetPeriodState() public view returns (uint8 state) {
        for(uint8 i = 0; i < 3; i++) {
            if(locks[i] <= timer.getCurrent() && timer.getCurrent() < locks[i+1])
                return (i);
        }
        return (3);
    }

    /**
     * determine the current periodState as a periodState enumeration
     * @return state periodState of Group
     */
    function getSubperiod() public view returns (periodState state) {
        uint8 subperiod = uintGetPeriodState();
        if(subperiod == 0) {
            return periodState.PRE;
        } else if(subperiod == 1) {
            return periodState.ACTIVE;
        } else if(subperiod == 2) {
            return periodState.POST;
        } else {
            return periodState.LOBBY;
        }
    }

    /**
     * @dev TESTSERVICE Function
     * Set the internal clock of the TestGroup
     * @param _time uint UNIX time value to set TestGroup's internal clock
     */
    function setTime(uint _time) public {
        timer.setCurrent(_time);
    }

    /**
     * @dev TESTSERVICE Function
     * Get the TestGroup's current internal clock value
     * @return current uint the TestGroup's current internal time
     */
    function getTime() public view returns (uint current) {
        current = timer.getCurrent();
    }

    /**
     * @dev TESTSERVICE Function
     * Increment the TestGroup's internal clock by _days days
     * @param _days uint number of days to increment
     */
    function passDays(uint _days) public {
        timer.incrementDays(_days);
    }
}
