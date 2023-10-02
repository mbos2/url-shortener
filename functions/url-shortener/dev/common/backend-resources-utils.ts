import { Databases } from "node-appwrite";
import { IResultObject } from "./types.js";
import config from "./config.js";
import {c} from './logger.js';

export const generateShortUrlDatabase = async (databases: Databases): Promise<IResultObject> => {
  try {
    await databases.create(config.databaseId, 'Short URL Database');
    return {
      statusCode: 200,
      ok: true,
      message: `Generated Short URL database successfully.`
    };
  } catch (err) {
    c.error(`Failed to generate Short URL collection.`);
    c.error(err)
    return {
      statusCode: 500,
      ok: true,
      message: `Failed to generate Short URL database.`
    };
  }
}

export const generateShortUrlDatabaseCollection = async (databases: Databases): Promise<IResultObject> => {
  try {
    await databases.createCollection(config.databaseId, config.collectionId, 'Short URL Collection');
    return {
      statusCode: 200,
      ok: true,
      message: `Generated Short URL collection successfully.`
    };
  } catch (err) {
    c.error(`Failed to generate Short URL collection.`);
    c.error(err)
    return {
      statusCode: 500,
      ok: true,
      message: `Failed to generate Short URL collection.`
    };
  }
}

export const generateShortUrlDatabaseCollectionAttributes = async (databases: Databases): Promise<IResultObject> => {
  try {
    const promises = [
      databases.createStringAttribute(config.databaseId, config.collectionId, 'id', 100, true),
      databases.createStringAttribute(config.databaseId, config.collectionId, 'url', 700, true),
      databases.createStringAttribute(config.databaseId, config.collectionId, 'shortUrl', 60, true),
      databases.createStringAttribute(config.databaseId, config.collectionId, 'shortUrlFull', 256, true),
      databases.createStringAttribute(config.databaseId, config.collectionId, 'alias', 256, true),
      databases.createIntegerAttribute(config.databaseId, config.collectionId, 'createdAt', true),
    ]
    await Promise.all(promises);
    return {
      statusCode: 200,
      ok: true,
      message: `Generated Short URL collection successfully.`
    };
  } catch (err) {
    c.error(`Failed to generate Short URL collection.`);
    c.error(err)
    return {
      statusCode: 500,
      ok: true,
      message: `Failed to generate Short URL collection.`
    };
  }
}

export const generateBackendResources = async (databases: Databases, res: any): Promise<IResultObject> => {
  try {
    const resultDb = await generateShortUrlDatabase(databases);
    if (resultDb.ok) {
      res.json(resultDb);
    }
  } catch (err) {
    c.error(`Failed to generate Short URL database.`);
    return {
      statusCode: 500,
      ok: true,
      message: `Failed to generate Short URL database.`
    };
  }

  try {
    const resultColl =  await generateShortUrlDatabaseCollection(databases);
    if (resultColl.ok) {
      res.json(resultColl);
    }
  } catch (err) {
    c.error(`Failed to generate Short URL collection.`);
    return {
      statusCode: 500,
      ok: true,
      message: `Failed to generate Short URL collection.`
    };
  }

  try {
    const resultAttr = await generateShortUrlDatabaseCollectionAttributes(databases);
    if (resultAttr.ok) {
      res.json(resultAttr);
    }
  } catch (err) {
    c.error(`Failed to generate Short URL collection attributes.`);
    return {
      statusCode: 500,
      ok: true,
      message: `Failed to generate Short URL collection attributes.`
    };
  }

  return {
    statusCode: 200,
    ok: true,
    message: `Generated Short URL backend resources successfully.`
  };
}