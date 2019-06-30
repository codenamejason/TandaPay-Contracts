pragma solidity >= 0.4.0 < 0.7.0;

import './IGroup.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 6.20.19
 * Interface for TandaPay Group child contract
 **/
contract Group is IGroup {

    Loan loan;
    
    constructor(address _secretary, uint8 _premium, address _dai) public {
        secretary = _secretary;
        premium = _premium;
        Dai = IERC20(_dai);
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
        require(locks[uint(periodState.POST)] <= now, "Group is already in an escrow cycle!");
        locks[uint(periodState.LOBBY)] = now;
        locks[uint(periodState.PRE)] = now + 3 days;
        locks[uint(periodState.ACTIVE)] = now + 27 days;
        locks[uint(periodState.POST)] = now + 30 days;
        emit Locked();
    }
    
    function payPremium() public isPolicyholder() correctPeriod(periodState.PRE) {
        uint8 overpayment = uint8(premium / subgroupCounts[policyholders[msg.sender]].current());
        uint8 total = premium + overpayment;
        require(Dai.allowance(msg.sender, address(this)) >= total, "Insufficient Dai allowance for Tanda Insurance!");
        Dai.transferFrom(msg.sender, address(this), total);
        participantIndex.increment();
        activeParticipants[uint8(participantIndex.current())] = msg.sender;
        participantToIndex[msg.sender] = uint8(participantIndex.current());
        emit PremiumPaid(msg.sender);
    }
    
    function openClaim() public activePolicyholder() correctPeriod(periodState.ACTIVE) {
        Period storage period = periods[uint16(periodIndex.current())];
        require(period.openedClaim[msg.sender] == 0, "Claimant already has an existing Claim!");
        
        period.claimIndex.increment();
        uint8 index = uint8(period.claimIndex.current());
        period.claims[index].policyholder = msg.sender;
        period.claims[index].state = claimState.OPEN;
        period.openedClaim[msg.sender] = index;
        emit ClaimOpened(msg.sender);
    }

    function rejectClaim(address _claimant) public isSecretary() correctPeriod(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 index = period.openedClaim[_claimant];
        require(index != 0, "Policyholder does not have an existing Claim!");
        require(period.claims[index].state != claimState.REJECTED, "Can only reject open Claims!");
        
        period.claims[index].state = claimState.REJECTED;
        emit ClaimRejected(_claimant);
    }

    function approveClaim(address _claimant) public isSecretary() correctPeriod(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 index = period.openedClaim[_claimant];
        require(index != 0, "Policyholder does not have existing claim!");
        require(period.claims[index].state != claimState.REJECTED, "Can only approve open Claims!");
        
        period.claims[index].state = claimState.ACCEPTED;
        emit ClaimApproved(_claimant);
    }
    
    function defect() public activePolicyholder() correctPeriod(periodState.POST) {
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
    
    function remittable() public view onlyPrimary returns (bool) {
        uint timelock = locks[uint(periodState.POST)];
        return(timelock != 0 && timelock < now);
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
            if(toxicSubgroup[subgroup]){
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
        if(claimIndex > 0) {
            uint8 maxPayout = premium * 25;
            uint8 claimIndex = uint8(period.claimIndex.current());
            uint8 share = uint8(Dai.balanceOf(address(this))) / claimIndex; // this will throw with 0 claims
            if(share > maxPayout)
                share = maxPayout;
            for(uint8 i = 0; i < claimIndex; i++) {
                address claimant = period.claims[i].policyholder;
                Dai.transfer(claimant, share);
                removeParticipant(claimant);
            }
        }
    }
    
    function payRefunds() internal {
        if(Dai.balanceOf(address(this)) > 0) {
            uint8 participantsLength = uint8(participantIndex.current());
            uint share = Dai.balanceOf(address(this)) / participantsLength;
            for(uint8 i = 0; i < participantsLength; i++) {
                address participant = activeParticipants[i];
                Dai.transfer(participant, share);
                delete participantToIndex[participant];
                delete activeParticipants[i];
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
        period.claimIndex.decrement();
        delete period.openedClaim[claimant];
        period.openedClaim[newClaimant] = claimIndex;
    }
    
    function removeParticipant(address _participant) internal {
        uint8 index = participantToIndex[_participant];
        uint8 maxIndex = uint8(participantIndex.current());
        activeParticipants[index] = activeParticipants[maxIndex];
        delete activeParticipants[maxIndex];
        participantToIndex[activeParticipants[index]] = index;
        delete participantToIndex[_participant];
        participantIndex.decrement();
    }
    
    function unlock() internal unlocked {
        delete locks[uint(periodState.LOBBY)];
        delete locks[uint(periodState.PRE)];
        delete locks[uint(periodState.ACTIVE)];
        delete locks[uint(periodState.POST)];
        periodIndex.increment();
    }

    function isLoaned() public view returns (bool) {
        return (loan.deficit > 0);
    }

    ///DEV///

    function size() public view returns (uint) {
        return groupSize.current();
    }

    function getPremium() public view returns (uint) {
        uint8 overpayment = uint8(premium / subgroupCounts[policyholders[msg.sender]].current());
        return (premium + overpayment);
    }

    function getSubgroupCount(uint8 _subgroup) public view returns (uint) {
        return subgroupCounts[_subgroup].current();
    }

    function isActive(address _query) public view returns (bool) {
        return (participantToIndex[_query] != 0);
    }

    function isPH(address _query) public view returns (bool) {
        return (policyholders[_query] != 0);
    }

    function getLocks() public view returns (uint pre, uint active, uint post, uint unlockPeriod) {
        pre = locks[0];
        active = locks[1];
        post = locks[2];
        unlockPeriod = locks[3];
    }

    function getPeriodIndex() public view returns (uint index) {
        index = periodIndex.current();
    }

    function getClaim(uint8 index) public view returns (address claimant, uint state) {
        Period storage period = periods[uint16(periodIndex.current())];
        Claim memory claim = period.claims[index];
        claimant = claim.policyholder;
        state = uint(claim.state);
    }

    function getClaimIndex() public view returns (uint index) {
        Period storage period = periods[uint16(periodIndex.current())];
        index = period.claimIndex.current();
    }

    function addressToClaim(address _query) public view returns (uint index) {
        Period storage period = periods[uint16(periodIndex.current())];
        index = period.openedClaim[_query];
    }

    function getPayout() public view returns (uint payout) {
        uint index = getClaimIndex();
        uint maxPayout = premium * 25;
        if(index == 0)
            index++; // dont divide by 0, @dev hacky
        payout = Dai.balanceOf(address(this)) / index;
        if(payout > maxPayout)
            payout = maxPayout;
    }
}
