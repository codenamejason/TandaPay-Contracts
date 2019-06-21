/**
 * @author blOX Consulting LLC
 * @date 06.20.19
 * Export Smart Contract drivers
 */
const DaiDriver = require('./drivers/dai.driver.js');
const ServiceDriver = require('./drivers/service.driver.js');
const GroupDriver = require('./drivers/group.driver.js');

module.exports = {
    "DaiDriver": DaiDriver,
    "ServiceDriver": ServiceDriver,
    "GroupDriver": GroupDriver
}
