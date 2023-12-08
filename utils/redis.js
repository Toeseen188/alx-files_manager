const redis = require('redis');

class RedisClient {
  // redis class
  constructor() {
    // create a Redis client instance
    this.client = redis.createClient();

    // handle connection error
    this.client.on('error', (err) => {
      console.error(`Error connecting to Redis: ${err}`);
    });
  }

  // check if connected, True if yes, and false if otherwise
  isAlive() {
    try {
      this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // an async get that take key and return its redis value
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  // set a key-value pair with expiration date
  async set(key, value, duration) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, duration, value, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  // async function del that takes a string key as arg and remove the value in Redis
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
