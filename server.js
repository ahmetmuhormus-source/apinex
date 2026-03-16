const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '';
const configPath = path.join(__dirname, 'apinex-config.json');
const PRODUCT_HUNT_API_URL = 'https://api.producthunt.com/v2/api/graphql';
const PRODUCT_HUNT_TOKEN = process.env.PRODUCT_HUNT_DEVELOPER_TOKEN;

let apinexConfig;

try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    apinexConfig = JSON.parse(configFile);
    console.log(`APINEX config yüklendi: ${apinexConfig.project.name}`);
} catch (error) {
    console.error('APINEX config dosyası okunamadı. Lütfen `apinex-config.json` dosyasını kontrol et.');
    console.error(`Hata detayı: ${error.message}`);
    process.exit(1);
}

function getApiTimestamp() {
    return new Date().toISOString();
}

function getRequestResultLabel(statusCode) {
    if (statusCode >= 500) {
        return 'sunucu_hatasi';
    }

    if (statusCode >= 400) {
        return 'istemci_hatasi';
    }

    return 'basarili';
}

function logApiRequest(req, res, startedAt) {
    const elapsedMs = Date.now() - startedAt;
    const resultLabel = getRequestResultLabel(res.statusCode);

    console.log(
        `[APINEX API] ${req.method} ${req.originalUrl} status=${res.statusCode} sonuc=${resultLabel} sure_ms=${elapsedMs}`
    );
}

function getAllowedOrigins() {
    return CLIENT_ORIGIN
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

function buildCorsOptions() {
    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins.length === 0) {
        return { origin: true };
    }

    return {
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('CORS izni verilmeyen origin.'), false);
        }
    };
}

// Stinger (Güvenlik) ve Nectar API Hazırlığı
app.use(cors(buildCorsOptions()));
app.use((req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
        logApiRequest(req, res, startedAt);
    });

    next();
});
app.use(express.json());

function buildApiErrorPayload({ servis, kod, mesaj, detaylar = [], ornekGovde = null }) {
    const payload = {
        durum: 'Hata',
        servis,
        hata: {
            kod,
            mesaj
        },
        zaman_damgasi: getApiTimestamp()
    };

    if (detaylar.length > 0) {
        payload.hata.detaylar = detaylar;
    }

    if (ornekGovde) {
        payload.ornek_govde = ornekGovde;
    }

    return payload;
}

function buildApiSuccessPayload({ servis, durum = 'Aktif', veri }) {
    return {
        durum,
        servis,
        zaman_damgasi: getApiTimestamp(),
        veri
    };
}

function sendApiError(res, { statusCode, servis, kod, mesaj, detaylar = [], ornekGovde = null }) {
    return res.status(statusCode).json(
        buildApiErrorPayload({ servis, kod, mesaj, detaylar, ornekGovde })
    );
}

function buildReviewAnalyzeExamplePayload() {
    return {
        product: 'Drift',
        reviews: [
            {
                source: 'G2',
                rating: 2,
                title: 'Powerful but expensive',
                body: 'The platform is powerful but pricing is too expensive and setup is confusing.'
            }
        ]
    };
}

function validateReviewAnalyzePayload(payload) {
    const validationErrors = [];

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        validationErrors.push({
            alan: 'body',
            mesaj: 'Istek govdesi gecerli bir JSON nesnesi olmalidir.'
        });

        return validationErrors;
    }

    if (!Array.isArray(payload.reviews)) {
        validationErrors.push({
            alan: 'reviews',
            mesaj: '`reviews` alani bir dizi olmalidir.'
        });

        return validationErrors;
    }

    if (payload.reviews.length === 0) {
        validationErrors.push({
            alan: 'reviews',
            mesaj: '`reviews` dizisi bos olamaz.'
        });
    }

    payload.reviews.forEach((review, index) => {
        if (!review || typeof review !== 'object' || Array.isArray(review)) {
            validationErrors.push({
                alan: `reviews[${index}]`,
                mesaj: 'Her yorum bir JSON nesnesi olmalidir.'
            });
            return;
        }

        const body = String(review.body || review.metin || review.yorum || '').trim();
        const title = String(review.title || review.baslik || '').trim();
        const rawRating = review.rating ?? review.puan;

        if (!body && !title) {
            validationErrors.push({
                alan: `reviews[${index}]`,
                mesaj: 'Her yorumda en azindan `body` veya `title` alani dolu olmalidir.'
            });
        }

        if (rawRating !== undefined && rawRating !== null && Number.isNaN(Number(rawRating))) {
            validationErrors.push({
                alan: `reviews[${index}].rating`,
                mesaj: '`rating` sayisal bir deger olmalidir.'
            });
        }
    });

    return validationErrors;
}

function getScoutBeeStatus() {
    return PRODUCT_HUNT_TOKEN ? 'Aktif' : 'Hazir ama token bekliyor';
}

function getScoreFromBands(value, bands) {
    const matchedBand = bands.find((band) => value >= band.min);
    return matchedBand ? matchedBand.score : 0;
}

function getDecisionLabel(score, decisionBands) {
    const matchedBand = decisionBands.find((band) => score >= band.min);
    return matchedBand ? matchedBand.label : 'ele';
}

function normalizeReviewText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeReviewSource(source) {
    const config = apinexConfig.review_analysis_engine;
    const supportedSource = config.supported_sources.find(
        (supported) => supported.toLowerCase() === String(source || '').toLowerCase()
    );

    return supportedSource || 'Bilinmeyen';
}

function normalizeReview(rawReview, index) {
    const title = String(rawReview.title || rawReview.baslik || '').trim();
    const body = String(rawReview.body || rawReview.metin || rawReview.yorum || '').trim();
    const rating = Number(rawReview.rating || rawReview.puan || 0);
    const source = normalizeReviewSource(rawReview.source || rawReview.kaynak);

    return {
        id: rawReview.id || `yorum_${index + 1}`,
        source,
        title,
        body,
        rating: Number.isNaN(rating) ? 0 : rating,
        date: rawReview.date || rawReview.tarih || null,
        reviewer_type: rawReview.reviewer_type || rawReview.kullanici_tipi || null,
        normalized_text: normalizeReviewText(`${title} ${body}`)
    };
}

