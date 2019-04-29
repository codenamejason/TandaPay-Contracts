# @author blOX Consulting, LLC
# @version 0.1.1
# @date 4.29.19
# @title TandaPay-Contracts

Implementation of TandaPay on the Ethereum blockchain relying on the ERC721 token standard to manage users' and secretaries' access to Tandas. Implementation is ongoing privately and will be maintained here as major updates are rolled out. 

You can access the live app here: https://tandapay-web.herokuapp.com/secretary/wallet
@dev the app is hardcoded to work with the following mnemonic for now. This repository tracks our progress fixing this issue.
MNEMONIC=fringe assault humble apart soda town jacket december minute major tattoo need

V0.1.1 released for MouseBelt Blockchain Accelerator pitch on 4.29.19.

Current tasks (Contracts ONLY):
 - Add Insurance contract (is ERC721, Secondary) for Group contract
 - Refine access controls by extending policyhoder (PH) and secretary (SEC) to inherit the USER token
 - Allow multiple addresses to interact with the web app
 - Allow policyholder to pay premium
 - Allow policyholder to enable autopremium (ERC721 token operator)
 - Add administrator (ADMIN) child of USER
 - Allow Admin to burn groups/ secretaries
    - Return user's funds from the insurance contract
 - Allow Admin to burn a policyholder
 - Allow Secretary to banish (ERC721 freeze) a policyholder
 - Audit for efficiency before proceeding to new tasks

Inspired by Anthony Akientev's prototype of the TandaPay ledger (v0.1.0): https://github.com/joshuad31/tandapay.
TandaPay originally theorized by Joshua Davis (tandapay.com). 
