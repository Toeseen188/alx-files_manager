/* eslint-disable class-methods-use-this */
const crypto = require('crypto');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class UsersController {
  async postNew(req, res) {
    try {
      if (!req.body) {
        res.status(400).json({ error: 'Invalid request body' });
      }
      const { email, password } = req.body;
      // check if email is not given
      if (!email) {
        res.status(400).json({ error: 'Missing email' });
        return;
      }

      // check if password is not given
      if (!password) {
        res.status(400).json({ error: 'Missing password' });
        return;
      }

      // check if user existed
      const existedUser = await dbClient.getUserByEmail(email);

      if (existedUser) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }

      // hash password
      const hashedPassword = await crypto.createHash('sha1').update(password, 'utf-8').digest('hex');

      // create new user object
      const newUser = {
        email,
        password: hashedPassword,
      };

      // insert newUser into users collection
      await dbClient.insertUser(newUser);

      // return newUser with email and id only
      res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error('Error /users endpoint', error);
    }
  }

  // get user/me endpoint
  async getMe(req, res) {
    try {
      const xToken = req.header('X-Token');

      if (!xToken) {
        res.status(401).json({ error: 'X-Token not found in the header' });
      }
      const token = `auth_${xToken}`;
      console.log(token);
      const userId = await redisClient.get(token);
      const user = await dbClient.getUserById(userId);
      // respond authorized if user is not found
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      res.json({ id: user._id, email: user.email });
    } catch (error) {
      console.error('Error with /user/me endpoint', error);
      throw error;
    }
  }
}

const usersController = new UsersController();
module.exports = usersController;