function getReviewIdentityKey(review) {
    return `${review.source}::${review.title}::${review.body}`;
}

function getReviewWordCount(text) {
    return String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;
}

function isNegativeReview(review) {
    const config = apinexConfig.review_analysis_engine;
    return review.rating > 0 && review.rating <= config.negative_rating_threshold
        || config.negative_signal_keywords.some((keyword) => review.normalized_text.includes(keyword));
}

function classifyReviewForPipeline(review) {
    const config = apinexConfig.review_analysis_engine;
    const quarantineRules = config.quarantine_rules || {};
    const reasonCodes = quarantineRules.reason_codes || {};
    const wordCount = getReviewWordCount(review.body);

    if (review.body.length >= config.minimum_review_body_length) {
        return {
            bucket: 'main',
            wordCount,
            reasons: []
        };
    }

    if (review.body.length < (quarantineRules.minimum_body_length || 0) || wordCount < (quarantineRules.minimum_word_count || 0)) {
        return {
            bucket: 'drop',
            wordCount,
            reasons: []
        };
    }

    const matchedNegativeKeywords = config.negative_signal_keywords.filter(
        (keyword) => review.normalized_text.includes(keyword)
    );
    const matchedEmotionKeywords = (quarantineRules.emotion_signal_keywords || []).filter(
        (keyword) => review.normalized_text.includes(keyword)
    );
    const reasons = [];

    if (review.rating > 0 && review.rating <= config.negative_rating_threshold) {
        reasons.push({
            kod: 'short_negative_rating',
            aciklama: reasonCodes.short_negative_rating || 'Negatif puan sinyali var.'
        });
    }

    if (matchedNegativeKeywords.length > 0) {
        reasons.push({
            kod: 'negative_keyword_signal',
            aciklama: reasonCodes.negative_keyword_signal || 'Negatif anahtar kelime sinyali var.',
            eslesen_anahtar_kelimeler: matchedNegativeKeywords
        });
    }

    if (matchedEmotionKeywords.length > 0) {
        reasons.push({
            kod: 'strong_emotion_signal',
            aciklama: reasonCodes.strong_emotion_signal || 'Guclu duygu sinyali var.',
            eslesen_anahtar_kelimeler: matchedEmotionKeywords
        });
    }

    return {
        bucket: reasons.length > 0 ? 'quarantine' : 'drop',
        wordCount,
        reasons
    };
}

function buildQuarantineEntry(review, decision) {
    return {
        id: review.id,
        kaynak: review.source,
        puan: review.rating,
        baslik: review.title || null,
        alinti: review.body,
        karakter_sayisi: review.body.length,
        kelime_sayisi: decision.wordCount,
        inceleme_durumu: 'ikincil_inceleme_bekliyor',
        nedenler: decision.reasons
    };
}

function getMostFrequentItems(items, topCount) {
    const counts = new Map();

    items.forEach((item) => {
        counts.set(item, (counts.get(item) || 0) + 1);
    });

    return [...counts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, topCount)
        .map(([deger, tekrar]) => ({ deger, tekrar }));
}

function detectSecondaryEmotion(entry, rules) {
    const emotionTaxonomy = rules.emotion_taxonomy || {};
    const normalizedText = normalizeReviewText(`${entry.baslik || ''} ${entry.alinti || ''}`);
    let dominantEmotion = 'belirsiz';
    let dominantScore = 0;

    Object.entries(emotionTaxonomy).forEach(([emotion, keywords]) => {
        const matchCount = keywords.filter((keyword) => normalizedText.includes(keyword)).length;

        if (matchCount > dominantScore) {
            dominantEmotion = emotion;
            dominantScore = matchCount;
        }
    });

    return {
        duygu: dominantEmotion,
        skor: dominantScore
    };
}

function buildSecondaryReviewSummary(quarantinePool) {
    if (quarantinePool.length === 0) {
        return {
            durum: 'bos',
            mesaj: 'Karantina havuzunda ikincil inceleme gerektiren yorum bulunamadi.',
            baskin_duygu: 'yok',
            baskin_sinyal: 'yok',
            tekrar_eden_kisa_sikayet_desenleri: [],
            ana_rapora_not: 'Ek baglam bulunmuyor.'
        };
    }

    const rules = apinexConfig.review_analysis_engine.secondary_review_rules || {};
    const signalLabelMap = rules.signal_label_map || {};
    const thresholds = rules.escalation_thresholds || {};
    const signalLabels = [];
    const keywordMatches = [];
    const emotionMatches = quarantinePool.map((entry) => detectSecondaryEmotion(entry, rules));

    quarantinePool.forEach((entry) => {
        entry.nedenler.forEach((reason) => {
            signalLabels.push(signalLabelMap[reason.kod] || reason.kod);
            if (Array.isArray(reason.eslesen_anahtar_kelimeler)) {
                keywordMatches.push(...reason.eslesen_anahtar_kelimeler);
            }
        });
    });

    const topSignal = getMostFrequentItems(signalLabels, 1)[0];
    const topEmotion = getMostFrequentItems(
        emotionMatches.map((match) => match.duygu).filter((emotion) => emotion !== 'belirsiz'),
        1
    )[0];
    const repeatedPatterns = getMostFrequentItems(keywordMatches, 3);
    const highSignalCount = thresholds.high_signal_count || 2;
    const highQuarantineCount = thresholds.high_quarantine_count || 2;
    const shouldEscalate = quarantinePool.length >= highQuarantineCount
        || (topSignal && topSignal.tekrar >= highSignalCount);

    return {
        durum: 'aktif',
        karantina_kaynagi_sayisi: quarantinePool.length,
        baskin_duygu: topEmotion ? topEmotion.deger : 'belirsiz',
        baskin_sinyal: topSignal ? topSignal.deger : 'belirsiz',
        tekrar_eden_kisa_sikayet_desenleri: repeatedPatterns,
        ana_rapora_not: shouldEscalate
            ? 'Karantina havuzunda tekrar eden sinyaller var. Bu yorumlar ikinci prompt veya manuel inceleme hattina alinmali.'
            : 'Karantina havuzunda sinyal var ama henuz ana raporu etkileyecek yogunlukta degil.'
    };
}

