const TelegramBot = require('node-telegram-bot-api');
const supabase = require('./supabaseClient');

class ReferralBot {
    constructor() {
        this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
        this.BOT_USERNAME = process.env.BOT_USERNAME || 'loSbloccatore_bot';
        this.CHANNEL_ID = process.env.CHANNEL_ID;
        this.CHANNEL_USERNAME = process.env.CHANNEL_USERNAME; // Aggiungi questo nel .env come @channelname
        this.CHANNEL_NAME = process.env.CHANNEL_NAME;
        this.initializeHandlers();
        this.setupErrorHandling();
    }

    initializeHandlers() {
        // Handler per il comando /start
        this.bot.onText(/\/start(?: (.+))?/, this.handleStart.bind(this));

        // Handler per il comando /stats
        this.bot.onText(/\/stats/, this.handleStats.bind(this));

        // Handler per il comando /help
        this.bot.onText(/\/help/, this.handleHelp.bind(this));

        // Handler per il comando /leaderboard
        this.bot.onText(/\/leaderboard/, this.handleLeaderboard.bind(this));

        // Handler per il comando /verify (per verificare l'iscrizione al canale)
        this.bot.onText(/\/verify/, this.handleVerifyChannel.bind(this));

        // Handler per nuovi membri del canale
        this.bot.on('new_chat_members', this.handleNewChannelMember.bind(this));

        // Handler per messaggi non riconosciuti
        this.bot.on('message', this.handleUnknownMessage.bind(this));
    }

    setupErrorHandling() {
        this.bot.on('error', (error) => {
            console.error('Bot error:', error);
        });

        this.bot.on('polling_error', (error) => {
            console.error('Polling error:', error);
        });

        // Gestione errori non catturati
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }

    async handleStart(msg, match) {
        const chatId = msg.chat.id;
        const user = this.extractUserInfo(msg);
        const referrerCode = this.extractReferrerCode(match);

        this.logDebugInfo(msg, user, referrerCode);

        try {
            const existingUser = await this.findUserByTelegramId(user.telegramId);

            if (!existingUser) {
                await this.registerNewUser(user, referrerCode, chatId);
            } else {
                await this.handleReturningUser(user, chatId);
            }

            await this.sendReferralLink(chatId, user.telegramId);

        } catch (error) {
            console.error('Errore in handleStart:', error);
            await this.sendErrorMessage(chatId, 'Si è verificato un errore durante la registrazione.');
        }
    }

