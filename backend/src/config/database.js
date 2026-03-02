const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const disconnect = async () => {
    await mongoose.disconnect();
};

const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

module.exports = {
    connect,
    disconnect,
    isConnected,
};