function detectPainTags(review) {
    const taxonomy = apinexConfig.review_analysis_engine.pain_taxonomy;
    const matches = [];

    Object.entries(taxonomy).forEach(([tag, rule]) => {
        const matchedKeywords = rule.keywords.filter((keyword) => review.normalized_text.includes(keyword));
        if (matchedKeywords.length > 0) {
            matches.push({
                tag,
                label: rule.label,
                business_impact: rule.business_impact,
                matched_keywords: matchedKeywords
            });
        }
    });

    return matches;
}

function buildReviewEngineExecutiveSummary(report) {
    const strongestPain = report.baskin_aci_noktalari[0];

    if (!strongestPain) {
        return 'Yeterli negatif sinyal bulunamadi. Daha fazla yorum verisi gerekir.';
    }

    return `${report.urun} icin en guclu aci noktasi ${strongestPain.etiket}. ` +
        `${strongestPain.tekrar_sayisi} yorumda tekrar ediyor ve en cok ${strongestPain.kaynaklar.join(', ')} kaynaginda goruluyor. ` +
        `Bu durum bize su sinyali veriyor: ${strongestPain.is_etkisi}`;
}

function getOpportunityPriority(painPoint) {
    if (painPoint.siddet_skoru >= 8 || painPoint.tekrar_sayisi >= 4) {
        return 'yuksek';
    }

    if (painPoint.siddet_skoru >= 4 || painPoint.tekrar_sayisi >= 2) {
        return 'orta';
    }

    return 'dusuk';
}

function buildActionableOpportunities(report) {
    const opportunityTemplates = apinexConfig.review_analysis_engine.opportunity_templates || {};

    return report.baskin_aci_noktalari.map((painPoint) => {
        const template = opportunityTemplates[painPoint.tag] || {};

        return {
            tag: painPoint.tag,
            etiket: painPoint.etiket,
            firsat: template.firsat || `${painPoint.etiket} etrafinda daha guclu bir cozum konumlandirma boslugu var.`,
            deger_onerisi: template.deger_onerisi || `${painPoint.etiket} sorununu azaltan daha sade ve daha hizli bir deneyim sun.`,
            urun_hipotezi: template.urun_hipotezi || `${painPoint.etiket} sorununu dogrudan hedefleyen odakli bir modul veya alternatif urun dusunulebilir.`,
            oncelik_seviyesi: getOpportunityPriority(painPoint),
            oncelik_gerekcesi: template.oncelik_gerekcesi || painPoint.is_etkisi,
            dayanak_aci_noktasi: {
                tekrar_sayisi: painPoint.tekrar_sayisi,
                siddet_skoru: painPoint.siddet_skoru,
                kaynaklar: painPoint.kaynaklar
            }
        };
    });
}

function analyzeReviewEnginePayload(payload) {
    const config = apinexConfig.review_analysis_engine;
    const rawReviews = Array.isArray(payload.reviews) ? payload.reviews : [];

    const normalizedReviews = rawReviews.map(normalizeReview);
    const qualityReviews = [];
    const quarantinePool = [];
    let droppedReviewCount = 0;

    normalizedReviews.forEach((review) => {
        const classification = classifyReviewForPipeline(review);

        if (classification.bucket === 'main') {
            qualityReviews.push(review);
            return;
        }

        if (classification.bucket === 'quarantine') {
            quarantinePool.push(buildQuarantineEntry(review, classification));
            return;
        }

        droppedReviewCount += 1;
    });

    const uniqueMap = new Map();

    qualityReviews.forEach((review) => {
        const uniqueKey = getReviewIdentityKey(review);
        if (!uniqueMap.has(uniqueKey)) {
            uniqueMap.set(uniqueKey, review);
        }
    });

    const dedupedReviews = [...uniqueMap.values()];
    const negativeReviews = dedupedReviews.filter(isNegativeReview);
    const painClusters = {};

    negativeReviews.forEach((review) => {
        const sourceWeight = config.source_weights[review.source] || 0.5;
        const severityBase = review.rating > 0 ? Math.max(1, 6 - review.rating) : 1;
        const painTags = detectPainTags(review);

        painTags.forEach((painTag) => {
            if (!painClusters[painTag.tag]) {
                painClusters[painTag.tag] = {
                    etiket: painTag.label,
                    is_etkisi: painTag.business_impact,
                    tekrar_sayisi: 0,
                    siddet_skoru: 0,
                    kaynaklar: new Set(),
                    anahtar_kelimeler: new Set(),
                    ornek_yorumlar: []
                };
            }

            const cluster = painClusters[painTag.tag];
            cluster.tekrar_sayisi += 1;
            cluster.siddet_skoru += severityBase * sourceWeight;
            cluster.kaynaklar.add(review.source);
            painTag.matched_keywords.forEach((keyword) => cluster.anahtar_kelimeler.add(keyword));

            if (cluster.ornek_yorumlar.length < 3) {
                cluster.ornek_yorumlar.push({
                    kaynak: review.source,
                    puan: review.rating,
                    alinti: review.body
                });
            }
        });
    });

    const topPainPoints = Object.entries(painClusters)
        .map(([tag, cluster]) => ({
            tag,
            etiket: cluster.etiket,
            is_etkisi: cluster.is_etkisi,
            tekrar_sayisi: cluster.tekrar_sayisi,
            siddet_skoru: Number(cluster.siddet_skoru.toFixed(2)),
            kaynaklar: [...cluster.kaynaklar],
            anahtar_kelimeler: [...cluster.anahtar_kelimeler],
            ornek_yorumlar: cluster.ornek_yorumlar
        }))
        .sort((left, right) => right.siddet_skoru - left.siddet_skoru)
        .slice(0, 5);

    const supportedSourceCount = dedupedReviews.filter((review) => review.source !== 'Bilinmeyen').length;
    const bodyQualityRate = rawReviews.length === 0 ? 0 : qualityReviews.length / rawReviews.length;
    const duplicatePenalty = qualityReviews.length === 0 ? 0 : (qualityReviews.length - dedupedReviews.length) / qualityReviews.length;
    const supportedSourceRate = dedupedReviews.length === 0 ? 0 : supportedSourceCount / dedupedReviews.length;
    const dataCleanlinessScore = Math.max(
        0,
        Math.round(((bodyQualityRate * 0.6) + (supportedSourceRate * 0.4) - (duplicatePenalty * 0.25)) * 100)
    );

    const report = {
        urun: payload.product || payload.urun || 'Bilinmeyen urun',
        analiz_tipi: 'yorum_analizi_ve_aci_noktasi_cikarma',
        toplam_yorum: rawReviews.length,
        islenen_yorum: dedupedReviews.length,
        negatif_yorum_sayisi: negativeReviews.length,
        karantina_yorum_sayisi: quarantinePool.length,
        elenen_yorum_sayisi: droppedReviewCount,
        veri_temizligi_skoru: dataCleanlinessScore,
        kaynak_ozeti: [...new Set(dedupedReviews.map((review) => review.source))],
        baskin_aci_noktalari: topPainPoints,
        aci_noktasi_sayisi: topPainPoints.length,
        karantina_havuzu: quarantinePool
    };

    report.yonetici_ozeti = buildReviewEngineExecutiveSummary(report);
    report.eyleme_donuk_firsatlar = buildActionableOpportunities(report);
    report.ikincil_inceleme_ozeti = buildSecondaryReviewSummary(quarantinePool);
    report.karantina_sinyal_etiketleri = getMostFrequentItems(
        quarantinePool.flatMap((entry) => entry.nedenler.map((reason) => {
            const signalLabelMap = config.secondary_review_rules?.signal_label_map || {};
            return signalLabelMap[reason.kod] || reason.kod;
        })),
        5
    ).map((item) => item.deger);

    return report;
}

