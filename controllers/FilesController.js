/* eslint-disable class-methods-use-this */
const fs = require('fs').promises;
const uuid = require('uuid');
const path = require('path');
const ObjectId = require('mongodb');
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
        const parentFile = await dbClient.findOne(ObjectId(parentId));
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
}

const fileController = new FilesController();
module.exports = fileController;
