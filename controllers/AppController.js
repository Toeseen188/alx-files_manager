const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

// AppController class
class AppController {
  // constructor if needed
  constructor() {
    this.redisAlive = null;
    this.dbAlive = null;
    this.numUsers = null;
    this.numFiles = null;

    // Bind methods to the instance
    this.getStatus = this.getStatus.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  async getStatus(req, res) {
    try {
      this.redisAlive = await redisClient.isAlive();
      this.dbAlive = await dbClient.isAlive();
      res.status(200);
      res.json({ redis: this.redisAlive, db: this.dbAlive });
    } catch (error) {
      console.error('Error in /status endpoint', error);
      res.status(500);
      res.json({ error: 'Error getting the endpoint' });
    }
  }

  // GET /stats

  async getStats(req, res) {
    try {
      this.numUsers = await dbClient.nbUsers();
      this.numFiles = await dbClient.nbFiles();
      res.status(200);
      res.json({ users: this.numUsers, files: this.numFiles });
    } catch (error) {
      console.error('Error getting /stats', error);
      res.status(500);
    }
  }
}

const appController = new AppController();
module.exports = appController;
