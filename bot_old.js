require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const supabase = require('./supabaseClient');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const BOT_USERNAME = 'loSbloccatore_bot'; 

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();

    const userIdentifier = msg.from.username || `user_${telegramId}`;
    const displayName = msg.from.first_name || msg.from.username || `User ${telegramId}`;

    const referrerCode = match && match[1] ? match[1].trim() : null;

    console.log('=== DEBUG INFO ===');
    console.log('Messaggio completo:', msg.text);
    console.log('Match array:', match);
    console.log('From object:', JSON.stringify(msg.from, null, 2));
    console.log(`User Identifier: ${userIdentifier}`);
    console.log(`Display Name: ${displayName}`);
    console.log(`Telegram ID: ${telegramId}`);
    console.log(`Referrer Code estratto: "${referrerCode}"`);
    console.log('==================');

    try {
        // Verifica se già registrato
        const { data: existingUser, error: selectError } = await supabase
            .from('referrals')
            .select('*')
            .eq('telegram_id', telegramId)
            .maybeSingle();

        if (selectError) {
            console.error('Errore nella selezione:', selectError);
            return bot.sendMessage(chatId, 'Errore interno. Riprova più tardi.');
        }

        // Se nuovo utente, registralo
        if (!existingUser) {
            const newUserData = {
                telegram_id: telegramId,
                username: userIdentifier,
                referrer_code: referrerCode
            };

            console.log('Dati da inserire nel database:', newUserData);

            const { data: newUser, error: insertError } = await supabase
                .from('referrals')
                .insert([newUserData])
                .select()
                .single();

            if (insertError) {
                console.error('Errore nell\'inserimento:', insertError);
                return bot.sendMessage(chatId, 'Errore nel salvataggio. Riprova più tardi.');
            }

            console.log('Nuovo utente salvato nel database:', newUser);
            if (referrerCode) {
                const success = await incrementReferrerCount(referrerCode);
                if (success) {
                    await notifyReferrer(referrerCode, displayName);
                }
            }

            const welcomeMessage = `🎉 Benvenuto ${displayName}!${referrerCode ? `\n✅ Hai usato il codice referral: ${referrerCode}` : ''
                }`;

            bot.sendMessage(chatId, welcomeMessage);
        } else {
            bot.sendMessage(chatId, `👋 Bentornato ${displayName}!`);
        }

        const myReferralLink = `https://t.me/${BOT_USERNAME}?start=${userIdentifier}`;
        bot.sendMessage(chatId, `🔗 Il tuo link referral:\n${myReferralLink}`);

    } catch (error) {
        console.error('Errore generale:', error);
        bot.sendMessage(chatId, 'Si è verificato un errore. Riprova più tardi.');
    }
});


async function incrementReferrerCount(referrerUsername) {
    try {
        console.log(`Cercando referrer con username: "${referrerUsername}"`);

        // Prima verifica se il referrer esiste
        const { data: referrer, error: selectError } = await supabase
            .from('referrals')
            .select('*')
            .eq('username', referrerUsername)
            .maybeSingle();

        if (selectError) {
            console.error('Errore nella ricerca del referrer:', selectError);
            return false;
        }

        console.log('Referrer trovato:', referrer);

        if (referrer) {
            // Incrementa il contatore
            const { error: updateError } = await supabase
                .from('referrals')
                .update({
                    referral_count: (referrer.referral_count || 0) + 1
                })
                .eq('username', referrerUsername);

            if (updateError) {
                console.error('Errore nell\'aggiornamento del contatore:', updateError);
                return false;
            } else {
                console.log(`✅ Incrementato contatore per ${referrerUsername}: ${(referrer.referral_count || 0) + 1}`);
                return true;
            }
        } else {
            console.log('❌ Referrer non trovato:', referrerUsername);
            return false;
        }
    } catch (error) {
        console.error('Errore nella funzione incrementReferrerCount:', error);
        return false;
    }
}

async function notifyReferrer(referrerUsername, newUserName) {
    try {
        const { data: referrer, error } = await supabase
            .from('referrals')
            .select('telegram_id, referral_count')
            .eq('username', referrerUsername)
            .single();

        if (!error && referrer) {
            const message = `🎉 Congratulazioni! 
👤 ${newUserName} si è iscritto usando il tuo link referral!
📊 Totale tuoi referral: ${referrer.referral_count}`;

            bot.sendMessage(referrer.telegram_id, message);
            console.log(`Notifica inviata a ${referrerUsername}`);
        }
    } catch (error) {
        console.error('Errore nell\'invio notifica al referrer:', error);
    }
}

// Comando per vedere le proprie statistiche referral
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();

    try {
        const { data: user, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (error || !user) {
            return bot.sendMessage(chatId, 'Utente non trovato. Usa /start per registrarti.');
        }

        const referralCount = user.referral_count || 0;
        const message = `📊 Le tue statistiche:
👤 Username: ${user.username}
👥 Referral invitati: ${referralCount}
📅 Registrato: ${new Date(user.created_at).toLocaleDateString('it-IT')}

🔗 Il tuo link: https://t.me/${BOT_USERNAME}?start=${user.username}`;

        bot.sendMessage(chatId, message);
    } catch (error) {
        console.error('Errore nel recupero statistiche:', error);
        bot.sendMessage(chatId, 'Errore nel recupero delle statistiche.');
    }
});

console.log('Bot avviato...');