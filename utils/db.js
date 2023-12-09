const { MongoClient } = require('mongodb');

class DBClient {
  // constructor for dbclient
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'file_manager';
    this.url = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  // check if mongodb is connected
  isAlive() {
    try {
      this.client.connect();
      return true;
    } catch (err) {
      return false;
    }
  }

  // return the number of document in the collection 'user'
  async nbUsers() {
    try {
      this.client.connect();
      const db = this.client.db(this.database);
      const countDocs = await db.collection('users').countDocuments();
      return countDocs;
    } catch (error) {
      console.error('Cannot connect to database');
      throw error;
    } finally {
      this.client.close();
    }
  }

  // return the number of document in the collection 'files'
  async nbFiles() {
    try {
      this.client.connect();
      const db = this.client.db(this.database);
      const countFiles = await db.collection('files').countDocuments();
      return countFiles;
    } catch (error) {
      console.error('Cannot connect to database');
      throw error;
    } finally {
      this.client.close();
    }
  }
}
const dbClient = new DBClient();
module.exports = dbClient;
