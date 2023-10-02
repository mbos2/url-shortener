import { Query } from "node-appwrite";
import config from "./config.js";
import { customAlphabet } from 'nanoid';
import { c } from "./logger.js";
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(ALPHABET);
const generateShortCode = () => nanoid(6);
const generateShortId = () => nanoid(16);
const getShortUrlsFromDatabase = async (databases, shortUrl) => {
    c.log('In getShortUrlsFromDatabase -> testing logger');
    try {
        c.log(`Short code is ${shortUrl}`);
        c.log('Starting to list documents to search for short code');
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
        };
    }
    catch (error) {
        c.log('In getShortUrlsFromDatabase catch');
        c.log(error);
        return {
            ok: false,
            statusCode: 500,
            message: `Failed to get short url from database.`,
        };
    }
};
const getNewShortCode = async (databases) => {
    c.log('Checking if short code exists in the database. . .');
    let retries = 0;
    const maxRetries = 3;
    while (retries < maxRetries) {
        c.log(`Retries: ${retries}`);
        c.log('Starting to execute generateShortCode()');
        const shortCode = generateShortCode();
        const result = await getShortUrlsFromDatabase(databases, shortCode);
        c.log('Finished listing documents, checking result . . .');
        c.log(`Result is: ${result}`);
        if (!(result.documents && result.documents.length > 0)) {
            return shortCode;
        }
        retries++;
    }
    c.log('getNewShortCode -> Retries exceeded max retries');
    c.log('Couldn not generate shortUrl. Please try again.');
    throw new c.error("Couldn't generate shortUrl. Please try again.");
};
export const createShortUrlRecord = async (databases, originalUrl, alias) => {
    try {
        c.log(`Creating short url record for ${originalUrl}`);
        const shortUrl = await getNewShortCode(databases);
        const domain = process.env.DOMAIN;
        c.log(`Short url is ${shortUrl}`);
        c.log(`Domain is ${domain}`);
        c.log('Starting to create document');
        const id = generateShortId();
        const data = {
            "id": id,
            "url": originalUrl,
            "shortUrl": shortUrl,
            "shortUrlFull": `${domain}/${shortUrl}`,
            "alias": alias,
            "createdAt": Date.now()
        };
        c.log(`Data is: ${data}`);
        const result = await databases.createDocument(config.databaseId, config.collectionId, id, data);
        c.log('Finished creating document, checking result . . .');
        if (result) {
            c.log('In result');
            c.log('Result is: ');
            c.log(result);
            return {
                statusCode: 200,
                ok: true,
                message: `Successfully created short url.`,
                url: `${domain}/${shortUrl}`,
                result: result
            };
        }
        else {
            c.log('Result is (in !result): ');
            c.log(result);
            return {
                statusCode: 500,
                ok: false,
                message: `Failed to create short url.`
            };
        }
    }
    catch (err) {
        c.log('In createShortUrlRecord catch');
        c.log(err);
        c.error(err);
        return {
            statusCode: 500,
            ok: false,
            message: `Failed to create short url.`
        };
    }
};
export const deleteShortUrlRecord = async (databases, id) => {
    try {
        c.log('Starting to delete document');
        c.log(`Document id is ${id}`);
        const result = await databases.deleteDocument(config.databaseId, config.collectionId, id);
        c.log('Finished deleting document, checking result . . .');
        return {
            statusCode: 200,
            ok: true,
            message: `Successfully deleted short url document id ${id}.`,
            result: result,
        };
    }
    catch (err) {
        c.log('In deleteShortUrlRecord catch');
        c.log(err);
        c.error(err);
        return {
            statusCode: 500,
            ok: false,
            message: `Failed to delete short url record.`,
        };
    }
};
