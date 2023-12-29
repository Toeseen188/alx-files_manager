const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

class DBClient {
  // constructor for dbclient
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
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
    }
  }

  // check if user is present
  async getUserByEmail(email) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      const user = await collection.findOne({ email });
      return user != null;
    } catch (error) {
      console.error('Error finding the user by email');
      throw error;
    }
  }

  async getUserByEmailAndPassword(email, hashedPassword) {
    try {
      this.client.connect();
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      const user = await collection.findOne({ email, password: hashedPassword });
      return user;
    } catch (error) {
      console.error('Error finding the user');
      throw error;
    }
  }

  // get user by id
  async getUserById(userId) {
    try {
      this.client.connect();
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      const id = ObjectId(userId);
      const user = await collection.findOne({ _id: id });
      console.log(user);
      return user;
    } catch (error) {
      console.error('Error getting user by Id', error);
      throw error;
    }
  }

  // insert a new user into user collection
  async insertUser(newUser) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      const user = collection.insertOne(newUser);
      return user;
    } catch (error) {
      console.error('Error adding new user');
      throw error;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
