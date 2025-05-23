// userVerification.js
const supabase = require('./supabaseClient');

class UserVerificationSystem {
    constructor() {
        this.suspiciousPatterns = {
            // Pattern per usernames sospetti
            usernames: [
                /^user\d+$/i,
                /^bot\d+$/i,
                /^test\d+$/i,
                /^fake\d+$/i,
                /^spam\d+$/i,
                /^\d+$/,
                /^[a-z]{1,3}\d{4,}$/i,
                /^(telegram|channel|group)\d+$/i
            ],

            // Pattern per nomi sospetti
            names: [
                /^[a-z]+\d{3,}$/i,
                /^user$/i,
                /^bot$/i,
                /^test$/i,
                /^\d+$/,
                /^[^\w\s]+$/
            ]
        };

        this.riskFactors = {
            HIGH_RISK: 80,
            MEDIUM_RISK: 50,
            LOW_RISK: 20
        };
    }

    // Funzione principale per verificare l'autenticità dell'utente
    async verifyUserAuthenticity(userInfo, telegramUserData) {
        const verificationResults = {
            isAuthentic: true,
            riskScore: 0,
            flags: [],
            details: {
                accountAge: null,
                profileCompleteness: 0,
                activityPattern: 'unknown',
                socialVerification: false
            },
            action: 'allow' // allow, warn, block, manual_review
        };

        try {
            // 1. Verifica base dei dati Telegram
            const basicCheck = this.performBasicChecks(telegramUserData);
            verificationResults.riskScore += basicCheck.riskScore;
            verificationResults.flags.push(...basicCheck.flags);

            // 2. Verifica età dell'account
            const ageCheck = await this.checkAccountAge(telegramUserData.id);
            verificationResults.details.accountAge = ageCheck.age;
            verificationResults.riskScore += ageCheck.riskScore;
            verificationResults.flags.push(...ageCheck.flags);

            // 3. Verifica completezza profilo
            const profileCheck = this.checkProfileCompleteness(telegramUserData);
            verificationResults.details.profileCompleteness = profileCheck.completeness;
            verificationResults.riskScore += profileCheck.riskScore;
            verificationResults.flags.push(...profileCheck.flags);

            // 4. Verifica pattern comportamentali
            const behaviorCheck = await this.checkBehaviorPatterns(userInfo.telegramId);
            verificationResults.details.activityPattern = behaviorCheck.pattern;
            verificationResults.riskScore += behaviorCheck.riskScore;
            verificationResults.flags.push(...behaviorCheck.flags);

            // 5. Verifica blacklist
            const blacklistCheck = await this.checkBlacklist(userInfo.telegramId);
            verificationResults.riskScore += blacklistCheck.riskScore;
            verificationResults.flags.push(...blacklistCheck.flags);

            // Determina l'azione finale
            verificationResults.action = this.determineAction(verificationResults.riskScore);
            verificationResults.isAuthentic = verificationResults.action !== 'block';

            // Salva i risultati della verifica
            await this.saveVerificationResults(userInfo.telegramId, verificationResults);

            return verificationResults;

        } catch (error) {
            console.error('Errore durante la verifica utente:', error);
            return {
                isAuthentic: false,
                riskScore: 100,
                flags: ['verification_error'],
                action: 'manual_review'
            };
        }
    }

    // Controlli base sui dati Telegram
    performBasicChecks(telegramUserData) {
        const result = { riskScore: 0, flags: [] };

        // Verifica username
        if (!telegramUserData.username) {
            result.riskScore += 15;
            result.flags.push('no_username');
        } else {
            // Controlla pattern sospetti nell'username
            for (const pattern of this.suspiciousPatterns.usernames) {
                if (pattern.test(telegramUserData.username)) {
                    result.riskScore += 25;
                    result.flags.push('suspicious_username_pattern');
                    break;
                }
            }
        }

        // Verifica nome
        if (!telegramUserData.first_name) {
            result.riskScore += 20;
            result.flags.push('no_first_name');
        } else {
            // Controlla pattern sospetti nel nome
            for (const pattern of this.suspiciousPatterns.names) {
                if (pattern.test(telegramUserData.first_name)) {
                    result.riskScore += 20;
                    result.flags.push('suspicious_name_pattern');
                    break;
                }
            }
        }

        // Verifica se è un bot
        if (telegramUserData.is_bot) {
            result.riskScore += 100;
            result.flags.push('is_bot');
        }

        // Verifica presenza foto profilo
        if (!telegramUserData.has_photo) {
            result.riskScore += 10;
            result.flags.push('no_profile_photo');
        }

        return result;
    }

