// config/botConfig.js
module.exports = {
    // Messaggi del bot
    MESSAGES: {
        WELCOME_NEW_USER: (name, referrerCode) => {
            const base = `🎉 <b>Benvenuto ${name}!</b>`;
            return referrerCode
                ? `${base}\n✅ <b>Codice referral usato:</b> ${referrerCode}\n\nGrazie per esserti unito! 🚀`
                : `${base}\n\nBenvenuto nella community! 🚀`;
        },

        WELCOME_RETURNING_USER: (name) =>
            `👋 <b>Bentornato ${name}!</b>\n\nUsa /stats per vedere le tue statistiche.`,

        REFERRAL_NOTIFICATION: (newUserName, totalReferrals) =>
            `🎉 <b>Congratulazioni!</b>\n\n👤 <b>${newUserName}</b> si è iscritto!\n📊 <b>Totale referral:</b> ${totalReferrals}\n\nContinua così! 🚀`,

        USER_NOT_FOUND: '❌ Utente non trovato. Usa /start per registrarti.',

        REFERRAL_LINK: (link) =>
            `🔗 <b>Il tuo link referral:</b>\n<code>${link}</code>\n\n💡 Condividilo per guadagnare punti!`,

        HELP_MESSAGE: `
🤖 <b>Comandi disponibili:</b>

/start - Avvia il bot e ottieni il tuo link
/stats - Visualizza le tue statistiche  
/leaderboard - Classifica top referrer
/help - Mostra questo messaggio

🔗 <b>Come funziona:</b>
1. Condividi il tuo link con gli amici
2. Quando si iscrivono, guadagni punti
3. Controlla le statistiche con /stats

💡 Più amici inviti, più sali in classifica!`,

        UNKNOWN_COMMAND: '❓ Comando non riconosciuto. Usa /help per i comandi disponibili.',

        ERROR_GENERIC: '❌ Si è verificato un errore. Riprova più tardi.',

        NO_LEADERBOARD_DATA: '📊 Nessun dato nella classifica ancora.',

        LEADERBOARD_FOOTER: '\n🚀 Continua a invitare amici per scalare la classifica!'
    },

    // Configurazioni
    SETTINGS: {
        LEADERBOARD_LIMIT: 10,
        DEBUG_MODE: process.env.NODE_ENV === 'development',
        MEDALS: ['🥇', '🥈', '🥉'],
        RATE_LIMIT: {
            WINDOW_MS: 60000, // 1 minuto
            MAX_REQUESTS: 30   // Max 30 richieste per minuto
        }
    },

    // Regex patterns
    PATTERNS: {
        START_COMMAND: /\/start(?: (.+))?/,
        STATS_COMMAND: /\/stats/,
        HELP_COMMAND: /\/help/,
        LEADERBOARD_COMMAND: /\/leaderboard/
    },

    // Database queries
    QUERIES: {
        FIND_USER: 'telegram_id, username, referral_count, referrer_code, created_at, last_referral_date',
        TOP_REFERRERS: 'username, referral_count, created_at'
    }
};