function scoreProblemClarity(slogan, keywords) {
    const normalizedSlogan = (slogan || '').toLowerCase();
    const matchedKeywords = keywords.filter((keyword) => normalizedSlogan.includes(keyword.toLowerCase()));

    if (matchedKeywords.length >= 2) {
        return {
            score: 5,
            matchedKeywords
        };
    }

    if (matchedKeywords.length === 1) {
        return {
            score: 3,
            matchedKeywords
        };
    }

    return {
        score: 1,
        matchedKeywords: []
    };
}

function buildDetailedAnalysis(post, report) {
    const analysisRules = apinexConfig.scout_bee_detailed_analysis;
    const normalizedSlogan = (post.slogan || '').toLowerCase();
    const normalizedTopics = post.konular.map((topic) => topic.toLowerCase());
    const nicheMatches = analysisRules.niche_keywords.filter((keyword) => normalizedSlogan.includes(keyword) || normalizedTopics.includes(keyword));
    const revenueMatches = analysisRules.revenue_keywords.filter((keyword) => normalizedSlogan.includes(keyword) || normalizedTopics.includes(keyword));

    let sinyalSeviyesi = 'dusuk';
    if (report.genel_skor >= analysisRules.high_signal_score_threshold) {
        sinyalSeviyesi = 'yuksek';
    } else if (report.genel_skor >= analysisRules.medium_signal_score_threshold) {
        sinyalSeviyesi = 'orta';
    }

    const rekabetBaskisi = post.oy_sayisi >= analysisRules.high_competition_vote_threshold ? 'yuksek' : 'orta';
    const gelirSinyali = revenueMatches.length >= 2 ? 'guclu' : revenueMatches.length === 1 ? 'orta' : 'zayif';
    const nisFirsat = nicheMatches.length >= 2 ? 'guclu' : nicheMatches.length === 1 ? 'orta' : 'zayif';
    const yorumDerinligi = post.yorum_sayisi >= analysisRules.high_comment_threshold ? 'guclu' : 'sinirli';

    const pazarYorumu = [];
    if (report.olculer.oncelikli_kategoriler.length > 0) {
        pazarYorumu.push(`Oncelikli pazarlara giriyor: ${report.olculer.oncelikli_kategoriler.join(', ')}.`);
    }
    if (gelirSinyali === 'guclu') {
        pazarYorumu.push('Slogan ve kategori yapisi odeme yapilan is problemlerine yakin.');
    }
    if (nisFirsat === 'guclu') {
        pazarYorumu.push('Nis anahtar kelimeler belirgin, daraltilmis urun firsati olabilir.');
    }
    if (rekabetBaskisi === 'yuksek') {
        pazarYorumu.push('Yuksek oy nedeniyle rekabet dikkate alinmali.');
    }

    const aksiyonOnerisi =
        report.karar === 'oncelikli_stratejik_aday'
            ? 'Rakip boslugu, fiyat modeli ve yorum icerigi ayrica incelenmeli.'
            : report.karar === 'yakindan_izle'
                ? 'Izleme listesine al, ikinci veri kaynagi ile dogrula.'
                : 'Simdilik gozlemde tut, erken karar verme.';

    return {
        sinyal_seviyesi: sinyalSeviyesi,
        gelir_sinyali: gelirSinyali,
        nis_firsat_sinyali: nisFirsat,
        rekabet_baskisi: rekabetBaskisi,
        yorum_derinligi: yorumDerinligi,
        pazar_yorumu: pazarYorumu,
        aksiyon_onerisi: aksiyonOnerisi
    };
}

function buildNotebookSummary(report) {
    const categoryText = report.olculer.oncelikli_kategoriler.length > 0
        ? report.olculer.oncelikli_kategoriler.join(', ')
        : 'oncelikli kategori eslesmesi yok';

    const pazarYorumu = report.detayli_inceleme.pazar_yorumu.join(' ');
    const riskMetni = report.riskler.length > 0 ? report.riskler.join(' ') : 'Belirgin bir risk notu yok.';

    return `${report.urun}. Genel skor ${report.genel_skor} uzerinden degerlendirildi ve karar ${report.karar}. ` +
        `Kategori uyumu: ${categoryText}. Gelir sinyali ${report.detayli_inceleme.gelir_sinyali}, nis firsat sinyali ${report.detayli_inceleme.nis_firsat_sinyali}, ` +
        `rekabet baskisi ${report.detayli_inceleme.rekabet_baskisi}. ${pazarYorumu} Risk notu: ${riskMetni} ` +
        `Onerilen aksiyon: ${report.detayli_inceleme.aksiyon_onerisi}`;
}

