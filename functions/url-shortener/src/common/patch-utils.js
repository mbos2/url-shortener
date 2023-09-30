import config from "./config.js";
export const updateShortUrlFromRequest = async (databases, documentId, clicksNumber, log) => {
    try {
        log(`Executing updateShortUrlFromRequest to update clicks for documentId ${documentId}. . .`);
        const result = await databases.updateDocument(config.databaseId, config.collectionId, documentId, {
            "clicks": clicksNumber + 1
        });
        log('updateShortUrlFromRequest result ->');
        log(result);
        if (result) {
            return {
                statusCode: 200,
                ok: true,
                message: `Successfully updated short url.`,
                data: result
            };
        }
        else {
            return {
                statusCode: 500,
                ok: false,
                message: `Failed to update short url.`
            };
        }
    }
    catch (error) {
        log(error);
        return {
            statusCode: 500,
            ok: false,
            message: `Failed to update short url clicks.`
        };
    }
};
