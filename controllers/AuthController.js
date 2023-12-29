/* eslint-disable class-methods-use-this */
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  // get connect
  async getConnect(req, res) {
    // get authorization header
    try {
      const authHeader = req.headers.authorization;

      // get base64 credentials
      const base64Credentials = authHeader.split(' ')[1];

      // decode credentials from base64 to string
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

      // get email and password from credentials
      const [email, password] = credentials.split(':');

      // convert password to hashed value
      const hashedPassword = await crypto.createHash('sha1').update(password, 'utf-8').digest('hex');
      // check if email and password is found
      const user = await dbClient.getUserByEmailAndPassword(email, hashedPassword);
      console.log(user._id.toString());

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      // create a token using uuid
      const token = uuidv4();

      // create a key
      const redisKey = `auth_${token}`;

      // store redisKey and userid as value in Redis
      redisClient.set(redisKey, user._id.toString(), 4 * 60 * 60);

      res.status(201).json({ token });
    } catch (error) {
      console.error('Error loading /connect endpoint', error);
    }
  }

  // disconnect a user
  async getDisconnect(req, res) {
    try {
      const xToken = req.header('X-Token');
      const token = `auth_${xToken}`;
      // redis client get user
      const userId = await redisClient.get(token);
      // if user is not found
      console.log(userId);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      // if user is found
      await redisClient.del(token);
      res.status(204).json({});
    } catch (error) {
      console.error('Error with /disconnect endpoint', error);
    }
  }
}

const authController = new AuthController();
module.exports = authController;
