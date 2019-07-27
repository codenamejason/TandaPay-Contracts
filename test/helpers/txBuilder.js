/**
 * @author blOX Consulting LLC
 * @date 07.19.2019
 * Build a transaction
 */

const TX = require('ethereumjs-tx');

module.exports = {

    /**
     * Build a signed transaction that is expected to revert
     * @param _account Ethereum address signing the transaction
     * @param _contract Ethereum address of contract being interacted with
     * @param _data The encoded transaction data
     * @return the signed transaction object
     */
    revertable: async (_account, _contract, _data) => {
        let txObject = {
            nonce: await module.exports.getNonce(_account.address),
            gasPrice: await module.exports.getGasPrice(),
            gasLimit: await module.exports.getGasLimit(),
            to: _contract,
            data: _data
        }
        let pkey = _account.privateKey;
        console.log("Pkey type: ", typeof(pkey));
        console.log("PKey before strip: ", pkey);
        pkey = web3.utils.stringToHex(pkey);
        //pkey = web3.utils.stripHexPrefix(pkey);
        console.log("PKey after strip: ", pkey);
        console.log("utils keys", Object.keys(web3.utils));
        console.log(console.log(await web3.utils.isHexStrict(_account.privateKey)));
        console.log(typeof(_account.privateKey));
        
        // /let pkey = _account.privateKey;
        console.log(pkey);
        let rawTX = new TX.Transaction(txObject);
        let signedTX = rawTX.sign(Buffer.from(pkey));
        let sentTX = await web3.eth.sendTransaction(signedTX);
        console.log("Sent TX: ", sentTX);
        //console.log("Raw: ", rawTX);
        return sentTX;
    },

    /**
     * Get the nonce of a given account
     * @param _account Ethereum address being queried for nonce
     * @return the nonce in hexadecimal
     */
    getNonce: async (account) => {
        let nonce = await web3.eth.getTransactionCount(account);
        return web3.utils.toHex(nonce);
    },

    /**
     * Get the gas price of the global web3 provider network
     * @return the gas price in hexadecimal
     */
    getGasPrice: async () => {
        let price = await web3.eth.getGasPrice();
        return web3.utils.toHex(price);
    },

    /**
     * Get the gas limit in the current block of the global web3 provider network
     * @return the gas limit as a JS number
     */
    getGasLimit: async () => {
        let block = await web3.eth.getBlock('latest');
        return block.gasLimit;
    }
}