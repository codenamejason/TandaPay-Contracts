pragma solidity >=0.5.0;

/**
* @title ITandaPayLedger TandaPayLedger interface
* @author blOX Consulting
*/
contract ITandaPayLedger {
   
    event TandaPayLedgerInitialized(address _contractAddress, address _backend);
    event UserTokenInitialized(address _contractAddress, address _backend);
    event GroupTokenInitialized(address _contractAddress, address _backend);
    event PremiumCommited(address phAddress, uint amount);

    
    /**
    * Create new TandaGroup.
    * @param _name name of the group
    * @return the GROUP token ID created for the group
    */
    function createNewTandaGroup(string memory _name) public returns (uint id);

}
