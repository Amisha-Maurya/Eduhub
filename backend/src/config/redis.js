const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
});

client.on('error', (err) => console.error('❌ Redis Error:', err));
client.on('connect', () => console.log('✅ Redis connected'));

const connect = async () => {
  if (!client.isOpen) {
    await client.connect();
  }
};

const quit = async () => {
  if (client.isOpen) {
    await client.quit();
  }
};

const ping = async () => {
  return client.ping();
};

const get = async (key) => client.get(key);
const set = async (key, value) => client.set(key, value);
const setEx = async (key, seconds, value) => client.setEx(key, seconds, value);
const del = async (key) => client.del(key);
const hIncrBy = async (key, field, value) => client.hIncrBy(key, field, value);
const expire = async (key, seconds) => client.expire(key, seconds);

module.exports = {
  client,
  connect,
  quit,
  ping,
  get,
  set,
  setEx,
  del,
  hIncrBy,
  expire,
};