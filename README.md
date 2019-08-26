#TandaPay Contracts ##Version: 0.2.0 ##Date: August 26, 2019 ##Author: blOX Consulting LLC (Jack Gilcrest) ##Contributors: Tarski Technologies LLC, Anthony Akentiev ##Owner: Joshua Davis

Welcome to the TandaPay Demo Build! This distribution is built with the intention of demonstrating the full range of basic capabilities of TandaPay's Smart Contract Insurance Architecture. This readme will provide a brief walkthrough to using the distribution, however we recommend you visit the full documentation here [link later].

##Prerequisities

Install the current stable build of NodeJS (v10.15.3)
Using node package manager, install 'ganache-cli', 'truffle', and 'dotenv' 2a. 'npm i -g ganache-cli dotenv truffle'
Prepare your Ethereum Mnemonic 3a. Use 'https://iancoleman.io/bip39/' to generate a new mnemonic if need be 3b. Mnemonic =~= 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word 11 word 12'
##Installation Instructions

Clone the repository by running 'git clone git@github.com:blOX-Consulting/TandaPay-Contracts.git' in command line
Enter the downloaded directory with 'cd TandaPay Contracts' in the command line
Install Node packages by running 'npm i' in command line
Create Environment Variables configuration file 4a. Run 'nano .env' in the command line 4b. Copy mnemonic, reference as $(MNEMONIC) 4c. Enter 'MNEMONIC=$(MNEMONIC)' in nano text editor 4d. Enter 'CTRL+O' to write changes, 'CTRL+X' to exit nano text editor
Begin running a local ganache instance 5a. Copy mnemonic, reference as $(MNEMONIC) 5b. Open new terminal window 5c. Run 'ganache-cli -m "$(MNEMONIC)" -e 10000'
##Testing

Simply run 'truffle test' in the command line to run the test file. Reference './test/test.js' to audit the exact testing being performed behind the scenes, however the test script will check for various desired properties.