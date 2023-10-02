import { Databases, Query } from 'node-appwrite';
import config from './config.js';
import { IResultObject, IShortUrl } from './types.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {c} from './logger.js';

export const getShortUrls = async (databases: Databases, offsetNumber?: number): Promise<IResultObject> => {
  c.log('Getting short urls. . .')
  try {
    const result = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.select(['*']),
      Query.orderDesc('createdAt'),
      Query.limit(100),
      offsetNumber ? Query.offset(offsetNumber as number) : Query.offset(0)
    ]);
    c.log('Checking if result exists. . .')
    if (result) {
      c.log('Results exists. . .')
      return {
        statusCode: 200,
        ok: true,
        message: `Successfully retrieved short urls.`,
        data: result.documents
      }
    } else {
      c.log('Result does not exist.')
      return {
        statusCode: 500,
        ok: false,
        message: `Failed to retrieve short urls.`
      }
    }
  } catch (error) {
    c.log(error)
    return {
      statusCode: 500,
      ok: false,
      message: `Failed to retrieve short urls.`
    }
  }
}

const extractShortUrlFromPath = (path: string): string | undefined => {
  const parts = path.split('/');
  if (parts[1]) {
    return parts[1].length >= 6 ? parts[1] : undefined;
  }
}

export const containsShortUrlInPath = (url: string) => {
  const parts = url.split('/');
  return parts.length > 0 && parts[1].length >= 6 && parts[1] !== '/favicon.ico' && parts[1] !== 'favicon.ico'; // Check for a non-empty part after the first '/' with a length of at least 6 characters.
}

export const getUrlAndRedirect = async (databases: Databases, req: any, res: any, log: any, error: any): Promise<any> => {
  c.log('Extracting short url . . .');
  const shortUrl = extractShortUrlFromPath(req.path) as string;
  if (!shortUrl) {
    c.log('No short url was found.')
    return res.json
    ({
      statusCode: 400,
      ok: false,
      message: `No short url was found.`
    });
  }
  try {
    c.log('Getting short url document. . .')
    const result = await databases.listDocuments(config.databaseId, config.collectionId, [
      Query.select(['*']),
      Query.offset(0),
      Query.limit(1),
      Query.equal("shortUrl", [shortUrl])
    ]);
    c.log(`Checking if short url document exists (${shortUrl}). . .`)
    if (result && result.documents.length > 0) {
      c.log('Short url document exists. Getting document in a variable . . .')
      const document = result.documents[0]  as unknown as IShortUrl;
      c.log('Checking if document.url exists . . .')
      c.log(document)
      if (document.url) {
        c.log('Redirecting to original url . . .')
        return res.redirect(new URL(document.url), 301, {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
      } else {
        c.log('Document.url does not exist.')
        return {
          statusCode: 500,
          ok: false,
          message: `Failed to retrieve short url.`
        }
      }
    } else {
      c.log('Short url document does not exist.')
      return {
        statusCode: 500,
        ok: false,
        message: `Failed to retrieve short url.`
      }
    }
  } catch (err) {
    c.log(err)
    return {
      statusCode: 500,
      ok: false,
      message: `Failed to retrieve short url. Catch error`
    }
  }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticFolder = path.join(__dirname, '../ui');

/**
 * Returns the contents of a file in the static folder
 * @param {string} fileName
 * @returns {string} Contents of static/{fileName}
 */
export function getStaticFile(fileName: string) {
  return fs.readFileSync(path.join(staticFolder, fileName)).toString();
}