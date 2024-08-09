// services/File.js

const OpenAI = require('openai');
const fs = require('fs').promises; // Use the promise-based API
const { createReadStream } = require('fs'); // for streaming file
const Thread = require('../models/Thread');

class FileService {
    constructor(apiKey) {
        this.client = new OpenAI({ apiKey });
    }

    async uploadFilesAndCreateVectorStore(name, files) {
        try {
            console.log(`[uploadFilesAndCreateVectorStore] Uploading files and creating vector store: ${name}`);

            // Create the vector store first
            const vectorStore = await this.client.beta.vectorStores.create({ name });
            console.log(`[uploadFilesAndCreateVectorStore] Vector store created:`, vectorStore);

            // Upload each file and add them to the vector store
            const uploadedFiles = await Promise.all(
                files.map(async (file) => {
                    const filePath = file.path;
                    console.log(`[uploadFilesAndCreateVectorStore] Preparing to upload file: ${file.originalname} from path: ${filePath}`);

                    // Ensure the file has the correct extension
                    if (!file.originalname.includes('.')) {
                        throw new Error(`[uploadFilesAndCreateVectorStore] File ${file.originalname} is missing an extension.`);
                    }

                    const fileStream = createReadStream(filePath);
                    if (!fileStream) {
                        throw new Error(`[uploadFilesAndCreateVectorStore] Failed to create read stream for file: ${filePath}`);
                    }

                    const uploadedFile = await this.client.files.create({
                        file: fileStream,
                        purpose: 'assistants',
                    });

                    console.log(`[uploadFilesAndCreateVectorStore] File uploaded successfully: ${uploadedFile.id}`);

                    // Clean up: Delete the file from disk after successful upload
                    await fs.unlink(filePath);
                    console.log(`[uploadFilesAndCreateVectorStore] Temporary file deleted: ${filePath}`);

                    return { id: uploadedFile.id, name: file.originalname };
                })
            );

            if (uploadedFiles.length === 0) {
                throw new Error("[uploadFilesAndCreateVectorStore] No files were uploaded.");
            }

            // Add files to the vector store
            await this.client.beta.vectorStores.fileBatches.createAndPoll(vectorStore.id, {
                file_ids: uploadedFiles.map(file => file.id)
            });

            console.log(`[uploadFilesAndCreateVectorStore] Files added to vector store and processing complete`);

            // Return the vector store ID and uploaded files
            return { vectorStoreId: vectorStore.id, uploadedFiles };
        } catch (error) {
            console.error(`[uploadFilesAndCreateVectorStore] Error creating vector store and uploading files: ${error.message}`);
            throw error;
        }
    }

    async attachVectorStoreToAssistant(vectorStoreId) {
        try {
            const mainAssistant = await Assistant.findOne({ name: 'MAIN' });
            if (!mainAssistant) {
                throw new Error('Main assistant not found in database');
            }
            await this.client.beta.assistants.update(mainAssistant.assistantId, {
                tool_resources: { 
                    file_search: { 
                        vector_store_ids: [vectorStoreId] 
                    } 
                }
            });
            console.log(`Vector store ${vectorStoreId} attached to assistant ${mainAssistant.assistantId}`);
        } catch (error) {
            console.error(`Error attaching vector store to assistant: ${error.message}`);
            throw error;
        }
    }

    async addFilesToConversation(threadId, files) {
        try {
            console.log(`[addToConversation] Starting to upload files for thread: ${threadId}`);

            // Upload files and create a vector store for the thread
            const { vectorStoreId, uploadedFiles } = await this.uploadFilesAndCreateVectorStore(`ConversationStore_${threadId}`, files);
            console.log(`[addToConversation] Vector store created with ID: ${vectorStoreId}`);

            // Attach vector store to the thread
            await this.client.beta.threads.update(threadId, {
                tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
            });
            console.log(`[addToConversation] Vector store attached to thread ${threadId}`);

            // Update the Thread document in the database with the vector store files
            const vectorStoreFiles = uploadedFiles.map(file => ({
                fileId: file.id,
                fileName: file.name,
                vectorStoreId: vectorStoreId,
                uploadedAt: new Date(),
            }));

            const updatedThread = await Thread.findOneAndUpdate(
                { threadId: threadId },
                { $push: { vectorStoreFiles: { $each: vectorStoreFiles } } },
                { new: true }
            );

            if (!updatedThread) {
                throw new Error(`[addToConversation] Failed to update the thread with vector store files.`);
            }

            console.log(`[addToConversation] Thread updated with vector store files:`, updatedThread);

            return uploadedFiles;
        } catch (error) {
            console.error(`[addToConversation] Error adding files to conversation: ${error.message}`);
            throw error;
        }
    }

    async deleteFileFromConversation(threadId, fileId) {
        try {
            // Find the Thread document and get the vector store ID
            const thread = await Thread.findOne({ threadId: threadId });
            if (!thread) {
                throw new Error('Thread not found');
            }

            const fileToDelete = thread.vectorStoreFiles.find(file => file.fileId === fileId);
            if (!fileToDelete) {
                console.warn(`File ${fileId} not found in thread ${threadId}. It may have been already deleted.`);
                return { message: 'File not found or already deleted' };
            }

            const vectorStoreId = fileToDelete.vectorStoreId;

            // Delete the file from the vector store
            try {
                await this.client.beta.vectorStores.files.del(vectorStoreId, fileId);
            } catch (error) {
                console.warn(`Error deleting file from vector store: ${error.message}`);
            }

            // Delete the file from OpenAI
            try {
                await this.client.files.del(fileId);
            } catch (error) {
                console.warn(`Error deleting file from OpenAI: ${error.message}`);
            }

            // Update the Thread document in the database
            const updatedThread = await Thread.findOneAndUpdate(
                { threadId: threadId },
                { 
                    $pull: { vectorStoreFiles: { fileId: fileId } },
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (!updatedThread) {
                throw new Error('Failed to update thread after file deletion');
            }

            console.log(`File ${fileId} deleted from vector store ${vectorStoreId} and OpenAI`);
            console.log('Updated thread:', updatedThread);
            return { message: 'File deleted successfully' };
        } catch (error) {
            console.error(`Error deleting file from conversation: ${error.message}`);
            throw error;
        }
    }

    async endConversation(threadId) {
        try {
            // Find the Thread document
            const thread = await Thread.findOne({ threadId: threadId });
            if (!thread) {
                throw new Error('Thread not found');
            }

            // Delete all associated files and vector stores
            for (const file of thread.vectorStoreFiles) {
                await this.client.beta.vectorStores.files.del(file.vectorStoreId, file.fileId);
                await this.client.files.del(file.fileId);
            }

            console.log(`All files for thread ${threadId} deleted`);
        } catch (error) {
            console.error(`Error ending conversation: ${error.message}`);
            throw error;
        }
    }
}

module.exports = FileService;