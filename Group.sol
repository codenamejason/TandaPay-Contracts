pragma solidity >= 0.4.0 < 0.7.0;

import './IGroup.sol';

/**
 * @author blOX Consulting LLC.
 * Date: 6.17.19
 * Interface for TandaPay Group child contract
 **/
contract Group is IGroup {
    
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
        emit policyholderAdded(_to);
    }
    
    function removePolicyholder(address _from) public isSecretary() unlocked {
        require(policyholders[_from] != 0, "Policyholder does not exist!");
        
        subgroupCounts[policyholders[_from]].decrement();
        policyholders[_from] = 0;
        emit policyholderRemoved(_from);
    }
    
    function changeSubgroup(address _policyholder, uint8 _subgroup) public isSecretary() unlocked {
        require(subgroupCounts[_subgroup].current() < 7, "Subgroup is full!");
        
        subgroupCounts[policyholders[_policyholder]].decrement();
        subgroupCounts[_subgroup].increment();
        uint8 old = policyholders[_policyholder];
        policyholders[_policyholder] = _subgroup;
        emit subgroupChange(_policyholder, old);
    }
    
    function lock() public isSecretary() unlocked {
        require(groupSize.current() >= 50, "Insufficient size to begin pre-period!");
        require(locks[uint(periodState.POST)] <= now, "Group is already in an escrow cycle!");
        locks[uint(periodState.LOBBY)] = now;
        locks[uint(periodState.PRE)] = now + 3 days;
        locks[uint(periodState.ACTIVE)] = now + 27 days;
        locks[uint(periodState.POST)] = now + 30 days;
        emit locked();
    }
    
    function payPremium() public isPolicyholder() correctPeriod(periodState.PRE) {
        uint8 overpayment = uint8(premium / subgroupCounts[policyholders[msg.sender]].current());
        require(Dai.balanceOf(msg.sender) >= premium + overpayment, "Insufficient Dai balance for Tanda Insurance!");
        
        Dai.approve(address(this), premium + overpayment);
        Dai.transferFrom(msg.sender, address(this), premium + overpayment);
        participantIndex.increment();
        activeParticipants[uint8(participantIndex.current())] = msg.sender;
        participantToIndex[msg.sender] = uint8(participantIndex.current());
        emit premiumPaid(msg.sender);
    }
    
    function openClaim() public activePolicyholder() correctPeriod(periodState.ACTIVE) {
        Period storage period = periods[uint16(periodIndex.current())];
        require(period.openedClaim[msg.sender] == 0, "Claimant already has an existing Claim!");
        
        period.claimIndex.increment();
        uint8 index = uint8(period.claimIndex.current());
        period.claims[index].policyholder = msg.sender;
        period.claims[index].state = claimState.OPEN;
        emit claimOpened(msg.sender);
    }

    function rejectClaim(address _claimant) public isSecretary() correctPeriod(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 index = period.openedClaim[_claimant];
        require(index != 0, "Policyholder does not have an existing Claim!");
        require(period.claims[index].state != claimState.REJECTED, "Can only reject open Claims!");
        
        period.claims[index].state = claimState.REJECTED;
        emit claimRejected(_claimant);
    }

    function approveClaim(address _claimant) public isSecretary() correctPeriod(periodState.POST) {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 index = period.openedClaim[_claimant];
        require(index != 0, "Policyholder does not have existing claim!");
        require(period.claims[index].state != claimState.REJECTED, "Can only approve open Claims!");
        
        period.claims[index].state = claimState.ACCEPTED;
        emit claimApproved(_claimant);
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
        emit defected(msg.sender);
    }
    
    function overthrow() public onlyPrimary {
        emit overthrown(secretary);
        secretary = primary();
    }
    
    function install(address _secretary) public onlyPrimary {
        require(secretary == primary(), "This contract is not owned by the TandaPayService!");
        secretary = _secretary;
        emit installed(secretary);
    }
    
    function remittable() public onlyPrimary returns (bool) {
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
                emit toxicClaimStripped(claim.policyholder);
                removeClaim(i);
                i--;
                period.claimIndex.decrement();
            }
        }
    }
    
    function payClaims() internal {
        Period storage period = periods[uint16(periodIndex.current())];
        uint8 maxPayout = premium * 25;
        uint8 claimIndex = uint8(period.claimIndex.current());
        uint8 share = uint8(Dai.balanceOf(address(this))) / claimIndex;
        if(share > maxPayout)
            share = maxPayout;
        for(uint8 i = 0; i < claimIndex; i++) {
            address claimant = period.claims[i].policyholder;
            Dai.transfer(claimant, share);
            removeParticipant(claimant);
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
}
