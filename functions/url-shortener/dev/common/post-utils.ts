import { Databases, ID, Query } from "node-appwrite";
import config from "./config.js";
import { customAlphabet } from 'nanoid';

const ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET);
const generateShortCode = () => nanoid(6);

const getShortUrlsFromDatabase = async (databases: Databases, log: any, shortUrl: string) => {
  log(`Short code is ${shortUrl}`);
  log('Starting to list documents to search for short code');
  return await databases.listDocuments(config.databaseId, config.collectionId, [
    Query.select(['shortUrl']),
    Query.offset(0),
    Query.limit(1),
    Query.equal('shortUrl', shortUrl)
  ]);
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
    if (!(result && result.documents.length > 0)) {
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
    const data = {
      "url": originalUrl,
      "shortUrl": shortUrl,
      "shortUrlFull": `${domain}/${shortUrl}`,
      "alias": alias,
      "createdAt": Date.now()
    }
    log(`Data is: ${data}`)
    const result = await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), data);
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
  maybeFullShortUrl: string,
  log: any,
  error: any
) => {
  try {
    log(`Deleting short url record for ${maybeFullShortUrl}`);
    const domain = process.env.DOMAIN as string;
    const shortUrl = maybeFullShortUrl.replace(`${domain}/`, '');
    const existingRecord = await getShortUrlsFromDatabase(databases, log, shortUrl);
    log('Finished fetching existing short url from database, checking result . . .');
    if(existingRecord && existingRecord.documents.length > 0) {
      log('Existing record was found for ${shortUrl}.');
      log('Starting to delete document');
      const result = await databases.deleteDocument(config.databaseId, config.collectionId, existingRecord.documents[0].$id);

      if (result) {
        log('In result');
        log('Result is: ');
        log(result);
        return {
          statusCode: 200,
          ok: true,
          message: `Successfully deleted short url ${maybeFullShortUrl}.`,
          result: result,
        };
      } else {
        log('Result is (in !result): ');
        log(result);
        return {
          statusCode: 500,
          ok: false,
          message: `Failed to delete short url ${shortUrl}.`,
        };
      }
    } else {
      log('No existing record was found for ${shortUrl}.');
      return {
        statusCode: 400,
        ok: false,
        message: `No existing record was found.`,
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