function getPublicDecisionLabel(decisionCode) {
    const labels = {
        detayli_incele: 'oncelikli_stratejik_aday',
        izlemeye_deger: 'yakindan_izle',
        zayif_sinyal: 'erken_sinyal',
        ele: 'pas_gec'
    };

    return labels[decisionCode] || decisionCode;
}

function buildCommercialInsight(post, report) {
    const isOpenSource = post.konular.some((topic) => topic.toLowerCase() === 'open source');
    const hasSecurity = report.olculer.oncelikli_kategoriler.some((topic) => topic.toLowerCase() === 'security');
    const hasDeveloperTools = report.olculer.oncelikli_kategoriler.some((topic) => topic.toLowerCase() === 'developer tools');
    const hasAI = report.olculer.oncelikli_kategoriler.some((topic) => ['artificial intelligence', 'ai'].includes(topic.toLowerCase()))
        || (post.slogan || '').toLowerCase().includes('ai')
        || (post.slogan || '').toLowerCase().includes('agent');

    let neOlmus = `${post.isim} urunu yuksek oy ve yorum alarak dikkat cekmis.`;
    if (hasSecurity && hasAI) {
        neOlmus = `${post.isim}, AI ajanlarinin yayginlasmasiyla buyuyen guvenlik kaygisini tek platform vaadiyle urunlestirmis gorunuyor.`;
    } else if (hasDeveloperTools) {
        neOlmus = `${post.isim}, gelistiricilerin tekrar eden bir is acisini daha hizli cozen arac olarak konumlanmis gorunuyor.`;
    }

    let ticariDeger = 'Ticari deger sinyali orta seviyede.';
    if (report.detayli_inceleme.gelir_sinyali === 'guclu') {
        ticariDeger = 'Ticari deger yuksek; cunku urun dogrudan ekiplerin para odedigi operasyonel bir aciya temas ediyor.';
    }

    let acikKaynakPsikolojisi = 'Acik kaynak psikolojisi bu urun icin belirgin degil.';
    if (isOpenSource) {
        acikKaynakPsikolojisi = 'Acik kaynak etiketi ilk benimsenmeyi kolaylastirir; cunku gelistiriciler once denemek ister. Ancak buyuk oyuncularin golgesinde para kazanmak icin acik cekirdek ustune net kurumsal paket kurmak gerekir.';
    }

    let rekabetDinamigi = 'Rekabet orta seviyede gorunuyor.';
    if (report.detayli_inceleme.rekabet_baskisi === 'yuksek') {
        rekabetDinamigi = 'Rekabet yuksek; cunku oy hacmi pazarin sicak oldugunu gosteriyor. Bu nedenle urunun genel vaatle degil, daha dar bir kurumsal aci noktasi ile savasmasi gerekir.';
    }

    return {
        ne_olmus: neOlmus,
        ticari_deger: ticariDeger,
        acik_kaynak_psikolojisi: acikKaynakPsikolojisi,
        rekabet_dinamigi: rekabetDinamigi
    };
}

function buildPricingModel(report) {
    const categories = report.olculer.oncelikli_kategoriler.map((topic) => topic.toLowerCase());
    const isSecurity = categories.includes('security');
    const isDeveloperTool = categories.includes('developer tools');
    const isProductivity = categories.includes('productivity');

    let model = 'kullanim + ekip + enterprise sozlesme';
    let paketler = [
        { paket: 'Starter', fiyat: '19 USD/kullanici/ay', hedef: 'tek kullanici veya erken ekip', not: 'ilk deneme ve benimseme icin dusuk giris bariyeri' },
        { paket: 'Team', fiyat: '99 USD/5 kullanici/ay', hedef: 'kucuk ekip', not: 'ortak kullanim ve temel ekip ozellikleri' },
        { paket: 'Growth', fiyat: '499 USD/ay', hedef: 'buyuyen startup', not: 'yonetim paneli, raporlama ve temel entegrasyonlar' },
        { paket: 'Enterprise', fiyat: '2500+ USD/ay', hedef: 'kurumsal ekip', not: 'guvenlik, denetim kaydi, SSO, ozel SLA ve yillik sozlesme' }
    ];

    if (isSecurity || isDeveloperTool) {
        model = 'koltuk + kullanim limiti + yillik enterprise sozlesme';
        paketler = [
            { paket: 'Pro', fiyat: '29 USD/kullanici/ay', hedef: 'gelistirici ve guvenlik uzmanlari', not: 'tek ekipte hizli kurulum ve temel koruma' },
            { paket: 'Team', fiyat: '149 USD/5 kullanici/ay', hedef: 'urun ve platform ekipleri', not: 'paylasimli politika, ekip yonetimi ve olay gorunurlugu' },
            { paket: 'Business', fiyat: '699 USD/ay', hedef: 'birden fazla ekip', not: 'gelismis raporlama, audit log ve entegrasyonlar' },
            { paket: 'Enterprise', fiyat: '3000+ USD/ay', hedef: 'kurumsal alicilar', not: 'SSO, ozel SLA, veri yerlesimi ve guvenlik inceleme destegi' }
        ];
    } else if (isProductivity) {
        model = 'koltuk + ekip paketi + enterprise yillik sozlesme';
    }

    return {
        model,
        para_birimi: 'USD',
        paketler
    };
}

