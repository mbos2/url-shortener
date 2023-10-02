import { Databases, ID, Query } from "node-appwrite";
import config from "./config.js";
import { customAlphabet } from 'nanoid';

const ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET);
const generateShortCode = () => nanoid(6);
const generateShortId = () => nanoid(16); 

const getShortUrlsFromDatabase = async (databases: Databases, log: any, shortUrl: string) => {
  try {
    log(`Short code is ${shortUrl}`);
    log('Starting to list documents to search for short code');
    const result = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.select(['*']),
      Query.offset(0),
      Query.limit(1),
      Query.equal('shortUrl', shortUrl)
    ]);
    return {
      ok: true,
      statusCode: 200,
      message: `Successfully got short url from database.`,
      documents: result.documents
    }
  } catch (error) {
    log('In getShortUrlsFromDatabase catch');
    log(error);
    return {
      ok: false,
      statusCode: 500,
      message: `Failed to get short url from database.`,
    }
  }
}

const getUrlsByAliasFromDatabase = async (
  databases: Databases,
  log: any,
  alias: string
) => {
  log('Starting to list documents by alias');
  return await databases.listDocuments(config.databaseId, config.collectionId, [
    Query.offset(0),
    Query.equal('alias', alias),
    Query.select(['url', 'shortUrl', 'shortUrlFull', 'alias', 'createdAt'])
  ]);
};

const getNewShortCode = async (databases: Databases, log: any) => {
  log('Checking if short code exists in the database. . .')
  let retries = 0;
  const maxRetries = 3;
  while (retries < maxRetries) {
    log(`Retries: ${retries}`)
    log('Starting to execute generateShortCode()')
    const shortCode = generateShortCode();
    const result = await getShortUrlsFromDatabase(databases, log, shortCode);

    log('Finished listing documents, checking result . . .')
    log(`Result is: ${result}`)
    if (!(result.documents && result.documents.length > 0)) {
      return shortCode;
    }
    retries++;
  }
  log('getNewShortCode -> Retries exceeded max retries')
  log('Couldn not generate shortUrl. Please try again.')
  throw new Error("Couldn't generate shortUrl. Please try again.");
}

export const createShortUrlRecord = async (databases: Databases, originalUrl: string, alias: string, log: any, error: any) => { 
  try {
    log(`Creating short url record for ${originalUrl}`  )
    const shortUrl = await getNewShortCode(databases, log);
    const domain = process.env.DOMAIN as string;
    log(`Short url is ${shortUrl}`)
    log(`Domain is ${domain}`)
    log('Starting to create document')
    const id = generateShortId();
    const data = {
      "id": id,
      "url": originalUrl,
      "shortUrl": shortUrl,
      "shortUrlFull": `${domain}/${shortUrl}`,
      "alias": alias,
      "createdAt": Date.now()
    }
    log(`Data is: ${data}`)
    const result = await databases.createDocument(config.databaseId, config.collectionId, id, data);
    log('Finished creating document, checking result . . .')
    if (result) {
      log('In result')
      log('Result is: ')
      log(result)
      return {
        statusCode: 200,
        ok: true,
        message: `Successfully created short url.`,
        url: `${domain}/${shortUrl}`,
        result: result
      }
    } else {
      log('Result is (in !result): ')
      log(result)
      return {
        statusCode: 500,
        ok: false,
        message: `Failed to create short url.`
      }
    }
  } catch (err) {
    log('In createShortUrlRecord catch')
    log(err)
    error(err)
    return {
      statusCode: 500,
      ok: false,
      message: `Failed to create short url.`
    }
  }
}

export const deleteShortUrlRecord = async (
  databases: Databases,
  id: string,
  log: any,
  error: any
) => {
  try {
      log('Starting to delete document');
      log(`Document id is ${id}`)
      const result = await databases.deleteDocument(config.databaseId, config.collectionId, id);
      log('Finished deleting document, checking result . . .')
      return {
        statusCode: 200,
        ok: true,
        message: `Successfully deleted short url document id ${id}.`,
        result: result,
      };
    } catch (err) {
    log('In deleteShortUrlRecord catch');
    log(err);
    error(err);
    return {
      statusCode: 500,
      ok: false,
      message: `Failed to delete short url record.`,
    };
  }
};

export const getUrlsByAlias = async (
  databases: Databases,
  alias: string,
  log: any,
  error: any
) => {
  try {
    log(`Searching records by Alias: ${alias}`);
    const existingRecords = await getUrlsByAliasFromDatabase(
      databases,
      log,
      alias
    );
    log(
      'Finished fetching existing records from database by alias, checking result . . .'
    );
    if (existingRecords && existingRecords.documents.length > 0) {
      log('In existing records');
      log('Result is: ');
      log(existingRecords);

        return {
          statusCode: 200,
          ok: true,
          message: `Found ${existingRecords.documents.length} records.`,
          result: existingRecords.documents,
        };
    } else {
      log('No records found. Result: ');
      log(existingRecords);
      return {
        statusCode: 404,
        ok: false,
        message: `Did not found any URLs by alias ${alias}.`,
        result: []
      };
    }
  } catch (err) {
    log('In deleteShortUrlRecord catch');
    log(err);
    error(err);
    return {
      statusCode: 500,
      ok: false,
      message: `Failed to delete short url.`,
    };
  }
};