// utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...meta
        };

        return JSON.stringify(logEntry);
    }

    writeToFile(filename, message) {
        const filePath = path.join(this.logDir, filename);
        const logLine = message + '\n';

        fs.appendFileSync(filePath, logLine, 'utf8');
    }

    info(message, meta = {}) {
        const formattedMessage = this.formatMessage('info', message, meta);
        console.log(`ℹ️  ${message}`, meta);

        if (process.env.NODE_ENV === 'production') {
            this.writeToFile('app.log', formattedMessage);
        }
    }

    error(message, error = null, meta = {}) {
        const errorMeta = error ? {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            ...meta
        } : meta;

        const formattedMessage = this.formatMessage('error', message, errorMeta);
        console.error(`❌ ${message}`, errorMeta);

        this.writeToFile('error.log', formattedMessage);
    }

    warn(message, meta = {}) {
        const formattedMessage = this.formatMessage('warn', message, meta);
        console.warn(`⚠️  ${message}`, meta);

        if (process.env.NODE_ENV === 'production') {
            this.writeToFile('app.log', formattedMessage);
        }
    }

    debug(message, meta = {}) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 ${message}`, meta);
        }
    }

    // Log specifici per il bot
    userAction(action, userId, extra = {}) {
        this.info(`User action: ${action}`, {
            userId,
            action,
            ...extra
        });
    }

    referralEvent(type, referrer, referred, extra = {}) {
        this.info(`Referral event: ${type}`, {
            type,
            referrer,
            referred,
            ...extra
        });
    }

    botEvent(event, details = {}) {
        this.info(`Bot event: ${event}`, {
            event,
            ...details
        });
    }
}

module.exports = new Logger();