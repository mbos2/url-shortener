import { ID, Query } from "node-appwrite";
import config from "./config.js";
import { customAlphabet } from 'nanoid';
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET);
const generateShortCode = () => nanoid(6);
const getShortCodeDatabaseRecord = async (databases, log, shortUrl) => {
    log(`Short code is ${shortUrl}`);
    log('Starting to list documents to search for short code');
    return await databases.listDocuments(
      config.databaseId,
      config.collectionId,
      [
        Query.select(['shortUrl']),
        Query.offset(0),
        Query.limit(1),
        Query.equal('shortUrl', shortUrl),
      ]
    );
}
const getNewShortCode = async (databases, log) => {
    log('Checking if short code exists in the database. . .');
    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
        log(`Retries: ${retries}`);
        log('Starting to execute generateShortCode()');
        const shortCode = generateShortCode();
        const result = await getShortCodeDatabaseRecord(databases, log, shortCode);
        log('Finished listing documents, checking result . . .');
        log(`Result is: ${result}`);
        if (!(result && result.documents.length > 0)) {
            return shortCode;
        }
        retries++;
    }
    log('getNewShortCode -> Retries exceeded max retries');
    log('Couldn not generate shortUrl. Please try again.');
    throw new Error("Couldn't generate shortUrl. Please try again.");
};
export const createShortUrlRecord = async (databases, originalUrl, alias, log, error) => {
    try {
        log(`Creating short url record for ${originalUrl}`);
        const shortUrl = await getNewShortCode(databases, log);
        const domain = process.env.DOMAIN;
        log(`Short url is ${shortUrl}`);
        log(`Domain is ${domain}`);
        log('Starting to create document');
        const data = {
            "url": originalUrl,
            "shortUrl": shortUrl,
            "shortUrlFull": `${domain}/${shortUrl}`,
            "alias": alias,
            "createdAt": Date.now()
        };
        log(`Data is: ${data}`);
        const result = await databases.createDocument(config.databaseId, config.collectionId, ID.unique(), data);
        log('Finished creating document, checking result . . .');
        if (result) {
            log('In result');
            log('Result is: ');
            log(result);
            return {
                statusCode: 200,
                ok: true,
                message: `Successfully created short url.`,
                url: `${domain}/${shortUrl}`,
                result: result
            };
        }
        else {
            log('Result is (in !result): ');
            log(result);
            return {
                statusCode: 500,
                ok: false,
                message: `Failed to create short url.`
            };
        }
    }
    catch (err) {
        log('In createShortUrlRecord catch');
        log(err);
        error(err);
        return {
            statusCode: 500,
            ok: false,
            message: `Failed to create short url.`
        };
    }
};

export const deleteShortUrlRecord = async (
  databases,
  maybeFullShortUrl,
  log,
  error
) => {
  try {
    const domain = process.env.DOMAIN;
    log(`deleting short url record for ${maybeFullShortUrl}`);
    const shortUrl = maybeFullShortUrl.replace(`${domain}/`, '');
    log('Fetching existing document . . .');
    const existingRecords = await getShortCodeDatabaseRecord(databases, log, shortUrl);
    if (existingRecords && existingRecords.documents.length > 0) {
        log('Existing records found');
        const documentToDelete = existingRecords.documents[0];
        log('Deleting record with id: ${documentToDelete.id}');
        const result = await databases.deleteDocument(config.databaseId, config.collectionId, documentToDelete.id);
        if (result) {
          log('Result is: ');
          log(result);
          return {
            statusCode: 200,
            ok: true,
            message: `Successfully deleted short url.`,
            url: `${domain}/${shortUrl}`,
            result: result,
          };
        } else {
          log('Result is (in !result): ');
          log(result);
          return {
            statusCode: 500,
            ok: false,
            message: `Failed to delete short url.`,
          };
        }
    } else {
        log('No existing records found for ${shortUrl}');
        return {
            statusCode: 404,
            ok: false,
            message: `No existing records found.`,
        };
    }
  } catch (err) {
    log('In createShortUrlRecord catch');
    log(err);
    error(err);
    return {
      statusCode: 500,
      ok: false,
      message: `Failed to create short url.`,
    };
  }
};
