import { Client, Databases } from 'node-appwrite';
import config from './common/config.js';
import { generateBackendResources } from './common/backend-resources-utils.js';
import { containsShortUrlInPath, getShortUrls, getStaticFile, getUrlAndRedirect } from './common/get-utils.js';
import { createShortUrlRecord, deleteShortUrlRecord, } from './common/post-utils.js';
import { c, createLogWrapper } from './common/logger.js';
export default async ({ req, res, log, error }) => {
    await createLogWrapper(log, error);
    c.log(req);
    c.log(res);
    /**
     * Setting up variables
     */
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.PROJECT_API_KEY;
    const isApiKeySet = apiKey !== undefined;
    if (isApiKeySet === false) {
        c.error("Environment variable PROJECT_API_KEY is not set. Function cannot use Appwrite SDK. Please set PROJECT_API_KEY environment variable with your Appwrite API key.");
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
            c.log("Database found.");
        else
            c.log("Database not found.");
    }
    catch (err) {
        c.log("Database not found . . . Creating a database . . .");
        const result = await generateBackendResources(databases, error, res);
        c.log('generateBackendResources result -> . . .');
        c.log(result);
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
        c.log('Short URL Is Present');
        c.log('Ececuting getUrlAndRedirect');
        return await getUrlAndRedirect(databases, req, res, log, error);
    }
    else {
        c.log('Short URL Is Not Present . . . Continuing . . .');
    }
    if (req.method === 'POST' && req.path === '/my-short-urls') {
        c.log('Starting to get short urls . . .');
        c.log('Checking if content-type is application/json . . .');
        if (req.headers['content-type'] !== 'application/json') {
            c.error("Invalid Header. Content-Type must be application/json.");
            return res.json({ ok: false, message: `Invalid Header. Content-Type must be application/json.` }, 400);
        }
        c.log('Logging request objetc . . .');
        c.log(req);
        c.log('Checking if body exists . . .');
        if (req.body) {
            c.log('Body exists . . .');
            c.log('Parsing payload . . .');
            const payload = JSON.parse(req.bodyRaw);
            c.log('Checking if payload exists . . .');
            if (!payload) {
                c.error("No payload was found.");
                return res.json({ ok: false, message: `No payload was found.` }, 400);
            }
            c.log('Checking if offSet exists . . .');
            if (!payload.offSet) {
                c.log("No offSet was found in the payload.");
                const result = await getShortUrls(databases);
                return res.json(result);
            }
            else {
                const result = await getShortUrls(databases, payload.offSet);
                return res.json(result);
            }
        }
    }
    else {
        c.log('Short URL Is Not Present . . . Continuing . . .');
    }
    if (req.method === 'POST' && req.path === '/generate-short-url') {
        if (req.headers['content-type'] !== 'application/json') {
            c.error("Invalid Header. Content-Type must be application/json.");
            return res.json({ ok: false, message: `Invalid Header. Content-Type must be application/json.` }, 400);
        }
        if (!req.body) {
            c.error("No body was found.");
            return res.json({ ok: false, message: `No body was found.` }, 400);
        }
        // const payload = JSON.parse(req.body);
        // const payload = req.body;
        const payload = JSON.parse(req.bodyRaw);
        if (!payload) {
            c.error("No payload was found.");
            return res.json({ ok: false, message: `No payload was found.` }, 400);
        }
        c.log("Payload: ");
        c.log(payload);
        if (!payload.url) {
            c.error("No url was found in the payload.");
            return res.json({ ok: false, message: `No url was found in the payload.` }, 400);
        }
        const originalUrl = payload.url;
        const alias = payload.alias;
        c.log("Goint into createShortUrlRecord");
        const result = await createShortUrlRecord(databases, originalUrl, alias, log, error);
        return res.json(result);
    }
    if (req.method === 'POST' && req.path === '/delete-record') {
        if (req.headers['content-type'] !== 'application/json') {
            c.error('Invalid Header. Content-Type must be application/json.');
            return res.json({
                ok: false,
                message: `Invalid Header. Content-Type must be application/json.`,
            }, 400);
        }
        if (!req.body) {
            c.error('No body was found.');
            return res.json({ ok: false, message: `No body was found.` }, 400);
        }
        // const payload = JSON.parse(req.body);
        // const payload = req.body;
        const payload = JSON.parse(req.bodyRaw);
        if (!payload) {
            c.error('No payload was found.');
            return res.json({ ok: false, message: `No payload was found.` }, 400);
        }
        c.log('Payload: ');
        c.log(payload);
        if (!payload.id) {
            c.error('No id was found in the payload.');
            return res.json({ ok: false, message: `No id was found in the payload.` }, 400);
        }
        const id = payload.id;
        c.log('Goint into deleteShortUrlRecord');
        const result = await deleteShortUrlRecord(databases, id, log, error);
        return res.json(result);
    }
    const logs = [];
    logs.push('Hello from Appwrite Cloud Function!');
    const errors = [];
    errors.push('Hello from Appwrite Cloud Function!');
    // Return HTML
    return res.send(getStaticFile('index.html'), 200, {
        'Content-Type': 'text/html; charset=utf-8',
        'x-open-runtimes-logs': encodeURIComponent(logs.join('\n')),
        'x-open-runtimes-errors': encodeURIComponent(errors.join('\n'))
    });
};
