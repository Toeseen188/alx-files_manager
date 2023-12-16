const { MongoClient } = require('mongodb');

class DBClient {
  // constructor for dbclient
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'file_manager';
    this.url = `mongodb://${this.host}:${this.port}`;
    this.options = { useNewUrlParser: true, useUnifiedTopology: true };
    this.client = new MongoClient(this.url, this.options);
  }

  // check if mongodb is connected
  isAlive() {
    try {
      if (this.client.connect()) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting:', error);
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
      await this.client.close();
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
      await this.client.close();
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
