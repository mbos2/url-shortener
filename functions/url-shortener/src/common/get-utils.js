import { Query } from 'node-appwrite';
import config from './config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
export const getShortUrls = async (databases, log, error, offsetNumber) => {
    log('Getting short urls. . .');
    try {
        const result = await databases.listDocuments(config.databaseId, config.collectionId, [
            Query.select(['*']),
            Query.orderDesc('createdAt'),
            Query.limit(100),
            offsetNumber ? Query.offset(offsetNumber) : Query.offset(0)
        ]);
        log('Checking if result exists. . .');
        if (result) {
            log('Results exists. . .');
            return {
                statusCode: 200,
                ok: true,
                message: `Successfully retrieved short urls.`,
                data: result.documents
            };
        }
        else {
            log('Result does not exist.');
            return {
                statusCode: 500,
                ok: false,
                message: `Failed to retrieve short urls.`
            };
        }
    }
    catch (error) {
        log(error);
        return {
            statusCode: 500,
            ok: false,
            message: `Failed to retrieve short urls.`
        };
    }
};
const extractShortUrlFromPath = (path) => {
    const parts = path.split('/');
    if (parts[1]) {
        return parts[1].length >= 6 ? parts[1] : undefined;
    }
};
export const containsShortUrlInPath = (url) => {
    const parts = url.split('/');
    return parts.length > 0 && parts[1].length >= 6 && parts[1] !== '/favicon.ico' && parts[1] !== 'favicon.ico'; // Check for a non-empty part after the first '/' with a length of at least 6 characters.
};
export const getUrlAndRedirect = async (databases, req, res, log, error) => {
    log('Extracting short url . . .');
    const shortUrl = extractShortUrlFromPath(req.path);
    if (!shortUrl) {
        log('No short url was found.');
        return res.json({
            statusCode: 400,
            ok: false,
            message: `No short url was found.`
        });
    }
    try {
        log('Getting short url document. . .');
        const result = await databases.listDocuments(config.databaseId, config.collectionId, [
            Query.select(['*']),
            Query.offset(0),
            Query.limit(1),
            Query.equal("shortUrl", [shortUrl])
        ]);
        log(`Checking if short url document exists (${shortUrl}). . .`);
        if (result && result.documents.length > 0) {
            log('Short url document exists. Getting document in a variable . . .');
            const document = result.documents[0];
            log('Checking if document.url exists . . .');
            console.log(document);
            if (document.url) {
                log('Redirecting to original url . . .');
                return res.redirect(new URL(document.url), 301, {
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
            }
            else {
                log('Document.url does not exist.');
                return {
                    statusCode: 500,
                    ok: false,
                    message: `Failed to retrieve short url.`
                };
            }
        }
        else {
            log('Short url document does not exist.');
            return {
                statusCode: 500,
                ok: false,
                message: `Failed to retrieve short url.`
            };
        }
    }
    catch (err) {
        log(err);
        return {
            statusCode: 500,
            ok: false,
            message: `Failed to retrieve short url. Catch error`
        };
    }
};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticFolder = path.join(__dirname, '../ui');
/**
 * Returns the contents of a file in the static folder
 * @param {string} fileName
 * @returns {string} Contents of static/{fileName}
 */
export function getStaticFile(fileName) {
    return fs.readFileSync(path.join(staticFolder, fileName)).toString();
}
