/* eslint-disable class-methods-use-this */

const crypto = require('crypto');
const dbClient = require('../utils/db');

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
      }

      // check if password is not given
      if (!password) {
        res.status(400).json({ error: 'Missing password' });
      }

      // check if user existed
      const existedUser = await dbClient.getUserByEmail(email);

      if (existedUser) {
        res.status(400).json({ error: 'Already exist' });
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
}

const usersController = new UsersController();
module.exports = usersController;