function buildCompetitionAnalysis(report) {
    const categories = report.olculer.oncelikli_kategoriler;
    const dominantShadow = categories.length > 0
        ? `${categories.join(', ')} alaninda buyuk platformlar ve yerlesik araclarin golgesi var`
        : 'buyuk platform golgesi sinirli ama kategori net degil';

    const savunmaHatti = report.detayli_inceleme.nis_firsat_sinyali === 'guclu'
        ? 'Savunma hatti, daha dar bir is akisina odaklanmak ve enterprise gereksinimleri oncelemektir.'
        : 'Savunma hatti, daha net bir nis tanimi yapmadan kurulamaz.';

    const yorumMesaji = report.olculer.yorum_sayisi >= 20
        ? `${report.olculer.yorum_sayisi} yorum, pazarin kanayan bir yarasi oldugunu dusundurur; insanlar sadece bakmiyor, tepki veriyor.`
        : 'Yorum hacmi orta seviyede; daha derin aci noktasi okumasi gerekir.';

    return {
        pazar_psikolojisi: dominantShadow,
        yorum_okumasi: yorumMesaji,
        savunulabilirlik: savunmaHatti
    };
}

function buildSpecificActionPlan(report) {
    const productName = report.urun;

    return [
        `Ilk 24 saat icinde ${productName} icin Product Hunt yorumlarini manuel oku ve en sik gecen 3 sikayeti ayikla.`,
        `Ilk 48 saat icinde urunun hedefledigi ekip tipini netlestir: guvenlik ekibi, platform ekibi veya gelistirici araci alicisi.`,
        `Ilk 72 saat icinde ayni problemi cozen 3 buyuk oyuncuyu listele ve sadece fiyat, entegrasyon ve enterprise guven ozelliklerini karsilastir.`,
        `Bir hafta icinde daha dar bir nis teklif yaz: genel platform degil, tek bir aci noktasini cozen daha keskin bir teklif.`,
        `Iki hafta icinde kurumsal fiyat teklifini test et: dusuk giris paketi, ekip paketi ve yillik enterprise paketini landing page seviyesinde dogrula.`
    ];
}

function buildExecutiveSummary(report) {
    return `${report.urun} su anda en guclu stratejik aday gorunuyor; cunku yuksek yorum hacmi, yuksek oy hacmi ve oncelikli kategorilerle dogrudan uyum ayni noktada birlesiyor. ` +
        `${report.detayli_inceleme.gelir_sinyali === 'guclu' ? 'Urunun ticari degeri yuksek; cunku para odeme ihtimali olan kurumsal bir aciya dokunuyor. ' : ''}` +
        `${report.detayli_inceleme.rekabet_baskisi === 'yuksek' ? 'Ancak rekabet baskisi da yuksek, bu nedenle genel vaadi kopyalamak yerine daha dar bir enterprise nis secilmesi gerekir. ' : ''}` +
        `En mantikli hamle, yorumlardan cikan aci noktasini daraltip kurumsal fiyat modeli ile test etmektir.`;
}

function buildPodcastScript(report) {
    const categoryText = report.olculer.oncelikli_kategoriler.length > 0
        ? report.olculer.oncelikli_kategoriler.join(', ')
        : 'oncelikli kategori eslesmesi zayif';
    const gucluYanlar = report.neden_dikkat_cekti.length > 0
        ? report.neden_dikkat_cekti.join(' ')
        : 'Belirgin guclu sinyal bulunmuyor.';
    const riskText = report.riskler.length > 0
        ? report.riskler.join(' ')
        : 'Bu urunde belirgin bir risk notu simdilik gorunmuyor.';

    return `Giris. Bugun Scout Bee radarinda ${report.urun} var. ${report.slogan}. ` +
        `Bu urun ${report.genel_skor} puan aldi ve sistem bunu ${report.karar} olarak siniflandirdi. ` +
        `Gelisme. Burada asil soru su: ne olmus? ${report.ticari_okuma.ne_olmus} ` +
        `Bunun ticari anlami su: ${report.ticari_okuma.ticari_deger} ` +
        `Veri noktalarini birlestirdigimizde su tablo ortaya cikiyor: urun ${categoryText} kategorilerine temas ediyor, bu nedenle kurumsal para akisi ihtimali gucleniyor. ` +
        `Ayni anda ${report.olculer.yorum_sayisi} yorum gelmis olmasi, pazarin kanayan bir yaraya tepki verdigini dusunduruyor. ${gucluYanlar} ` +
        `Acik kaynak ve rekabet tarafinda resim su: ${report.ticari_okuma.acik_kaynak_psikolojisi} ${report.ticari_okuma.rekabet_dinamigi} ` +
        `Kurumsal fiyat modeli onerisi soyle: ${report.fiyatlandirma_analizi.model}. ` +
        `Ilk paket ${report.fiyatlandirma_analizi.paketler[0].paket} icin ${report.fiyatlandirma_analizi.paketler[0].fiyat}, ` +
        `${report.fiyatlandirma_analizi.paketler[1].paket} icin ${report.fiyatlandirma_analizi.paketler[1].fiyat}, ` +
        `ve ${report.fiyatlandirma_analizi.paketler[3].paket} icin ${report.fiyatlandirma_analizi.paketler[3].fiyat}. ` +
        `Sonuc. Risk tarafinda su not var: ${riskText} ` +
        `Bu nedenle en guclu eylem plani su: ${report.eylem_plani[0]} Ardindan ${report.eylem_plani[2]} Son olarak ${report.eylem_plani[4]}`;
}

