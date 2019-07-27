pragma solidity >= 0.4.0 < 0.7.0;

import './IGroup.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 7.26.19
 * TandaPay Group child contract
 **/
contract Group is IGroup {
    
    constructor(address _secretary, uint8 _premium, address _dai) public {
        secretary = _secretary;
        premium = _premium;
        Dai = IERC20(_dai);
    }
    
    function addPolicyholder(address _to, uint8 _subgroup) public onlySecretary correctPeriod(periodState.LOBBY) {
        require(policyholders[_to] == 0, "Policyholder already exists!");
        require(subgroupCounts[_subgroup].current() < 7, "Subgroup is full!");
        require(_subgroup <= subgroupIndex.current() + 1, "Incorrect subgroup serialization!");
        if (_subgroup == subgroupIndex.current())
            subgroupIndex.increment();
        policyholders[_to] = _subgroup;
        subgroupCounts[_subgroup].increment();
        groupSize.increment();
        emit PolicyholderAdded(_to);
    }
    
    function removePolicyholder(address _from) public onlySecretary correctPeriod(periodState.LOBBY) {
        require(policyholders[_from] != 0, "Policyholder does not exist!");
        
        subgroupCounts[policyholders[_from]].decrement();
        policyholders[_from] = 0;
        groupSize.decrement();
        emit PolicyholderRemoved(_from);
    }
    
    function changeSubgroup(address _policyholder, uint8 _subgroup) public onlySecretary correctPeriod(periodState.LOBBY) {
        require(subgroupCounts[_subgroup].current() < 7, "Subgroup is full!");
        
        subgroupCounts[policyholders[_policyholder]].decrement();
        subgroupCounts[_subgroup].increment();
        uint8 old = policyholders[_policyholder];
        policyholders[_policyholder] = _subgroup;
        emit SubgroupChange(_policyholder, old);
    }
    
    function lock() public onlySecretary lockable {
        if (isLoaned())
            payLoan();
        locks[uint(periodState.LOBBY)] = now;
        locks[uint(periodState.PRE)] = now.add(3 days);
        locks[uint(periodState.ACTIVE)] = now.add(27 days);
        locks[uint(periodState.POST)] = now.add(30 days);
        emit Locked();
    }
    
    function payPremium() public onlyPolicyholder correctPeriod(periodState.PRE) {
        require(participantToIndex[msg.sender] == 0, "Address has already paid premium as a Policyholder!");
        uint subgroup = subgroupCounts[policyholders[msg.sender]].current();
        uint overpayment = uint256(premium).div(subgroup);
        uint loanPayment = (loan.debt.div(loan.months)).div(groupSize.current());
        uint total = uint256(premium).add(overpayment).add(loanPayment);
        require(Dai.allowance(msg.sender, address(this)) >= total, "Insufficient Dai allowance for Tanda Insurance!");

        Dai.transferFrom(msg.sender, address(this), total);
        participantIndex.increment();
        activeParticipants[uint8(participantIndex.current())] = msg.sender;
        participantToIndex[msg.sender] = uint8(participantIndex.current());
        emit PremiumPaid(msg.sender);
    }
    
    function submitClaim(address _policyholder) public onlySecretary correctPeriod(periodState.ACTIVE) {
        
    }

    function defect() public activePolicyholder() correctPeriod(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        if(period.hasClaim[msg.sender] != 0)
            removeClaim(period.hasClaim[msg.sender]);
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
        return(timelock != 0 && timelock < now);
    }
    
    function remit() public onlyPrimary unlocked {
        stripToxicSubgroups();
        payClaims();
        payRefunds();
        unlock();
    }
    
    /**
     * @dev only internal
     * Remove all claims made from subgroups with intolerable defection rates
     **/
    function stripToxicSubgroups() internal {
        Period storage period = periods[uint16(periodIndex.current())];
        for(uint8 i = 1; i <= period.claimIndex.current(); i++) {
            address claim = period.claims[i];
            uint8 subgroup = policyholders[claim];
            if(toxicSubgroup[subgroup]) {
                emit ToxicClaimStripped(claim);
                removeClaim(i);
                i--;
                period.claimIndex.decrement();
            }
        }
    }

    /**
     * @dev only internal
     * Pay proportionate share of Dai to all Claimants
     **/
    function payClaims() internal {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 claimIndex = uint8(period.claimIndex.current());
        uint payout = getPayout();
        for(uint8 i = 1; i <= claimIndex; i++) {
            address claimant = period.claims[i];
            Dai.transfer(claimant, payout);
            removeParticipant(claimant);
        }
    }

    /**
     * @dev only internal
     * Attempt to pay back refunds to remaining policyholders
     **/
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
    
    /**
     * @dev internal only
     * Remove a claim made by a policyholder
     * Rearranges the Period's Claims to reflect change
     * @param _index the index of the claim being removed
     **/
    function removeClaim(uint8 _index) internal {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 claimIndex = uint8(period.claimIndex.current());
        address claimant = period.claims[claimIndex];
        period.claims[_index] = period.claims[claimIndex];
        address newClaimant = period.claims[claimIndex];
        delete period.claims[claimIndex];
        delete period.hasClaim[claimant];
        period.claimIndex.decrement();
        period.hasClaim[newClaimant] = claimIndex;
    }
    
    /**
     * @dev internal only
     * Remove a participant
     * Rearranges activeParticipants to reflect change
     * @param _participant the participant being removed from the Group
     **/
    function removeParticipant(address _participant) internal {
        uint8 index = participantToIndex[_participant];
        uint8 maxIndex = uint8(participantIndex.current());
        activeParticipants[index] = activeParticipants[maxIndex];
        delete activeParticipants[maxIndex];
        delete participantToIndex[_participant];
        participantToIndex[activeParticipants[index]] = index;
        participantIndex.decrement();
    }
    
    /**
     * @dev only internal
     * @dev modifier unlocked
     * Reset all timelocks to 0 and increment periodIndex
     **/
    function unlock() internal unlocked {
        delete locks[uint(periodState.LOBBY)];
        delete locks[uint(periodState.PRE)];
        delete locks[uint(periodState.ACTIVE)];
        delete locks[uint(periodState.POST)];
        periodIndex.increment();
    }

    function addLoan(uint _months, uint _debt) public {
        require(!isLoaned(), "Group has already recieved a loan!");
        loan.months = _months;
        loan.debt = _debt;
        emit Loaned();
    }

    /**
     * @dev internal only
     * Pay the monthly loan before locking
     */
    function payLoan() internal {
        require(isLoaned(), "Cannot pay loan when the Group is not in debt!");
        uint loanDebt = loan.debt.div(loan.months);
        require(Dai.balanceOf(address(this)) >= loanDebt, "Group is bankrupt and cannot pay loan!");
        Dai.transfer(primary(), loanDebt);
        loan.debt = loan.debt.sub(loanDebt);
        loan.months = loan.months.sub(1);
    }

    /// VIEW FUNCTIONS ///
    
    function isLoaned() public view returns (bool) {
        return (loan.debt > 0);
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
    function getPremium() public view onlyPolicyholder returns (uint8 _premium) {
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
     * Determine the UNIX timestamps that dictate the Group' s escrow timelocks
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
     * @param _index uint8 index of Claim in mapping claims
     * @return claimant address of Policyholder account that opened claim
     */
    function getClaim(uint8 _index) public view returns (address claimant) {
        Period storage period = periods[uint16(periodIndex.current())];
        return period.claims[_index];
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
        index = period.hasClaim[_query];
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
            if(locks[i] <= now && now < locks[i+1])
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
}
