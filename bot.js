const TelegramBot = require('node-telegram-bot-api');
const supabase = require('./supabaseClient');
const config = require('./config/botConfig');

class ReferralBot {
    constructor() {
        this.bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
        this.BOT_USERNAME = process.env.BOT_USERNAME || 'loSbloccatore_bot';
        this.CHANNEL_ID = process.env.CHANNEL_ID;
        this.CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;
        this.CHANNEL_NAME = process.env.CHANNEL_NAME;

        // Configurazioni da botConfig.js
        this.AUTO_CHECK_INTERVAL = config.SETTINGS.AUTO_CHECK_INTERVAL;
        this.verificationQueue = new Set();

        this.initializeHandlers();
        this.setupErrorHandling();
        this.startAutoVerification();
    }

    initializeHandlers() {
        // Handler per il comando /start
        this.bot.onText(config.PATTERNS.START_COMMAND, this.handleStart.bind(this));

        // Handler per il comando /stats
        this.bot.onText(config.PATTERNS.STATS_COMMAND, this.handleStats.bind(this));

        // Handler per il comando /help
        this.bot.onText(config.PATTERNS.HELP_COMMAND, this.handleHelp.bind(this));

        // Handler per il comando /leaderboard
        this.bot.onText(config.PATTERNS.LEADERBOARD_COMMAND, this.handleLeaderboard.bind(this));

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

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }

    // Sistema di verifica automatica
    startAutoVerification() {
        console.log('🔄 Sistema di verifica automatica avviato');

        this.performAutoVerification();

        setInterval(() => {
            this.performAutoVerification();
        }, this.AUTO_CHECK_INTERVAL);
    }

    async performAutoVerification() {
        try {
            const unverifiedUsers = await this.getUnverifiedUsers();

            if (unverifiedUsers.length === 0) {
                return;
            }

            if (config.SETTINGS.DEBUG_MODE) {
                console.log(`🔍 Verificando ${unverifiedUsers.length} utenti non verificati...`);
            }

            for (const user of unverifiedUsers) {
                if (this.verificationQueue.has(user.telegram_id)) {
                    continue;
                }

                this.verificationQueue.add(user.telegram_id);

                try {
                    const isSubscribed = await this.checkChannelMembership(user.telegram_id);

                    if (isSubscribed) {
                        console.log(`✅ Utente ${user.telegram_id} trovato nel canale - verificando...`);

                        await this.verifyChannelMembership(user.telegram_id);

                        // Assegna il punto al referrer se presente
                        if (user.referrer_code && user.referrer_code !== user.telegram_id) {
                            try {
                                const referrer = await this.incrementReferralCount(user.referrer_code);
                                if (referrer) {
                                    await this.notifyReferrer(referrer, user.username);
                                }
                            } catch (error) {
                                console.error('Errore nel processo referral:', error);
                            }
                        }

                        await this.notifyAutoVerification(user);
                    }
                } catch (error) {
                    console.error(`Errore nella verifica automatica per ${user.telegram_id}:`, error);
                } finally {
                    this.verificationQueue.delete(user.telegram_id);
                }

                await this.sleep(config.SETTINGS.VERIFICATION_DELAY);
            }
        } catch (error) {
            console.error('Errore nella verifica automatica:', error);
        }
    }

    async getUnverifiedUsers() {
        const { data, error } = await supabase
            .from('referrals')
            .select('telegram_id, username, referrer_code, created_at')
            .eq('channel_verified', false)
            .gte('created_at', new Date(Date.now() - config.SETTINGS.MAX_VERIFICATION_AGE).toISOString());

        if (error) {
            throw new Error(`Errore nel recupero utenti non verificati: ${error.message}`);
        }

        return data || [];
    }