    // Stima dell'età dell'account basata sull'ID Telegram
    async checkAccountAge(telegramId) {
        const result = { age: null, riskScore: 0, flags: [] };

        try {
            // Gli ID Telegram più bassi = account più vecchi
            const idNumber = parseInt(telegramId);

            // Stima approssimativa basata sui range di ID conosciuti
            let estimatedAge;
            if (idNumber < 100000000) {
                estimatedAge = 'very_old'; // Probabilmente 2013-2015
            } else if (idNumber < 500000000) {
                estimatedAge = 'old'; // Probabilmente 2015-2017
            } else if (idNumber < 1000000000) {
                estimatedAge = 'medium'; // Probabilmente 2017-2019
            } else if (idNumber < 1500000000) {
                estimatedAge = 'recent'; // Probabilmente 2019-2021
            } else {
                estimatedAge = 'very_recent'; // Probabilmente 2021+
            }

            result.age = estimatedAge;

            // Assegna punteggio di rischio
            switch (estimatedAge) {
                case 'very_recent':
                    result.riskScore += 25;
                    result.flags.push('very_new_account');
                    break;
                case 'recent':
                    result.riskScore += 15;
                    result.flags.push('new_account');
                    break;
                case 'medium':
                    result.riskScore += 5;
                    break;
                case 'old':
                case 'very_old':
                    result.riskScore -= 5; // Bonus per account vecchi
                    result.flags.push('established_account');
                    break;
            }

        } catch (error) {
            result.riskScore += 10;
            result.flags.push('age_check_failed');
        }

        return result;
    }

    // Verifica completezza del profilo
    checkProfileCompleteness(telegramUserData) {
        let completeness = 0;
        const result = { completeness: 0, riskScore: 0, flags: [] };

        // Controlli per completezza profilo
        if (telegramUserData.username) completeness += 25;
        if (telegramUserData.first_name) completeness += 25;
        if (telegramUserData.last_name) completeness += 15;
        if (telegramUserData.has_photo) completeness += 20;
        if (telegramUserData.language_code) completeness += 15;

        result.completeness = completeness;

        // Assegna punteggio di rischio basato sulla completezza
        if (completeness < 30) {
            result.riskScore += 30;
            result.flags.push('very_incomplete_profile');
        } else if (completeness < 50) {
            result.riskScore += 20;
            result.flags.push('incomplete_profile');
        } else if (completeness < 70) {
            result.riskScore += 10;
            result.flags.push('partially_complete_profile');
        } else {
            result.flags.push('complete_profile');
        }

        return result;
    }

    // Verifica pattern comportamentali
    async checkBehaviorPatterns(telegramId) {
        const result = { pattern: 'unknown', riskScore: 0, flags: [] };

        try {
            // Controlla se l'utente ha già fatto registrazioni multiple
            const existingRecords = await this.checkMultipleRegistrations(telegramId);
            if (existingRecords > 1) {
                result.riskScore += 40;
                result.flags.push('multiple_registrations');
            }

            // Controlla velocità di registrazione (se molti utenti si registrano velocemente)
            const recentRegistrations = await this.checkRecentRegistrationBurst();
            if (recentRegistrations > 10) {
                result.riskScore += 15;
                result.flags.push('registration_burst_detected');
            }

            // Controlla pattern di referral sospetti
            const referralPattern = await this.checkSuspiciousReferralPattern(telegramId);
            if (referralPattern.isSuspicious) {
                result.riskScore += referralPattern.riskScore;
                result.flags.push(...referralPattern.flags);
            }

        } catch (error) {
            console.error('Errore nel controllo pattern comportamentali:', error);
            result.riskScore += 5;
            result.flags.push('behavior_check_failed');
        }

        return result;
    }

    // Verifica blacklist
    async checkBlacklist(telegramId) {
        const result = { riskScore: 0, flags: [] };

        try {
            const { data: blacklistEntry } = await supabase
                .from('user_blacklist')
                .select('*')
                .eq('telegram_id', telegramId)
                .maybeSingle();

            if (blacklistEntry) {
                result.riskScore += 100;
                result.flags.push('blacklisted_user');
            }

        } catch (error) {
            console.error('Errore controllo blacklist:', error);
        }

        return result;
    }

    // Controlli ausiliari
    async checkMultipleRegistrations(telegramId) {
        try {
            const { count } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('telegram_id', telegramId);

            return count || 0;
        } catch (error) {
            return 0;
        }
    }