    async handleStats(msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id.toString();

        try {
            const user = await this.findUserByTelegramId(telegramId);

            if (!user) {
                return this.bot.sendMessage(chatId,
                    '❌ Utente non trovato. Usa /start per registrarti prima.'
                );
            }

            const statsMessage = this.formatStatsMessage(user);
            await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });

        } catch (error) {
            console.error('Errore in handleStats:', error);
            await this.sendErrorMessage(chatId, 'Errore nel recupero delle statistiche.');
        }
    }

    async handleHelp(msg) {
        const chatId = msg.chat.id;
        ///leaderboard - Classifica dei top referrer
        const helpMessage = `
🤖 <b>Comandi disponibili:</b>

/start - Avvia il bot e ottieni il tuo link referral
/stats - Visualizza le tue statistiche
/verify - Verifica la tua iscrizione al canale
/help - Mostra questo messaggio

🔗 <b>Come funziona:</b>
1. Condividi il tuo link referral con gli amici
2. Quando si iscrivono al bot E al canale, guadagni punti
3. Usa /verify per controllare l'iscrizione al canale
4. Controlla le tue statistiche con /stats

📱 <b>Importante:</b> I punti vengono assegnati solo dopo l'iscrizione al canale!

💡 <b>Suggerimento:</b> Più amici inviti, più sali in classifica!
        `.trim();

        await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });
    }

    async handleLeaderboard(msg) {
        const chatId = msg.chat.id;

        try {
            const topUsers = await this.getTopReferrers(10);

            if (topUsers.length === 0) {
                return this.bot.sendMessage(chatId,
                    '📊 La classifica è ancora vuota. Sii il primo a invitare qualcuno!'
                );
            }

            const leaderboardMessage = this.formatLeaderboardMessage(topUsers);
            await this.bot.sendMessage(chatId, leaderboardMessage, { parse_mode: 'HTML' });

        } catch (error) {
            console.error('Errore in handleLeaderboard:', error);
            await this.sendErrorMessage(chatId, 'Errore nel recupero della classifica.');
        }
    }

    async handleVerifyChannel(msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id.toString();

        try {
            const user = await this.findUserByTelegramId(telegramId);

            if (!user) {
                return this.bot.sendMessage(chatId,
                    '❌ Utente non trovato. Usa /start per registrarti prima.'
                );
            }

            if (user.channel_verified) {
                return this.bot.sendMessage(chatId,
                    '✅ Hai già verificato la tua iscrizione al canale!'
                );
            }

            const isSubscribed = await this.checkChannelMembership(telegramId);

            if (isSubscribed) {
                await this.verifyChannelMembership(telegramId);

                // Assegna il punto al referrer se presente
                if (user.referrer_code && user.referrer_code !== telegramId) {
                    try {
                        const referrer = await this.incrementReferralCount(user.referrer_code);
                        if (referrer) {
                            await this.notifyReferrer(referrer, user.username);
                        }
                    } catch (error) {
                        console.error('Errore nel processo referral:', error);
                    }
                }

                await this.bot.sendMessage(chatId,
                    '🎉 <b>Perfetto!</b>\n\n✅ Iscrizione al canale verificata!\n' +
                    (user.referrer_code && user.referrer_code !== telegramId ?
                        '🎁 Il tuo referrer ha ricevuto 1 punto!' : ''),
                    { parse_mode: 'HTML' }
                );
            } else {
                await this.bot.sendMessage(chatId,
                    `❌ <b>Non risulti iscritto al canale!</b>\n\n` +
                    `📱 <b>Per completare la registrazione:</b>\n` +
                    `1. Iscriviti al canale: ${this.CHANNEL_USERNAME || this.CHANNEL_NAME}\n` +
                    `2. Torna qui e usa il comando /verify\n\n` +
                    `💡 Solo dopo l'iscrizione al canale i punti verranno assegnati!`,
                    { parse_mode: 'HTML' }
                );
            }

        } catch (error) {
            console.error('Errore in handleVerifyChannel:', error);
            await this.sendErrorMessage(chatId, 'Errore nella verifica del canale.');
        }
    }

    async handleNewChannelMember(msg) {
        // Questo handler viene chiamato quando qualcuno si unisce al canale
        // Verifica automaticamente se l'utente è nel sistema referral
        console.log('Nuovo membro nel canale, chat ID:', msg.chat.id);

        // Controlla se il messaggio proviene dal canale corretto
        const chatId = msg.chat.id.toString();
        const targetChannelId = this.CHANNEL_ID.toString();

        console.log('Chat ID messaggio:', chatId);
        console.log('Channel ID configurato:', targetChannelId);

        if (chatId === targetChannelId || chatId === targetChannelId.replace('-100', '')) {
            const newMembers = msg.new_chat_members;

            for (const member of newMembers) {
                const telegramId = member.id.toString();
                console.log('Processando nuovo membro:', telegramId);

                try {
                    const user = await this.findUserByTelegramId(telegramId);

                    if (user && !user.channel_verified) {
                        console.log('Utente trovato nel sistema, verificando canale...');
                        await this.verifyChannelMembership(telegramId);

                        // Assegna il punto al referrer
                        if (user.referrer_code && user.referrer_code !== telegramId) {
                            const referrer = await this.incrementReferralCount(user.referrer_code);
                            if (referrer) {
                                await this.notifyReferrer(referrer, user.username);
                            }
                        }

                        // Notifica l'utente
                        try {
                            await this.bot.sendMessage(telegramId,
                                '🎉 <b>Benvenuto nel canale!</b>\n\n' +
                                '✅ La tua iscrizione è stata verificata automaticamente!\n' +
                                (user.referrer_code && user.referrer_code !== telegramId ?
                                    '🎁 Il tuo amico ha ricevuto 1 punto!\n\nProvaci anche TU!' : ''),
                                { parse_mode: 'HTML' }
                            );
                        } catch (notifyError) {
                            console.log('Non è stato possibile notificare l\'utente direttamente:', notifyError.message);
                        }
                    }
                } catch (error) {
                    console.error('Errore nel processare nuovo membro:', error);
                }
            }
        }
    }

    async handleUnknownMessage(msg) {
        // Ignora i comandi già gestiti e i messaggi del canale
        if (msg.chat.type === 'channel') {
            return; // Ignora i messaggi del canale
        }

        if (msg.text && msg.text.startsWith('/')) {
            const command = msg.text.split(' ')[0];
            if (!['/start', '/stats', '/help', '/leaderboard', '/verify'].includes(command)) {
                await this.bot.sendMessage(msg.chat.id,
                    '❓ Comando non riconosciuto. Usa /help per vedere i comandi disponibili.'
                );
            }
        }
    }

    // Utility methods
    extractUserInfo(msg) {
        const telegramId = msg.from.id.toString();
        const userIdentifier = msg.from.username || `user_${telegramId}`;
        const displayName = msg.from.first_name || msg.from.username || `User ${telegramId}`;

        return { telegramId, userIdentifier, displayName };
    }

    extractReferrerCode(match) {
        return match && match[1] ? match[1].trim() : null;
    }

    logDebugInfo(msg, user, referrerCode) {
        if (process.env.NODE_ENV === 'development') {
            console.log('=== DEBUG INFO ===');
            console.log('Messaggio:', msg.text);
            console.log('User Info:', user);
            console.log('Referrer Code:', referrerCode);
            console.log('==================');
        }
    }

    async checkChannelMembership(telegramId) {
        try {
            let chatId = this.CHANNEL_ID;

            console.log('Verificando iscrizione per utente:', telegramId);
            console.log('Channel ID configurato:', chatId);

            // Verifica che CHANNEL_ID sia configurato
            if (!chatId) {
                console.error('CHANNEL_ID non configurato nel file .env');
                return false;
            }

            // Se CHANNEL_ID inizia con @, prova a ottenere le info del canale
            if (chatId.startsWith('@')) {
                try {
                    const chat = await this.bot.getChat(chatId);
                    console.log('Info canale ottenute:', chat.id);
                    chatId = chat.id.toString();
                } catch (error) {
                    console.error('Impossibile ottenere info del canale con username:', error.message);
                    return false;
                }
            }

            const member = await this.bot.getChatMember(chatId, telegramId);
            console.log('Status membro:', member.status);

            const validStatuses = ['member', 'administrator', 'creator'];
            const isValid = validStatuses.includes(member.status);

            console.log('Iscrizione valida:', isValid);
            return isValid;

        } catch (error) {
            console.error(`Errore durante la verifica dell'iscrizione al canale:`, error.message);

            // Log più dettagliato per debug
            if (error.response && error.response.body) {
                console.error('Dettagli errore API:', error.response.body);
            }

            return false;
        }
    }

    async verifyChannelMembership(telegramId) {
        const { error } = await supabase
            .from('referrals')
            .update({
                channel_verified: true,
                channel_verified_date: new Date().toISOString()
            })
            .eq('telegram_id', telegramId);

        if (error) {
            throw new Error(`Errore nell'aggiornamento verifica canale: ${error.message}`);
        }

        console.log(`✅ Verifica canale completata per utente ${telegramId}`);
    }

    // Database operations
    async findUserByTelegramId(telegramId) {
        const { data, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('telegram_id', telegramId)
            .maybeSingle();

        if (error) {
            throw new Error(`Errore nella ricerca utente: ${error.message}`);
        }

        return data;
    }

    async findReferrerByTelegramId(referrerTelegramId) {
        const { data, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('telegram_id', referrerTelegramId)
            .maybeSingle();

        if (error) {
            throw new Error(`Errore nella ricerca referrer: ${error.message}`);
        }

        return data;
    }

    async createUser(userData) {
        const userDataWithChannelFields = {
            ...userData,
            channel_verified: false,
            channel_verified_date: null
        };

        const { data, error } = await supabase
            .from('referrals')
            .insert([userDataWithChannelFields])
            .select()
            .single();

        if (error) {
            throw new Error(`Errore nella creazione utente: ${error.message}`);
        }

        return data;
    }

    async incrementReferralCount(referrerTelegramId) {
        const referrer = await this.findReferrerByTelegramId(referrerTelegramId);

        if (!referrer) {
            console.log(`❌ Referrer non trovato: ${referrerTelegramId}`);
            return false;
        }

        const { error } = await supabase
            .from('referrals')
            .update({
                referral_count: (referrer.referral_count || 0) + 1,
                last_referral_date: new Date().toISOString()
            })
            .eq('telegram_id', referrerTelegramId);

        if (error) {
            throw new Error(`Errore nell'incremento contatore: ${error.message}`);
        }

        console.log(`✅ Incrementato contatore per ${referrerTelegramId}: ${(referrer.referral_count || 0) + 1}`);
        return referrer;
    }

    async getTopReferrers(limit = 10) {
        const { data, error } = await supabase
            .from('referrals')
            .select('telegram_id, username, referral_count, created_at')
            .gt('referral_count', 0)
            .order('referral_count', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            throw new Error(`Errore nel recupero classifica: ${error.message}`);
        }

        return data || [];
    }

    // Business logic
    async registerNewUser(user, referrerCode, chatId) {
        const newUserData = {
            telegram_id: user.telegramId,
            username: user.userIdentifier,
            referrer_code: referrerCode,
            referral_count: 0
        };

        console.log('Registrando nuovo utente:', newUserData);

        const newUser = await this.createUser(newUserData);
        console.log('Nuovo utente salvato:', newUser);

        if (referrerCode === user.telegramId) {
            console.log(`⚠️ Tentativo di auto-referral bloccato per utente ${user.telegramId}`);
            await this.bot.sendMessage(chatId,
                '⚠️ <b>Attenzione:</b> Non puoi usare il tuo stesso link referral!',
                { parse_mode: 'HTML' }
            );
        }

        const welcomeMessage = this.formatWelcomeMessage(user.displayName, referrerCode, referrerCode === user.telegramId);
        await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'HTML' });

        await this.sendChannelInstructions(chatId, !!referrerCode && referrerCode !== user.telegramId);
    }

    async sendChannelInstructions(chatId, hasReferrer) {
        const channelLink = this.CHANNEL_USERNAME || this.CHANNEL_NAME || 'il nostro canale';
        const message = `⚽ <b>Partecipa al contest per il Napoli!</b>\n\n` +
            `1️⃣ Unisciti al canale: ${channelLink}\n` +
            `2️⃣ Usa /verify per confermare\n\n` +
            `🎟️ <b>Premio:</b> 2 biglietti per Napoli-Inter, 24/05/2025!\n` +
            (hasReferrer ? `🎁 Condividi il tuo link e scala la classfica\n` : '') +
            `🔥 Invita più amici e scala la classifica!`;
        await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    async handleReturningUser(user, chatId) {
        const message = `👋 <b>Bentornato ${user.displayName}!</b>\n\n` +
            `Usa /stats per vedere le tue statistiche attuali.`;

        await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    async notifyReferrer(referrer, newUserName) {
        try {
            const message = `🎉 <b>Congratulazioni!</b>

👤 <b>${newUserName}</b> si è iscritto usando il tuo link referral!
📊 <b>Totale tuoi referral:</b> ${referrer.referral_count + 1}

Continua così! 🚀`;

            await this.bot.sendMessage(referrer.telegram_id, message, { parse_mode: 'HTML' });
            console.log(`✅ Notifica inviata a ${referrer.telegram_id}`);
        } catch (error) {
            console.error('Errore nell\'invio notifica al referrer:', error);
        }
    }

    async sendReferralLink(chatId, telegramId) {
        const referralLink = `https://t.me/${this.BOT_USERNAME}?start=${telegramId}`;
        const message = `🔗 <b>Il tuo link:</b>\n${referralLink}\n\n` +
            `💡 Condividilo con i tuoi amici per guadagnare punti!`;

        await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }

    async sendErrorMessage(chatId, message) {
        const errorMessage = `❌ ${message}\n\nSe il problema persiste, contatta il supporto.`;
        await this.bot.sendMessage(chatId, errorMessage);
    }

    // Message formatting
    formatWelcomeMessage(displayName, referrerCode, isSelfReferral = false) {
        const baseMessage = `🎉 <b>Ciao ${displayName}!</b> Benvenuto nel nostro contest!`;
        if (isSelfReferral) {
            return `${baseMessage}\n\n⚠️ Ops! Non puoi usare il tuo stesso link referral.\n` +
                `💥 Inizia ora: invita amici e vinci 2 biglietti per la partita del Napoli del 24/05/2025! ⚽`;
        }
        if (referrerCode) {
            return `${baseMessage}\n✅ Un amico ti ha invitato al contest!\n` +
                `💥 Invita altri amici e vinci 2 biglietti per la partita del Napoli del 24/05/2025! ⚽`;
        }
        return `${baseMessage}\n💥 Invita amici e vinci 2 biglietti per la partita del Napoli del 24/05/2025! ⚽`;
    }

    formatStatsMessage(user) {
        const registrationDate = new Date(user.created_at).toLocaleDateString('it-IT');
        const lastReferralDate = user.last_referral_date
            ? new Date(user.last_referral_date).toLocaleDateString('it-IT')
            : 'Mai';
        const channelStatus = user.channel_verified ? '✅ Verificato' : '❌ Non verificato';

        return `📊 <b>Le tue statistiche:</b>

👤 <b>Username:</b> ${user.username}
👥 <b>Referral invitati:</b> ${user.referral_count || 0}
📅 <b>Registrato il:</b> ${registrationDate}
🕐 <b>Ultimo referral:</b> ${lastReferralDate}
📱 <b>Canale:</b> ${channelStatus}

🔗 <b>Il tuo link:</b>
<code>https://t.me/${this.BOT_USERNAME}?start=${user.telegram_id}</code>

${!user.channel_verified ? '\n⚠️ <b>Iscriviti al canale e usa /verify per completare la registrazione!</b>' : ''}`;
    }

    formatLeaderboardMessage(topUsers) {
        const medals = ['🥇', '🥈', '🥉'];
        let message = '🏆 <b>Classifica Top Referrer:</b>\n\n';

        topUsers.forEach((user, index) => {
            const medal = medals[index] || `${index + 1}.`;
            const username = user.username.startsWith('user_')
                ? `Utente ${user.username.slice(-4)}`
                : user.username;

            message += `${medal} <b>${username}</b> - ${user.referral_count} referral\n`;
        });

        message += '\n🚀 Continua a invitare amici per scalare la classifica!';

        return message;
    }

    start() {
        console.log(`🤖 Bot ${this.BOT_USERNAME} avviato con successo!`);
        console.log(`📝 Modalità: ${process.env.NODE_ENV || 'production'}`);
        console.log(`📱 Channel ID: ${this.CHANNEL_ID}`);
        console.log(`📱 Channel Username: ${this.CHANNEL_USERNAME}`);

        // Log per debug degli ID canale
        this.bot.on('message', (msg) => {
            if (msg.chat && msg.chat.type === 'channel') {
                console.log('ID del canale rilevato:', msg.chat.id);
                console.log('Username del canale:', msg.chat.username);
            }
        });
    }
}

// Avvio del bot
const referralBot = new ReferralBot();
referralBot.start();

// Gestione graceful shutdown
process.once('SIGINT', () => {
    console.log('\n🛑 Spegnimento bot in corso...');
    referralBot.bot.stopPolling();
    process.exit(0);
});

process.once('SIGTERM', () => {
    console.log('\n🛑 Spegnimento bot in corso...');
    referralBot.bot.stopPolling();
    process.exit(0);
});

