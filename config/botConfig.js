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

        HELP_MESSAGE: `
🤖 <b>COMANDI DISPONIBILI:</b>

/start - Unisciti al contest del Napoli
/stats - Le tue statistiche e posizione
/leaderboard - Classifica generale
/verify - Verifica iscrizione al canale
/help - Mostra questo messaggio

🏆 <b>CONTEST NAPOLI - 24 MAGGIO 2025</b>
🎫 <b>PREMIO: 2 BIGLIETTI PER LA PARTITA!</b>

🔥 <b>COME FUNZIONA:</b>
1️⃣ Condividi il tuo link referral
2️⃣ Ogni amico che si iscrive AL CANALE = 1 punto
3️⃣ Chi ha più punti vince i biglietti!

💡 <b>IMPORTANTE:</b> I punti si guadagnano solo quando gli amici si iscrivono al canale!

💙 <b>FORZA NAPOLI!</b> ⚽🔥`,

        UNKNOWN_COMMAND: '❓ Comando non riconosciuto. Usa /help per vedere tutti i comandi del contest!',

        ERROR_GENERIC: '❌ Si è verificato un errore. Riprova e continua a lottare per il Napoli! 💙',

        NO_LEADERBOARD_DATA: '📊 La classifica è ancora vuota. Sii il primo a guadagnare punti per i biglietti del Napoli! 🏆',

        LEADERBOARD_FOOTER: '\n🏆 <b>PREMIO: 2 BIGLIETTI NAPOLI - 24 MAGGIO 2025</b>\n💙 Forza Napoli! ⚽🔥',

        CHANNEL_VERIFICATION_SUCCESS: (hasReferrer) =>
            `🎉 <b>PERFETTO!</b>\n\n` +
            `✅ Iscrizione al canale verificata!\n` +
            (hasReferrer ? `🎁 Il tuo referrer ha guadagnato 1 punto!\n` : '') +
            `🏆 Ora puoi partecipare al contest per i biglietti del Napoli!\n\n` +
            `💙 Forza Napoli! ⚽`,

        CHANNEL_VERIFICATION_FAILED: (channelLink) =>
            `❌ <b>NON RISULTI ISCRITTO AL CANALE!</b>\n\n` +
            `🎫 <b>Per partecipare al contest del Napoli:</b>\n` +
            `1️⃣ Iscriviti al canale: ${channelLink}\n` +
            `2️⃣ Torna qui e usa /verify\n\n` +
            `💡 <b>IMPORTANTE:</b> I punti si guadagnano solo dopo l'iscrizione al canale!\n` +
            `🏆 Sbrigati, i biglietti aspettano solo te!\n\n` +
            `💙 Forza Napoli! ⚽`,

        CHANNEL_VERIFICATION_ALREADY_DONE:
            `✅ <b>Hai già verificato la tua iscrizione!</b>\n\n` +
            `🏆 Sei nel contest per i biglietti del Napoli!\n` +
            `📊 Usa /stats per vedere la tua posizione\n\n` +
            `💙 Forza Napoli! ⚽`,

        CHANNEL_INSTRUCTIONS: (channelLink, hasReferrer) =>
            `📱 <b>ULTIMO PASSO PER ENTRARE NEL CONTEST:</b>\n\n` +
            `1️⃣ Iscriviti al nostro canale: ${channelLink}\n` +
            `2️⃣ Torna qui e usa /verify\n\n` +
            `🏆 <b>SOLO DOPO L'ISCRIZIONE AL CANALE:</b>\n` +
            (hasReferrer ? `🎁 Il tuo referrer guadagnerà 1 punto\n` : '') +
            `📊 Potrai vedere le tue statistiche complete\n` +
            `🎫 Parteciperai al contest per i biglietti!\n\n` +
            `💡 <b>TIP:</b> L'iscrizione può essere verificata automaticamente!\n` +
            `💙 Forza Napoli! ⚽🔥`,

        AUTO_VERIFICATION_SUCCESS: (hasReferrer) =>
            `🎉 <b>BENVENUTO NEL CANALE!</b>\n\n` +
            `✅ La tua iscrizione è stata verificata automaticamente!\n` +
            (hasReferrer ? `🎁 Il tuo referrer ha guadagnato 1 punto!\n` : '') +
            `🏆 Ora sei ufficialmente nel contest per i biglietti del Napoli!\n\n` +
            `💙 Forza Napoli! ⚽🔥`,

        SELF_REFERRAL_WARNING:
            `⚠️ <b>ATTENZIONE!</b>\n\n` +
            `Non puoi usare il tuo stesso link referral! 😅\n` +
            `🏆 Condividi il link con i tuoi AMICI per guadagnare punti!\n\n` +
            `💙 Gioca pulito, come il Napoli! ⚽`
    },

    // Configurazioni
    SETTINGS: {
        LEADERBOARD_LIMIT: 10,
        DEBUG_MODE: process.env.NODE_ENV === 'development',
        MEDALS: ['🥇', '🥈', '🥉'],
        CONTEST_DATE: '24 MAGGIO 2025',
        PRIZE: '2 BIGLIETTI NAPOLI',
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
        LEADERBOARD_COMMAND: /\/leaderboard/,
        VERIFY_COMMAND: /\/verify/
    },

    // Database queries
    QUERIES: {
        FIND_USER: 'telegram_id, username, referral_count, referrer_code, created_at, last_referral_date, channel_verified, channel_verified_date',
        TOP_REFERRERS: 'username, referral_count, created_at'
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
                    `⚠️ <b>ISCRIVITI AL CANALE e usa /verify per partecipare!</b>\n` :
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
        }
    }
};