pragma solidity >= 0.4.0 < 0.7.0;

/**
 * @author blOX Consulting LLC.
 * Date: 06.09.2019
 * Library for TandaPay
 * Common data structures are declared here
 **/
library TandaLibrary {
    
    ///STRUCTS///

    struct group {
        address secretary;
        uint8 premium;
        uint8 size;
        uint16 period;
        mapping(address => uint8) policyholders; // 0 = no, otherwise = subgroup #
        uint8 subgroups;
        mapping(uint8 => uint8) subgroupSize;
    }
    
    struct claim {
        address policyholder;
        claimState state;
    }
    
    struct period {
        periodState state;
        claim[] claims;
        mapping(address => policyholderState) policyholders;
        mapping(uint8 => uint8) defectionCount;
    }
    
    ///ENUMS///
    
    enum policyholderState {UNPAID, PAID, DEFECTED}
    enum periodState {PRE, ACTIVE, POST}
    enum claimState {REJECTED, OPEN, ACCEPTED}
    
    ///INTEGERS///
    uint8 constant MIN_PREMIUM = 5;
    uint8 constant MAX_PREMIUM = 50;
}

