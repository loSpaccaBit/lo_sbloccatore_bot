// config/botConfig.js
module.exports = {
    // Messaggi del bot
    MESSAGES: {
        WELCOME_NEW_USER: (name, referrerCode, isSelfReferral = false) => {
            if (isSelfReferral) {
                return `🎉 <b>Benvenuto ${name}!</b>\n\n` +
                    `⚠️ Hai provato ad usare il tuo stesso link referral, ma non puoi vincere punti così! 😅\n\n` +
                    `🏆 <b>CONTEST NAPOLI - 24 MAGGIO 2025</b>\n` +
                    `🎫 <b>VINCI 2 BIGLIETTI PER LA PARTITA!</b>\n\n` +
                    `📱 Condividi il TUO link con gli amici per accumulare punti!\n` +
                    `💙 Forza Napoli! 🔥`;
            }

            const base = `🎉 <b>Benvenuto ${name}!</b>\n\n` +
                `🏆 <b>CONTEST NAPOLI - 24 MAGGIO 2025</b>\n` +
                `🎫 <b>VINCI 2 BIGLIETTI PER LA PARTITA!</b>\n\n`;

            return referrerCode && referrerCode !== 'self'
                ? `${base}✅ <b>Sei stato invitato da un amico!</b>\n\n` +
                `🔥 Ora tocca a te: invita i tuoi amici e scala la classifica!\n` +
                `💙 Forza Napoli! ⚽`
                : `${base}🚀 <b>Benvenuto nella community napoletana!</b>\n\n` +
                `💪 Invita i tuoi amici e potresti vincere i biglietti!\n` +
                `💙 Forza Napoli! ⚽`;
        },

        WELCOME_RETURNING_USER: (name) =>
            `👋 <b>Bentornato ${name}!</b>\n\n` +
            `🏆 <b>CONTEST NAPOLI ATTIVO!</b>\n` +
            `🎫 2 biglietti in palio per il 24 maggio 2025\n\n` +
            `📊 Usa /stats per vedere la tua posizione in classifica!\n` +
            `💙 Forza Napoli! ⚽`,

        REFERRAL_NOTIFICATION: (newUserName, totalReferrals) =>
            `🎉 <b>PUNTO GUADAGNATO!</b>\n\n` +
            `👤 <b>${newUserName}</b> si è iscritto al canale grazie a te!\n` +
            `📊 <b>Totale tuoi punti:</b> ${totalReferrals}\n\n` +
            `🏆 Continua così per vincere i biglietti del Napoli!\n` +
            `💙 Ogni amico che si iscrive = 1 punto! ⚽`,

        USER_NOT_FOUND: '❌ Utente non trovato. Usa /start per unirti al contest del Napoli!',

        REFERRAL_LINK: (link) =>
            `🔗 <b>IL TUO LINK MAGICO:</b>\n<code>${link}</code>\n\n` +
            `🏆 <b>COME VINCERE I BIGLIETTI:</b>\n` +
            `1️⃣ Condividi questo link con i tuoi amici\n` +
            `2️⃣ Ogni amico che si iscrive al canale = 1 punto\n` +
            `3️⃣ Chi ha più punti vince 2 biglietti!\n\n` +
            `💙 <b>FORZA NAPOLI!</b> ⚽🔥`,

        HELP_MESSAGE: `🤖 <b>COMANDI DISPONIBILI:</b>

/start - Unisciti al contest del Napoli
/stats - Le tue statistiche e posizione
/leaderboard - Classifica generale
/help - Mostra questo messaggio

🏆 <b>CONTEST NAPOLI - 24 MAGGIO 2025</b>
🎫 <b>PREMIO: 2 BIGLIETTI PER LA PARTITA!</b>

🔥 <b>COME FUNZIONA:</b>
1️⃣ Condividi il tuo link referral
2️⃣ Ogni amico che si iscrive AL CANALE = 1 punto
3️⃣ Chi ha più punti vince i biglietti!

💡 <b>IMPORTANTE:</b> I punti si guadagnano automaticamente quando gli amici si iscrivono al canale!

💙 <b>FORZA NAPOLI!</b> ⚽🔥`,

        UNKNOWN_COMMAND: '❓ Comando non riconosciuto. Usa /help per vedere tutti i comandi del contest!',

        ERROR_GENERIC: '❌ Si è verificato un errore. Riprova e continua a lottare per il Napoli! 💙',

        ERROR_STATS: '❌ Errore nel recupero delle statistiche. Riprova tra poco!',

        ERROR_LEADERBOARD: '❌ Errore nel recupero della classifica. Riprova tra poco!',

        NO_LEADERBOARD_DATA: '📊 La classifica è ancora vuota. Sii il primo a guadagnare punti per i biglietti del Napoli! 🏆',

        CHANNEL_INSTRUCTIONS: (channelLink, hasReferrer) =>
            `📱 <b>COME PARTECIPARE AL CONTEST:</b>\n\n` +
            `1️⃣ Iscriviti al nostro canale: ${channelLink}\n` +
            `2️⃣ La verifica avviene AUTOMATICAMENTE!\n\n` +
            `🏆 <b>DOPO L'ISCRIZIONE AL CANALE:</b>\n` +
            (hasReferrer ? `🎁 Il tuo referrer guadagnerà automaticamente 1 punto\n` : '') +
            `📊 Potrai vedere le tue statistiche complete\n` +
            `🎫 Parteciperai ufficialmente al contest!\n\n` +
            `💡 <b>TIP:</b> La verifica è completamente automatica - nessun comando da digitare!\n` +
            `💙 Forza Napoli! ⚽🔥`,

        AUTO_VERIFICATION_SUCCESS: (hasReferrer) =>
            `🎉 <b>VERIFICA AUTOMATICA COMPLETATA!</b>\n\n` +
            `✅ La tua iscrizione al canale è stata verificata automaticamente!\n` +
            (hasReferrer ? `🎁 Il tuo referrer ha guadagnato 1 punto!\n` : '') +
            `🏆 Ora sei ufficialmente nel contest per i biglietti del Napoli!\n\n` +
            `📊 Usa /stats per vedere le tue statistiche\n` +
            `🔗 Condividi il tuo link e invita altri amici!\n\n` +
            `💙 Forza Napoli! ⚽🔥`,

        SELF_REFERRAL_WARNING:
            `⚠️ <b>ATTENZIONE!</b>\n\n` +
            `Non puoi usare il tuo stesso link referral! 😅\n` +
            `🏆 Condividi il link con i tuoi AMICI per guadagnare punti!\n\n` +
            `💙 Gioca pulito, come il Napoli! ⚽`,

        VERIFICATION_QUEUE_FULL:
            `⏳ <b>Sistema occupato</b>\n\n` +
            `La verifica automatica è in corso per molti utenti.\n` +
            `Riprova tra qualche minuto!\n\n` +
            `💙 Forza Napoli! ⚽`,

        MAINTENANCE_MODE:
            `🔧 <b>Manutenzione in corso</b>\n\n` +
            `Il bot è temporaneamente in manutenzione.\n` +
            `Riprova tra qualche minuto!\n\n` +
            `💙 Forza Napoli! ⚽`
    },

    // Configurazioni
    SETTINGS: {
        LEADERBOARD_LIMIT: 10,
        DEBUG_MODE: process.env.NODE_ENV === 'development',
        MEDALS: ['🥇', '🥈', '🥉'],
        CONTEST_DATE: '24 MAGGIO 2025',
        PRIZE: '2 BIGLIETTI NAPOLI',

        // Configurazioni per la verifica automatica
        AUTO_CHECK_INTERVAL: 30000, // 30 secondi
        VERIFICATION_DELAY: 1000,   // 1 secondo tra una verifica e l'altra
        MAX_VERIFICATION_AGE: 7 * 24 * 60 * 60 * 1000, // 7 giorni in millisecondi
        MAX_QUEUE_SIZE: 100, // Massimo numero di utenti in coda per la verifica

        // Rate limiting
        RATE_LIMIT: {
            WINDOW_MS: 60000, // 1 minuto
            MAX_REQUESTS: 30   // Max 30 richieste per minuto
        },

        // Emoji e simboli
        EMOJI: {
            TROPHY: '🏆',
            FIRE: '🔥',
            HEART_BLUE: '💙',
            SOCCER: '⚽',
            TICKET: '🎫',
            CHECK: '✅',
            WARNING: '⚠️',
            ERROR: '❌',
            PARTY: '🎉',
            ROCKET: '🚀',
            CROWN: '👑',
            TARGET: '🎯'
        }
    },

    // Regex patterns
    PATTERNS: {
        START_COMMAND: /\/start(?: (.+))?/,
        STATS_COMMAND: /\/stats/,
        HELP_COMMAND: /\/help/,
        LEADERBOARD_COMMAND: /\/leaderboard/,
        VERIFY_COMMAND: /\/verify/ // Mantenuto per compatibilità ma non più utilizzato
    },

    // Database queries
    QUERIES: {
        FIND_USER: 'telegram_id, username, referral_count, referrer_code, created_at, last_referral_date, channel_verified, channel_verified_date',
        TOP_REFERRERS: 'username, referral_count, created_at, telegram_id'
    },

    // Funzioni di formattazione
    FORMATTERS: {
        STATS_MESSAGE: (user, botUsername) => {
            const registrationDate = new Date(user.created_at).toLocaleDateString('it-IT');
            const lastReferralDate = user.last_referral_date
                ? new Date(user.last_referral_date).toLocaleDateString('it-IT')
                : 'Mai';
            const channelStatus = user.channel_verified ? '✅ Verificato' : '❌ Non verificato';
            const verificationDate = user.channel_verified_date
                ? new Date(user.channel_verified_date).toLocaleDateString('it-IT')
                : 'N/A';

            return `🏆 <b>CONTEST NAPOLI - LE TUE STATS:</b>\n\n` +
                `👤 <b>Username:</b> ${user.username}\n` +
                `🎯 <b>Punti guadagnati:</b> ${user.referral_count || 0}\n` +
                `📅 <b>Registrato il:</b> ${registrationDate}\n` +
                `🕐 <b>Ultimo punto:</b> ${lastReferralDate}\n` +
                `📱 <b>Canale:</b> ${channelStatus}\n` +
                (user.channel_verified ? `✅ <b>Verificato il:</b> ${verificationDate}\n` : '') +
                `\n🔗 <b>IL TUO LINK MAGICO:</b>\n` +
                `<code>https://t.me/${botUsername}?start=${user.telegram_id}</code>\n\n` +
                `🏆 <b>OBIETTIVO:</b> Accumula più punti possibili!\n` +
                `🎫 <b>PREMIO:</b> 2 biglietti Napoli - 24 maggio 2025\n\n` +
                (!user.channel_verified ?
                    `⚠️ <b>ISCRIVITI AL CANALE per partecipare al contest!</b>\n` :
                    `💪 <b>Sei nel contest! Continua a invitare amici!</b>\n`) +
                `💙 Forza Napoli! ⚽🔥`;
        },

        LEADERBOARD_MESSAGE: (topUsers) => {
            const medals = ['🥇', '🥈', '🥉'];
            let message = `🏆 <b>CLASSIFICA CONTEST NAPOLI:</b>\n` +
                `🎫 <b>PREMIO: 2 BIGLIETTI - 24 MAGGIO 2025</b>\n\n`;

            if (topUsers.length === 0) {
                return message + `📊 Nessuno ha ancora guadagnato punti!\n` +
                    `🚀 Sii il primo a invitare amici e vincere i biglietti!\n\n` +
                    `💙 Forza Napoli! ⚽🔥`;
            }

            topUsers.forEach((user, index) => {
                const medal = medals[index] || `${index + 1}º`;
                const username = user.username.startsWith('user_')
                    ? `Tifoso ${user.username.slice(-4)}`
                    : user.username;

                const pointsText = user.referral_count === 1 ? 'punto' : 'punti';
                message += `${medal} <b>${username}</b> - ${user.referral_count} ${pointsText}\n`;
            });

            message += `\n🏆 <b>PREMIO: 2 BIGLIETTI NAPOLI - 24 MAGGIO 2025</b>\n` +
                `🔥 Continua a invitare amici per vincere!\n` +
                `💙 Forza Napoli! ⚽`;

            return message;
        },

        USER_DISPLAY_NAME: (username, telegramId) => {
            return username.startsWith('user_')
                ? `Tifoso ${telegramId.slice(-4)}`
                : username;
        },

        REFERRAL_LINK: (botUsername, telegramId) => {
            return `https://t.me/${botUsername}?start=${telegramId}`;
        },

        DATE_ITALIAN: (dateString) => {
            return new Date(dateString).toLocaleDateString('it-IT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    },

    // Funzioni di validazione
    VALIDATORS: {
        IS_VALID_TELEGRAM_ID: (id) => {
            return /^\d+$/.test(id) && id.length >= 5 && id.length <= 15;
        },

        IS_VALID_USERNAME: (username) => {
            return username && username.length >= 3 && username.length <= 50;
        },

        IS_SELF_REFERRAL: (telegramId, referrerCode) => {
            return referrerCode === telegramId;
        }
    },

    // Costanti per i tempi
    TIME_CONSTANTS: {
        ONE_SECOND: 1000,
        ONE_MINUTE: 60 * 1000,
        ONE_HOUR: 60 * 60 * 1000,
        ONE_DAY: 24 * 60 * 60 * 1000,
        ONE_WEEK: 7 * 24 * 60 * 60 * 1000
    },

    // Configurazioni avanzate
    ADVANCED_SETTINGS: {
        // Retry logic per le operazioni database
        DB_RETRY_ATTEMPTS: 3,
        DB_RETRY_DELAY: 2000,

        // Configurazioni per le notifiche
        NOTIFICATION_RETRY_ATTEMPTS: 2,
        NOTIFICATION_DELAY: 500,

        // Configurazioni per il logging
        LOG_LEVEL: process.env.LOG_LEVEL || 'info',
        LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',

        // Configurazioni per la sicurezza
        MAX_MESSAGE_LENGTH: 4096,
        MAX_USERNAME_LENGTH: 50,
        BLOCKED_WORDS: ['spam', 'scam', 'fake'],

        // Feature flags
        FEATURES: {
            AUTO_VERIFICATION: true,
            LEADERBOARD_ENABLED: true,
            STATS_ENABLED: true,
            REFERRAL_NOTIFICATIONS: true,
            DEBUG_LOGGING: process.env.NODE_ENV === 'development'
        }
    },

    // Messaggi di sistema per gli amministratori
    ADMIN_MESSAGES: {
        BOT_STARTED: (botUsername, env, channelId) =>
            `🤖 Bot ${botUsername} avviato!\n` +
            `📝 Ambiente: ${env}\n` +
            `📱 Channel ID: ${channelId}\n` +
            `🔄 Verifica automatica attiva`,

        USER_REGISTERED: (telegramId, username, referrerCode) =>
            `👤 Nuovo utente registrato:\n` +
            `ID: ${telegramId}\n` +
            `Username: ${username}\n` +
            `Referrer: ${referrerCode || 'Nessuno'}`,

        VERIFICATION_COMPLETED: (telegramId, username) =>
            `✅ Verifica completata per:\n` +
            `ID: ${telegramId}\n` +
            `Username: ${username}`,

        ERROR_OCCURRED: (error, context) =>
            `❌ Errore nel sistema:\n` +
            `Contesto: ${context}\n` +
            `Errore: ${error.message}`,

        STATS_SUMMARY: (totalUsers, verifiedUsers, totalReferrals) =>
            `📊 Statistiche bot:\n` +
            `👥 Utenti totali: ${totalUsers}\n` +
            `✅ Utenti verificati: ${verifiedUsers}\n` +
            `🔗 Referral totali: ${totalReferrals}`
    },

    // Utility functions
    UTILS: {
        ESCAPE_HTML: (text) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');
        },

        TRUNCATE_TEXT: (text, maxLength = 100) => {
            return text.length > maxLength
                ? text.substring(0, maxLength) + '...'
                : text;
        },

        GENERATE_RANDOM_ID: () => {
            return Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
        },

        DELAY: (ms) => new Promise(resolve => setTimeout(resolve, ms))
    }
};