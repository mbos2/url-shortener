import { Client, Databases } from 'node-appwrite';
import config from './common/config.js';
import { generateBackendResources } from './common/backend-resources-utils.js';
import { containsShortUrlInPath, getShortUrls, getStaticFile, getUrlAndRedirect } from './common/get-utils.js';
import { createShortUrlRecord } from './common/post-utils.js';
export default async ({ req, res, log, error }) => {
    log(req);
    log(res);
    /**
     * Setting up variables
     */
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.PROJECT_API_KEY;
    const isApiKeySet = apiKey !== undefined;
    if (isApiKeySet === false) {
        error("Environment variable PROJECT_API_KEY is not set. Function cannot use Appwrite SDK. Please set PROJECT_API_KEY environment variable with your Appwrite API key.");
        return res.json({ ok: false, message: `Internal Server Error.` }, 500);
    }
    const client = new Client();
    client.setEndpoint('https://cloud.appwrite.io/v1');
    client.setProject(projectId);
    client.setKey(apiKey);
    const databases = new Databases(client);
    /**
     * Check if database exists
     * Generates database and collection if it doesn't exist
     */
    try {
        const db = await databases.get(config.databaseId);
        if (db)
            log("Database found.");
        else
            log("Database not found.");
    }
    catch (err) {
        log("Database not found . . . Creating a database . . .");
        const result = await generateBackendResources(databases, error, res);
        log('generateBackendResources result -> . . .');
        log(result);
        if (result.ok) {
            res.json({
                statusCode: 200,
                ok: true,
                message: `Generated backend resources successfully.`
            });
        }
        res.json({
            statusCode: 500,
            ok: false,
            message: `Failed to generate backend resources.`
        });
    }
    // Do redirection here
    const isShortUrlPresent = containsShortUrlInPath(req.path);
    if (req.method === 'GET' && isShortUrlPresent) {
        log('Short URL Is Present');
        log('Ececuting getUrlAndRedirect');
        return await getUrlAndRedirect(databases, req, res, log, error);
    }
    else {
        log('Short URL Is Not Present . . . Continuing . . .');
    }
    if (req.method === 'POST' && req.path === '/my-short-urls') {
        log('Starting to get short urls . . .');
        log('Checking if content-type is application/json . . .');
        if (req.headers['content-type'] !== 'application/json') {
            error("Invalid Header. Content-Type must be application/json.");
            return res.json({ ok: false, message: `Invalid Header. Content-Type must be application/json.` }, 400);
        }
        log('Logging request objetc . . .');
        log(req);
        log('Checking if body exists . . .');
        if (req.body) {
            log('Body exists . . .');
            log('Parsing payload . . .');
            const payload = JSON.parse(req.bodyRaw);
            log('Checking if payload exists . . .');
            if (!payload) {
                error("No payload was found.");
                return res.json({ ok: false, message: `No payload was found.` }, 400);
            }
            log('Checking if offSet exists . . .');
            if (!payload.offSet) {
                log("No offSet was found in the payload.");
                const result = await getShortUrls(databases, log, error);
                return res.json(result);
            }
            else {
                const result = await getShortUrls(databases, log, error, payload.offSet);
                return res.json(result);
            }
        }
    }
    else {
        log('Short URL Is Not Present . . . Continuing . . .');
    }
    if (req.method === 'POST' && req.path === '/generate-short-url') {
        if (req.headers['content-type'] !== 'application/json') {
            error("Invalid Header. Content-Type must be application/json.");
            return res.json({ ok: false, message: `Invalid Header. Content-Type must be application/json.` }, 400);
        }
        if (!req.body) {
            error("No body was found.");
            return res.json({ ok: false, message: `No body was found.` }, 400);
        }
        // const payload = JSON.parse(req.body);
        // const payload = req.body;
        const payload = JSON.parse(req.bodyRaw);
        if (!payload) {
            error("No payload was found.");
            return res.json({ ok: false, message: `No payload was found.` }, 400);
        }
        log("Payload: ");
        log(payload);
        if (!payload.url) {
            error("No url was found in the payload.");
            return res.json({ ok: false, message: `No url was found in the payload.` }, 400);
        }
        const originalUrl = payload.url;
        const alias = payload.alias;
        log("Goint into createShortUrlRecord");
        const result = await createShortUrlRecord(databases, originalUrl, alias, log, error);
        return res.json(result);
    }
    // Return HTML
    return res.send(getStaticFile('index.html'), 200, {
        'Content-Type': 'text/html; charset=utf-8',
    });
};
