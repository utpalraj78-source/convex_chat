import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, 'server-error.log');

export function setupErrorHandlers() {
    // Log both to console and file
    const logError = (type, error) => {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type}: ${error.stack || error}\n`;
        
        console.error(logMessage);
        fs.appendFileSync(logFile, logMessage);
    };

    process.on('uncaughtException', (error) => {
        logError('Uncaught Exception', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logError('Unhandled Rejection', reason);
    });

    // Keep the process running
    process.stdin.resume();
}