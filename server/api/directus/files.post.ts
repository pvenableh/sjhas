// server/api/directus/files.post.ts
/**
 * Server API route for file operations
 * Uses native Directus SDK methods for file management
 */

import {
  readFiles,
  readFile,
  updateFile,
  deleteFile,
  deleteFiles,
} from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { operation, id, data, query } = body;

    if (!operation) {
      throw createError({
        statusCode: 400,
        message: "Operation is required",
      });
    }

    const directus = await getUserDirectus(event);

    switch (operation) {
      case "list":
        return await directus.request(readFiles(query || {}));

      case "get":
        if (!id) throw new Error("File ID required for get operation");
        return await directus.request(readFile(id, query || {}));

      case "update":
        if (!id) throw new Error("File ID required for update operation");
        if (!data) throw new Error("Data required for update operation");
        return await directus.request(updateFile(id, data));

      case "delete":
        if (!id) throw new Error("File ID required for delete operation");

        if (Array.isArray(id)) {
          await directus.request(deleteFiles(id));
          return { deleted: id.length };
        } else {
          await directus.request(deleteFile(id));
          return { deleted: 1 };
        }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error: any) {
    const statusCode = getDirectusHttpStatus(error);
    const message = getDirectusErrorMessage(error);
    console.error("Directus files API error:", { message, statusCode });

    throw createError({ statusCode, message });
  }
});
