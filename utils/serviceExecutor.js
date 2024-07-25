// utils/serviceExecutor.js
const services = require('./servicesRegistry');

async function executeService(serviceName, params) {
    if (typeof services[serviceName] !== 'function') {
        throw new Error(`Service ${serviceName} is not properly defined as a function`);
    }
    try {
        return await services[serviceName](params);
    } catch (error) {
        console.error(`Error executing ${serviceName}:`, error);
        throw error;
    }
}

module.exports = executeService;