/* eslint-disable class-methods-use-this */
const fs = require('fs').promises;
const uuid = require('uuid');
const path = require('path');
const { ObjectId } = require('mongodb');
const mime = require('mime-types');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class FilesController {
  // upload file
  async postUpload(req, res) {
    try {
      // extract token from request
      const xToken = req.header('X-Token');
      const token = `auth_${xToken}`;

      // check for user_id in redis
      const userId = await redisClient.get(token);

      // check if user_id is found
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      // destructure request body to get data
      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Missing name' });
        return;
      }
      const acceptedTypes = ['folder', 'file', 'image'];

      if (!type || !acceptedTypes.includes(type)) {
        res.status(400).json({ error: 'Missing type' });
        return;
      }

      // check if no data provided or type is not folder
      if (type !== 'folder' && !data) {
        res.status(400).json({ error: 'Missing data' });
        return;
      }
      // if parentId
      // let parentFile;
      if (parentId) {
        const parentFile = await dbClient.findFileByParentId(ObjectId(parentId));
        if (!parentFile) {
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
        if (!parentFile.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
          return;
        }
      }

      // create a file document
      const newFileDoc = {
        userId,
        name,
        type,
        parentId: parentId ? ObjectId(parentId) : 0,
        isPublic: !!isPublic,
      };
      // return newFile if type is folder
      if (type !== 'folder') {
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileUuid = uuid.v4();
        const localPath = path.join(folderPath, fileUuid);

        // save file locally
        try {
          await fs.writeFile(localPath, Buffer.from(data, 'base64'));
        } catch (error) {
          console.error('Error while writing to file', error);
        }

        // update localPath of newFile
        newFileDoc.localPath = localPath;
      }
      await dbClient.insertFile(newFileDoc);
      res.status(201).json({
        id: newFileDoc._id,
        userId: newFileDoc.userId,
        name: newFileDoc.name,
        type: newFileDoc.type,
        isPublic: newFileDoc.isPublic,
        parentId: newFileDoc.parentId,
      });
    } catch (error) {
      console.error('Error with uploadfile endpoint', error);
    }
  }

  // get files by id
  async getShow(req, res) {
    try {
      // extract token from request header
      const xToken = req.header('x-Token');

      if (!xToken) {
        res.status(401).json({ error: 'xToken can be found in the header' });
      }
      const token = `auth_${xToken}`;
      const userId = await redisClient.get(token);

      // check if user is authorized
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const file = await dbClient.findFileById(id);

      // if no file is not found
      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      res.status(201).json({
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: file.parentId,
      });
    } catch (error) {
      console.error('Error while getting file by id', error);
    }
  }

  // get all files, parentId
  async getIndex(req, res) {
    try {
      const xToken = req.header('x-Token');

      // if token is not found
      if (!xToken) {
        res.status(401).json({ error: 'Token not found in header' });
        return;
      }

      const token = `auth_${xToken}`;
      const userId = redisClient.get(token);

      // if userId is not found, not authorized
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parentId = req.query.parentId || 0;
      const page = req.query.page || 0;
      const perPage = 20;
      const skip = page * perPage;
      const files = await dbClient.findFileByParentId(parentId);

      if (!files || files.length === 0) {
        res.status(404).json({ error: 'No files found' });
      }
      const paginatedFiles = files.slice(skip, skip + perPage);
      res.status(201).json(paginatedFiles);
    } catch (error) {
      console.error('Error while getting all files', error);
    }
  }

  // make public and isPublic
  async putPublish(req, res) {
    try {
      const xToken = req.header('x-Token');

      // if token is not found
      if (!xToken) {
        res.status(401).json({ error: 'Token not found in header' });
        return;
      }

      const token = `auth_${xToken}`;
      const userId = redisClient.get(token);

      // if userId is not found, not authorized
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const file = await dbClient.findFileById(id);

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      file.isPublic = true;
      res.status(200).json(file);
    } catch (error) {
      console.error('Error put endpoint /:id/public', error);
    }
  }

  // make unpublic and make a file unpublic
  async putUnpublish(req, res) {
    try {
      const xToken = req.header('x-Token');

      // if token is not found
      if (!xToken) {
        res.status(401).json({ error: 'Token not found in header' });
        return;
      }

      const token = `auth_${xToken}`;
      const userId = redisClient.get(token);

      // if userId is not found, not authorized
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const file = await dbClient.findFileById(id);

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      file.isPublic = false;
      res.status(200).json(file);
    } catch (error) {
      console.error('Error put endpoint /:id/unpublic', error);
    }
  }

  // get file by id
  async getFile(req, res) {
    try {
      const xToken = req.header('x-Token');

      // if token is not found
      if (!xToken) {
        res.status(401).json({ error: 'Token not found in header' });
        return;
      }

      const token = `auth_${xToken}`;
      const userId = redisClient.get(token);

      // if userId is not found, not authorized
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const file = await dbClient.findFileById(id);

      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      if (file.isPublic === false || file.userId !== userId) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      if (file.type === 'folder') {
        res.status(400).json({ error: "A folder doesn't have content" });
        return;
      }
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = path.join(folderPath, id);

      if (!fs.existsSync(localPath)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const mimeType = mime.lookup(localPath);

      if (!mimeType) {
        res.status(500).json({ error: 'Unknown MIME type' });
        return;
      }

      fs.readFile(localPath, (err, data) => {
        if (err) {
          res.status(400).json({ error: 'Error while reading data from file' });
          return;
        }
        res.set('content-type', mimeType);
        res.send(data);
      });
    } catch (error) {
      console.error('Error while getting /:id/data', error);
    }
  }
}

const fileController = new FilesController();
module.exports = fileController;