    async checkRecentRegistrationBurst() {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

            const { count } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', oneHourAgo);

            return count || 0;
        } catch (error) {
            return 0;
        }
    }

    async checkSuspiciousReferralPattern(telegramId) {
        const result = { isSuspicious: false, riskScore: 0, flags: [] };

        try {
            // Controlla se l'utente ha fatto troppi referral in poco tempo
            const { data: user } = await supabase
                .from('referrals')
                .select('referral_count, created_at, last_referral_date')
                .eq('telegram_id', telegramId)
                .maybeSingle();

            if (user && user.referral_count > 0) {
                const accountAge = Date.now() - new Date(user.created_at).getTime();
                const hoursSinceCreation = accountAge / (1000 * 60 * 60);

                // Se ha fatto più di 5 referral nelle prime 24 ore
                if (hoursSinceCreation < 24 && user.referral_count > 5) {
                    result.isSuspicious = true;
                    result.riskScore += 30;
                    result.flags.push('suspicious_referral_speed');
                }

                // Se ha fatto più di 20 referral nelle prime 72 ore
                if (hoursSinceCreation < 72 && user.referral_count > 20) {
                    result.isSuspicious = true;
                    result.riskScore += 50;
                    result.flags.push('excessive_referral_activity');
                }
            }

        } catch (error) {
            console.error('Errore controllo pattern referral:', error);
        }

        return result;
    }

    // Determina l'azione basata sul punteggio di rischio
    determineAction(riskScore) {
        if (riskScore >= this.riskFactors.HIGH_RISK) {
            return 'block';
        } else if (riskScore >= this.riskFactors.MEDIUM_RISK) {
            return 'manual_review';
        } else if (riskScore >= this.riskFactors.LOW_RISK) {
            return 'warn';
        } else {
            return 'allow';
        }
    }

    // Salva i risultati della verifica
    async saveVerificationResults(telegramId, results) {
        try {
            await supabase
                .from('user_verifications')
                .upsert({
                    telegram_id: telegramId,
                    risk_score: results.riskScore,
                    flags: results.flags,
                    action: results.action,
                    verified_at: new Date().toISOString(),
                    details: results.details
                });

        } catch (error) {
            console.error('Errore salvataggio risultati verifica:', error);
        }
    }

    // Funzioni per la gestione della blacklist
    async addToBlacklist(telegramId, reason, adminId = null) {
        try {
            await supabase
                .from('user_blacklist')
                .insert({
                    telegram_id: telegramId,
                    reason: reason,
                    added_by: adminId,
                    added_at: new Date().toISOString()
                });

            console.log(`✅ Utente ${telegramId} aggiunto alla blacklist: ${reason}`);
            return true;
        } catch (error) {
            console.error('Errore aggiunta blacklist:', error);
            return false;
        }
    }

    async removeFromBlacklist(telegramId, adminId = null) {
        try {
            await supabase
                .from('user_blacklist')
                .delete()
                .eq('telegram_id', telegramId);

            console.log(`✅ Utente ${telegramId} rimosso dalla blacklist`);
            return true;
        } catch (error) {
            console.error('Errore rimozione blacklist:', error);
            return false;
        }
    }

    // Verifica se un utente è bloccato
    async isUserBlocked(telegramId) {
        try {
            const { data } = await supabase
                .from('user_blacklist')
                .select('*')
                .eq('telegram_id', telegramId)
                .maybeSingle();

            return !!data;
        } catch (error) {
            console.error('Errore controllo blocco utente:', error);
            return false;
        }
    }

    // Statistiche per gli admin
    async getVerificationStats() {
        try {
            const { data: stats } = await supabase
                .from('user_verifications')
                .select('action, risk_score')
                .gte('verified_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            const summary = {
                total: stats?.length || 0,
                blocked: stats?.filter(s => s.action === 'block').length || 0,
                flagged: stats?.filter(s => s.action === 'manual_review').length || 0,
                warned: stats?.filter(s => s.action === 'warn').length || 0,
                allowed: stats?.filter(s => s.action === 'allow').length || 0,
                averageRiskScore: stats?.length ?
                    (stats.reduce((sum, s) => sum + s.risk_score, 0) / stats.length).toFixed(2) : 0
            };

            return summary;
        } catch (error) {
            console.error('Errore statistiche verifica:', error);
            return null;
        }
    }
}

module.exports = UserVerificationSystem;