function buildScoutBeeReport(post) {
    const scoringRules = apinexConfig.scout_bee_scoring;
    const priorityCategorySet = new Set(scoringRules.priority_categories.map((category) => category.toLowerCase()));
    const matchedPriorityCategories = post.konular.filter((topic) => priorityCategorySet.has(topic.toLowerCase()));
    const uniqueMatchedCategories = [...new Set(matchedPriorityCategories)];
    const categoryMatchCount = uniqueMatchedCategories.length;
    const engagementRatio = post.oy_sayisi > 0 ? post.yorum_sayisi / post.oy_sayisi : 0;

    const yorumPuani = getScoreFromBands(post.yorum_sayisi, scoringRules.comment_score_bands);
    const oyPuani = getScoreFromBands(post.oy_sayisi, scoringRules.vote_score_bands);
    const kategoriPuani =
        categoryMatchCount >= 3
            ? scoringRules.category_match_scores['3_plus']
            : scoringRules.category_match_scores[String(categoryMatchCount)] || 0;
    const etkilesimPuani = getScoreFromBands(engagementRatio, scoringRules.engagement_ratio_bands);
    const problemNetligi = scoreProblemClarity(post.slogan, scoringRules.problem_keywords);
    const problemNetligiPuani = problemNetligi.score;

    const genelSkor = yorumPuani + oyPuani + kategoriPuani + etkilesimPuani + problemNetligiPuani;
    const kararKodu = getDecisionLabel(genelSkor, scoringRules.decision_bands);
    const karar = getPublicDecisionLabel(kararKodu);

    const nedenDikkatCekti = [];
    const riskler = [];

    if (yorumPuani >= 24) {
        nedenDikkatCekti.push('Yorum sayisi guclu kullanici ilgisi gosteriyor.');
    } else if (yorumPuani >= 8) {
        nedenDikkatCekti.push('Yorumlar urunun dikkat cektigini gosteriyor.');
    } else {
        riskler.push('Yorum sayisi zayif, derin talep sinyali sinirli olabilir.');
    }

    if (oyPuani >= 24) {
        nedenDikkatCekti.push('Oy sayisi yuksek, urun gorunur talep toplamayi basarmis.');
    } else if (oyPuani >= 10) {
        nedenDikkatCekti.push('Oy sayisi orta seviyede ilgi oldugunu gosteriyor.');
    } else {
        riskler.push('Oy sayisi dusuk, ilgi sinyali sinirli.');
    }

    if (uniqueMatchedCategories.length > 0) {
        nedenDikkatCekti.push(`Oncelikli kategorilerle uyumlu: ${uniqueMatchedCategories.join(', ')}.`);
    } else {
        riskler.push('Oncelikli kategorilerle eslesme zayif.');
    }

    if (etkilesimPuani >= 8) {
        nedenDikkatCekti.push('Yorum/oy dengesi saglikli, yuzeysel ilgiye gore daha guclu sinyal var.');
    } else {
        riskler.push('Yorum/oy dengesi zayif, ilgi derinlesmemis olabilir.');
    }

    if (problemNetligiPuani >= 5) {
        nedenDikkatCekti.push('Slogan net bir problem veya kullanim alani anlatiyor.');
    } else if (problemNetligiPuani <= 1) {
        riskler.push('Slogan cok genel, problem netligi zayif.');
    }

    const rapor = {
        urun: post.isim,
        slogan: post.slogan,
        url: post.url,
        genel_skor: genelSkor,
        karar,
        puan_detayi: {
            yorum_puani: yorumPuani,
            oy_puani: oyPuani,
            kategori_puani: kategoriPuani,
            etkilesim_puani: etkilesimPuani,
            problem_netligi_puani: problemNetligiPuani
        },
        olculer: {
            oy_sayisi: post.oy_sayisi,
            yorum_sayisi: post.yorum_sayisi,
            etkilesim_orani: Number(engagementRatio.toFixed(3)),
            oncelikli_kategoriler: uniqueMatchedCategories,
            tum_konular: post.konular
        },
        neden_dikkat_cekti: nedenDikkatCekti,
        riskler
    };

    rapor.detayli_inceleme = buildDetailedAnalysis(post, rapor);
    rapor.ticari_okuma = buildCommercialInsight(post, rapor);
    rapor.fiyatlandirma_analizi = buildPricingModel(rapor);
    rapor.rekabet_analizi = buildCompetitionAnalysis(rapor);
    rapor.eylem_plani = buildSpecificActionPlan(rapor);
    rapor.yonetici_ozeti = buildExecutiveSummary(rapor);
    rapor.notebooklm_ozeti = buildNotebookSummary(rapor);
    rapor.podcast_metni = buildPodcastScript(rapor);

    return rapor;
}

async function getScoutBeeReports(limit) {
    const posts = await fetchProductHuntPosts(limit);
    return posts.map(buildScoutBeeReport).sort((a, b) => b.genel_skor - a.genel_skor);
}

async function fetchProductHuntPosts(limit = 5) {
    if (!PRODUCT_HUNT_TOKEN) {
        throw new Error('Product Hunt token eksik. `.env` icine `PRODUCT_HUNT_DEVELOPER_TOKEN` eklemelisin.');
    }

    const query = `
        query GetLatestPosts($first: Int!) {
            posts(first: $first) {
                edges {
                    node {
                        id
                        name
                        tagline
                        url
                        votesCount
                        commentsCount
                        createdAt
                        topics {
                            edges {
                                node {
                                    id
                                    name
                                    slug
                                }
                            }
                        }
                    }
                }
            }
        }
    `;

    const response = await fetch(PRODUCT_HUNT_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PRODUCT_HUNT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query,
            variables: { first: limit }
        })
    });

    const payload = await response.json();

    if (!response.ok) {
        const errorMessage = payload?.errors?.[0]?.message || 'Product Hunt istegi basarisiz oldu.';
        throw new Error(errorMessage);
    }

    if (payload.errors?.length) {
        throw new Error(payload.errors[0].message);
    }

    return payload.data.posts.edges.map(({ node }) => ({
        id: node.id,
        isim: node.name,
        slogan: node.tagline,
        url: node.url,
        oy_sayisi: node.votesCount,
        yorum_sayisi: node.commentsCount,
        olusturma_tarihi: node.createdAt,
        konular: node.topics.edges.map((topicEdge) => topicEdge.node.name)
    }));
}

// Kovanın Durum Kontrol Rotası (Health Check)
app.get('/api/status', (req, res) => {
    res.json(buildApiSuccessPayload({
        servis: 'APINEX',
        veri: {
            proje: 'APINEX',
            mesaj: 'Kralice Ari uyandi, Kovan sistemleri cevrimici.'
        }
    }));
});

