/**
 * @author blOX Consulting LLC
 * @date 07.11.19
 * Export Smart Contract Tests
 */
const RBA = require('./subtests/rba.test.js');
const Time = require('./subtests/time.test.js');
const Functional = require('./subtests/functional.test.js');
const Gas = require('./subtests/gas.test.js')

module.exports = {
    RBA,
    Time,
    Functional,
    Gas
}