    async notifyAutoVerification(user) {
        try {
            const hasReferrer = user.referrer_code && user.referrer_code !== user.telegram_id;
            const message = config.MESSAGES.AUTO_VERIFICATION_SUCCESS(hasReferrer);

            await this.bot.sendMessage(user.telegram_id, message, { parse_mode: 'HTML' });
            console.log(`✅ Notifica verifica automatica inviata a ${user.telegram_id}`);
        } catch (error) {
            console.log(`Non è stato possibile notificare l'utente ${user.telegram_id}:`, error.message);
        }
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
            await this.sendMessage(chatId, config.MESSAGES.ERROR_GENERIC);
        }
    }

    async handleStats(msg) {
        const chatId = msg.chat.id;
        const telegramId = msg.from.id.toString();

        try {
            const user = await this.findUserByTelegramId(telegramId);

            if (!user) {
                return this.sendMessage(chatId, config.MESSAGES.USER_NOT_FOUND);
            }

            const statsMessage = config.FORMATTERS.STATS_MESSAGE(user, this.BOT_USERNAME);
            await this.sendMessage(chatId, statsMessage);

        } catch (error) {
            console.error('Errore in handleStats:', error);
            await this.sendMessage(chatId, config.MESSAGES.ERROR_STATS);
        }
    }

    async handleHelp(msg) {
        const chatId = msg.chat.id;
        await this.sendMessage(chatId, config.MESSAGES.HELP_MESSAGE);
    }

    async handleLeaderboard(msg) {
        const chatId = msg.chat.id;

        try {
            const topUsers = await this.getTopReferrers(config.SETTINGS.LEADERBOARD_LIMIT);
            const leaderboardMessage = config.FORMATTERS.LEADERBOARD_MESSAGE(topUsers);
            await this.sendMessage(chatId, leaderboardMessage);

        } catch (error) {
            console.error('Errore in handleLeaderboard:', error);
            await this.sendMessage(chatId, config.MESSAGES.ERROR_LEADERBOARD);
        }
    }

    async handleNewChannelMember(msg) {
        console.log('Nuovo membro nel canale, chat ID:', msg.chat.id);

        const chatId = msg.chat.id.toString();
        const targetChannelId = this.CHANNEL_ID.toString();

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
                        await this.notifyAutoVerification(user);
                    }
                } catch (error) {
                    console.error('Errore nel processare nuovo membro:', error);
                }
            }
        }
    }

    async handleUnknownMessage(msg) {
        if (msg.chat.type === 'channel') {
            return;
        }

        if (msg.text && msg.text.startsWith('/')) {
            const command = msg.text.split(' ')[0];
            const knownCommands = ['/start', '/stats', '/help', '/leaderboard'];

            if (!knownCommands.includes(command)) {
                await this.sendMessage(msg.chat.id, config.MESSAGES.UNKNOWN_COMMAND);
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
        if (config.SETTINGS.DEBUG_MODE) {
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

            if (config.SETTINGS.DEBUG_MODE) {
                console.log('Verificando iscrizione per utente:', telegramId);
                console.log('Channel ID configurato:', chatId);
            }

            if (!chatId) {
                console.error('CHANNEL_ID non configurato nel file .env');
                return false;
            }

            if (chatId.startsWith('@')) {
                try {
                    const chat = await this.bot.getChat(chatId);
                    chatId = chat.id.toString();
                } catch (error) {
                    console.error('Impossibile ottenere info del canale con username:', error.message);
                    return false;
                }
            }

            const member = await this.bot.getChatMember(chatId, telegramId);
            const validStatuses = ['member', 'administrator', 'creator'];
            const isValid = validStatuses.includes(member.status);

            if (config.SETTINGS.DEBUG_MODE) {
                console.log('Status membro:', member.status);
                console.log('Iscrizione valida:', isValid);
            }

            return isValid;

        } catch (error) {
            console.error(`Errore durante la verifica dell'iscrizione al canale:`, error.message);
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
            .select(config.QUERIES.FIND_USER)
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
            .select(config.QUERIES.TOP_REFERRERS)
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
            await this.sendMessage(chatId, config.MESSAGES.SELF_REFERRAL_WARNING);
        }

        const welcomeMessage = config.MESSAGES.WELCOME_NEW_USER(
            user.displayName,
            referrerCode,
            referrerCode === user.telegramId
        );

        await this.sendMessage(chatId, welcomeMessage);
        await this.sendChannelInstructions(chatId, !!referrerCode && referrerCode !== user.telegramId);
    }

    async sendChannelInstructions(chatId, hasReferrer) {
        const channelLink = this.CHANNEL_USERNAME || this.CHANNEL_NAME || 'il nostro canale';
        const message = config.MESSAGES.CHANNEL_INSTRUCTIONS(channelLink, hasReferrer);
        await this.sendMessage(chatId, message);
    }

    async handleReturningUser(user, chatId) {
        const message = config.MESSAGES.WELCOME_RETURNING_USER(user.displayName);
        await this.sendMessage(chatId, message);
    }

    async notifyReferrer(referrer, newUserName) {
        try {
            const message = config.MESSAGES.REFERRAL_NOTIFICATION(newUserName, referrer.referral_count + 1);
            await this.sendMessage(referrer.telegram_id, message);
            console.log(`✅ Notifica inviata a ${referrer.telegram_id}`);
        } catch (error) {
            console.error('Errore nell\'invio notifica al referrer:', error);
        }
    }

    async sendReferralLink(chatId, telegramId) {
        const referralLink = `https://t.me/${this.BOT_USERNAME}?start=${telegramId}`;
        const message = config.MESSAGES.REFERRAL_LINK(referralLink);
        await this.sendMessage(chatId, message);
    }

    // Wrapper per l'invio messaggi con parse_mode automatico
    async sendMessage(chatId, message, options = {}) {
        const defaultOptions = { parse_mode: 'HTML', ...options };
        return this.bot.sendMessage(chatId, message, defaultOptions);
    }

    // Utility per sleep
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    start() {
        console.log(`🤖 Bot ${this.BOT_USERNAME} avviato con successo!`);
        console.log(`📝 Modalità: ${process.env.NODE_ENV || 'production'}`);
        console.log(`📱 Channel ID: ${this.CHANNEL_ID}`);
        console.log(`📱 Channel Username: ${this.CHANNEL_USERNAME}`);
        console.log(`🔄 Verifica automatica ogni ${this.AUTO_CHECK_INTERVAL / 1000} secondi`);

        // Log per debug degli ID canale
        this.bot.on('message', (msg) => {
            if (msg.chat && msg.chat.type === 'channel' && config.SETTINGS.DEBUG_MODE) {
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