app.post('/api/review-engine/analyze', (req, res) => {
    const validationErrors = validateReviewAnalyzePayload(req.body);

    if (validationErrors.length > 0) {
        return sendApiError(res, {
            statusCode: 400,
            servis: 'PainHive',
            kod: 'GECERSIZ_ISTEK',
            mesaj: 'Analiz istegi gecerli degil. Girdi alanlarini kontrol et.',
            detaylar: validationErrors,
            ornekGovde: buildReviewAnalyzeExamplePayload()
        });
    }

    const report = analyzeReviewEnginePayload(req.body);

    res.json(buildApiSuccessPayload({
        servis: 'PainHive',
        veri: report
    }));
});

// Scout Bee: Product Hunt uzerinden kanitlanmis urun akislarini tarar.
app.get('/api/scout/producthunt', async (req, res) => {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 5 : Math.min(Math.max(requestedLimit, 1), 10);

    if (!PRODUCT_HUNT_TOKEN) {
        return sendApiError(res, {
            statusCode: 503,
            servis: 'Scout Bee',
            kod: 'TOKEN_GEREKLI',
            mesaj: 'Product Hunt token tanimli degil. Once `.env` dosyasina `PRODUCT_HUNT_DEVELOPER_TOKEN` ekle.',
            detaylar: [
                {
                    alan: 'PRODUCT_HUNT_DEVELOPER_TOKEN',
                    mesaj: 'Ortam degiskeni tanimli degil.'
                }
            ]
        });
    }

    try {
        const raporlar = await getScoutBeeReports(limit);

        res.json(buildApiSuccessPayload({
            servis: 'Scout Bee',
            durum: getScoutBeeStatus(),
            veri: {
                kaynak: 'Product Hunt',
                kayit_sayisi: raporlar.length,
                istek_limiti: limit,
                veriler: raporlar
            }
        }));
    } catch (error) {
        res.status(502).json(buildApiErrorPayload({
            servis: 'Scout Bee',
            kod: 'DIS_KAYNAK_HATASI',
            mesaj: 'Scout Bee Product Hunt verisini cekemedi.',
            detaylar: [
                {
                    alan: 'Product Hunt',
                    mesaj: error.message
                }
            ]
        }));
    }
});

app.get('/api/scout/producthunt/detayli-incele', async (req, res) => {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit) ? 10 : Math.min(Math.max(requestedLimit, 1), 20);

    if (!PRODUCT_HUNT_TOKEN) {
        return sendApiError(res, {
            statusCode: 503,
            servis: 'Scout Bee',
            kod: 'TOKEN_GEREKLI',
            mesaj: 'Product Hunt token tanimli degil. Once `.env` dosyasina `PRODUCT_HUNT_DEVELOPER_TOKEN` ekle.',
            detaylar: [
                {
                    alan: 'PRODUCT_HUNT_DEVELOPER_TOKEN',
                    mesaj: 'Ortam degiskeni tanimli degil.'
                }
            ]
        });
    }

    try {
        const tumRaporlar = await getScoutBeeReports(limit);
        const detayliInceleRaporlari = tumRaporlar.filter((rapor) => rapor.karar === 'oncelikli_stratejik_aday');
        const notebookMetni = detayliInceleRaporlari.map((rapor, index) => `${index + 1}. ${rapor.notebooklm_ozeti}`).join('\n\n');
        const podcastMetni = detayliInceleRaporlari.map((rapor, index) => `Bolum ${index + 1}. ${rapor.podcast_metni}`).join('\n\n');
        const yoneticiOzeti = detayliInceleRaporlari.map((rapor, index) => `${index + 1}. ${rapor.yonetici_ozeti}`).join('\n\n');

        res.json(buildApiSuccessPayload({
            servis: 'Scout Bee',
            durum: getScoutBeeStatus(),
            veri: {
                kaynak: 'Product Hunt',
                filtre: 'oncelikli_stratejik_aday',
                taranan_kayit_sayisi: tumRaporlar.length,
                eslesen_kayit_sayisi: detayliInceleRaporlari.length,
                notebooklm_metin: notebookMetni,
                podcast_metni: podcastMetni,
                yonetici_ozeti: yoneticiOzeti,
                veriler: detayliInceleRaporlari
            }
        }));
    } catch (error) {
        res.status(502).json(buildApiErrorPayload({
            servis: 'Scout Bee',
            kod: 'DETAYLI_INCELEME_HATASI',
            mesaj: 'Detayli inceleme rotasi veriyi hazirlayamadi.',
            detaylar: [
                {
                    alan: 'Product Hunt',
                    mesaj: error.message
                }
            ]
        }));
    }
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return sendApiError(res, {
            statusCode: 400,
            servis: 'APINEX',
            kod: 'GECERSIZ_JSON',
            mesaj: 'Istek govdesi gecerli JSON formatinda degil.',
            ornekGovde: buildReviewAnalyzeExamplePayload()
        });
    }

    if (error?.message === 'CORS izni verilmeyen origin.') {
        return sendApiError(res, {
            statusCode: 403,
            servis: 'APINEX',
            kod: 'CORS_ENGELLENDI',
            mesaj: 'Bu origin icin API erisimi izinli degil.'
        });
    }

    return sendApiError(res, {
        statusCode: 500,
        servis: 'APINEX',
        kod: 'BEKLENMEYEN_HATA',
        mesaj: 'Beklenmeyen bir sunucu hatasi olustu.',
        detaylar: error?.message
            ? [
                {
                    alan: 'server',
                    mesaj: error.message
                }
            ]
            : []
    });
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`🐝 APINEX Kovanı ${PORT} portunda dinleniyor...`);
    console.log(`🌍 Calisma ortami: ${NODE_ENV}`);
    console.log(`🔐 CORS izinleri: ${CLIENT_ORIGIN || 'tum originler (gelistirme modu gibi davranir)'}`);
    console.log(`📍 Durum kontrolü: http://localhost:${PORT}/api/status`);
    console.log(`🔎 Scout Bee durumu: ${getScoutBeeStatus()}`);
    console.log(`📡 Scout Bee test rotası: http://localhost:${PORT}/api/scout/producthunt`);
    console.log(`🎙️ Detayli inceleme rotası: http://localhost:${PORT}/api/scout/producthunt/detayli-incele`);
});