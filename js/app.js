// Would You Rather - Main App
const _t = (k, fb) => {
    const value = window.i18n?.t?.(k);
    return value && value !== k ? value : fb;
};

const gameScreen = document.getElementById('game-screen');
const summaryScreen = document.getElementById('summary-screen');
const TOTAL_QUESTIONS = 20;
let currentIdx = 0;
let answers = [];
let questions = [];
let hasStarted = false;
let lastSummaryData = null;
const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// i18n init
(async function initI18n() {
    try {
        await i18n.loadTranslations(i18n.getCurrentLanguage());
        i18n.updateUI();
        const langToggle = document.getElementById('lang-toggle');
        const langMenu = document.getElementById('lang-menu');
        document.querySelector(`[data-lang="${i18n.getCurrentLanguage()}"]`)?.classList.add('active');
        langToggle?.addEventListener('click', () => langMenu.classList.toggle('hidden'));
        document.addEventListener('click', e => {
            if (!e.target.closest('.language-selector')) langMenu?.classList.add('hidden');
        });
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', async () => {
                await i18n.setLanguage(opt.dataset.lang);
                document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                langMenu.classList.add('hidden');
                loadQuestions();
                currentIdx = 0;
                answers = [];
                showQuestion();
            });
        });
    } catch (e) { console.warn('i18n init:', e); }
    finally {
        const loader = document.getElementById('app-loader');
        if (loader) { loader.classList.add('hidden'); setTimeout(() => loader.remove(), 300); }
    }
    preserveLanguageLinks();
    loadQuestions();
    showQuestion();
})();

function getCurrentLocale() {
    return window.i18n?.getCurrentLanguage?.() || 'en';
}

function getShareUrl() {
    return 'https://dopabrain.com/would-you-rather/?lang=' + encodeURIComponent(getCurrentLocale()) + '&utm_source=share';
}

function showToast(msg) {
    let toast = document.getElementById('wyr-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'wyr-toast';
        toast.className = 'wyr-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function preserveLanguageLinks() {
    try {
        const lang = getCurrentLocale();
        const base = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://dopabrain.com';
        document.querySelectorAll('.related-grid a, .app-footer a').forEach(a => {
            const href = a.getAttribute('data-base-href') || a.getAttribute('href');
            if (!href || href.startsWith('#')) return;
            const url = new URL(href, base);
            url.searchParams.set('lang', lang);
            if (a.closest('.related-grid') && !url.searchParams.has('source')) {
                url.searchParams.set('source', 'would_you_rather_result');
            }
            a.setAttribute('href', url.pathname + url.search + url.hash);

            if (a.closest('.related-grid') && !a.dataset.trackedCta) {
                a.dataset.trackedCta = 'true';
                a.addEventListener('click', () => {
                    if (typeof gtag === 'function') {
                        gtag('event', 'content_cta_click', {
                            cta_surface: 'would_you_rather_related',
                            destination: a.getAttribute('href'),
                            source: 'would_you_rather',
                            lang
                        });
                    }
                });
            }
        });
    } catch (e) {}
}

function loadQuestions() {
    questions = [];
    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
        const a = _t(`q${i}.a`, `Option A ${i}`);
        const b = _t(`q${i}.b`, `Option B ${i}`);
        const ea = _t(`q${i}.ea`, '🅰️');
        const eb = _t(`q${i}.eb`, '🅱️');
        // Simulated community percentages (seeded per question)
        const seed = i * 7919;
        const pctA = 30 + ((seed * 1664525 + 1013904223) >>> 0) % 41; // 30-70
        questions.push({ a, b, ea, eb, pctA, pctB: 100 - pctA });
    }
}

function show(screen) {
    [gameScreen, summaryScreen].forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
    window.scrollTo(0, 0);
}

function showQuestion() {
    if (currentIdx >= TOTAL_QUESTIONS) {
        showSummary();
        return;
    }

    const q = questions[currentIdx];
    document.getElementById('q-counter').textContent = `${currentIdx + 1} / ${TOTAL_QUESTIONS}`;
    document.getElementById('progress-fill').style.width = `${((currentIdx) / TOTAL_QUESTIONS) * 100}%`;

    document.getElementById('emoji-a').textContent = q.ea;
    document.getElementById('text-a').textContent = q.a;
    document.getElementById('emoji-b').textContent = q.eb;
    document.getElementById('text-b').textContent = q.b;

    // Reset state
    const choiceA = document.getElementById('choice-a');
    const choiceB = document.getElementById('choice-b');
    choiceA.classList.remove('selected', 'disabled');
    choiceB.classList.remove('selected', 'disabled');
    document.getElementById('result-a').classList.add('hidden');
    document.getElementById('result-b').classList.add('hidden');
    document.getElementById('fill-a').style.width = '0';
    document.getElementById('fill-b').style.width = '0';

    // Animate card
    const card = document.getElementById('question-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'fadeSlideIn 0.3s ease';

    document.getElementById('answered-count').textContent = getAnsweredCount();
}

function choose(choice) {
    const q = questions[currentIdx];
    answers.push({ idx: currentIdx, choice });

    const choiceA = document.getElementById('choice-a');
    const choiceB = document.getElementById('choice-b');

    choiceA.classList.add('disabled');
    choiceB.classList.add('disabled');

    if (choice === 'a') choiceA.classList.add('selected');
    else choiceB.classList.add('selected');

    // Show results
    document.getElementById('result-a').classList.remove('hidden');
    document.getElementById('result-b').classList.remove('hidden');
    document.getElementById('pct-a').textContent = q.pctA + '%';
    document.getElementById('pct-b').textContent = q.pctB + '%';

    setTimeout(() => {
        document.getElementById('fill-a').style.width = q.pctA + '%';
        document.getElementById('fill-b').style.width = q.pctB + '%';
    }, 50);

    // Auto-advance after delay (shortened for reduced motion)
    setTimeout(() => {
        currentIdx++;
        showQuestion();
    }, prefersReducedMotion ? 80 : 1800);

    saveAnswer();
    if (typeof gtag === 'function') {
        if (!hasStarted) {
            hasStarted = true;
            gtag('event', 'test_start', {
                event_category: 'would_you_rather',
                app_name: 'would-you-rather'
            });
        }
        gtag('event', 'answer', { event_category: 'would_you_rather', event_label: `q${currentIdx + 1}_${choice}` });
    }
}

document.getElementById('choice-a').addEventListener('click', () => choose('a'));
document.getElementById('choice-b').addEventListener('click', () => choose('b'));

function getAnsweredCount() {
    return parseInt(localStorage.getItem('wyr_total') || '0');
}
function saveAnswer() {
    const c = getAnsweredCount() + 1;
    localStorage.setItem('wyr_total', c.toString());
}

function showSummary() {
    show(summaryScreen);
    document.getElementById('progress-fill').style.width = '100%';

    // Calculate stats
    let majorityCount = 0;
    let boldChoices = 0; // choices where picked option had <40%
    let quickDecisions = 0; // choices where option A was picked (typically the "safe" option)
    answers.forEach(a => {
        const q = questions[a.idx];
        const picked = a.choice === 'a' ? q.pctA : q.pctB;
        if (picked > 50) majorityCount++;
        if (picked < 40) boldChoices++;
        if (a.choice === 'a') quickDecisions++;
    });

    const majorityPct = Math.round((majorityCount / TOTAL_QUESTIONS) * 100);
    const boldPct = Math.round((boldChoices / TOTAL_QUESTIONS) * 100);

    // Personality type based on choices
    let personality, personalityEmoji, personalityKey;
    if (majorityPct >= 75) {
        personalityKey = 'conformist';
        personality = _t('personality.conformist', 'Crowd Follower'); personalityEmoji = '🐑';
    } else if (majorityPct <= 25) {
        personalityKey = 'rebel';
        personality = _t('personality.rebel', 'Bold Rebel'); personalityEmoji = '🦅';
    } else if (boldPct >= 40) {
        personalityKey = 'adventurer';
        personality = _t('personality.adventurer', 'Adventurer'); personalityEmoji = '🗺️';
    } else if (quickDecisions >= 14) {
        personalityKey = 'cautious';
        personality = _t('personality.cautious', 'Safe Player'); personalityEmoji = '🛡️';
    } else if (quickDecisions <= 6) {
        personalityKey = 'wildcard';
        personality = _t('personality.wildcard', 'Wild Card'); personalityEmoji = '🃏';
    } else {
        personalityKey = 'balanced';
        personality = _t('personality.balanced', 'Balanced Thinker'); personalityEmoji = '⚖️';
    }
    lastSummaryData = { personalityKey, personality, personalityEmoji, majorityPct, boldPct };

    document.getElementById('summary-desc').textContent =
        _t('summary.desc', 'You agreed with the majority {pct}% of the time!')
            .replace('{pct}', majorityPct);

    const statsEl = document.getElementById('summary-stats');
    statsEl.innerHTML = `
        <div class="stat-item" style="grid-column:1/-1;">
            <div class="stat-value" style="font-size:2rem;">${personalityEmoji} ${personality}</div>
            <div class="stat-label">${_t('summary.personality', 'Your Personality')}</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${TOTAL_QUESTIONS}</div>
            <div class="stat-label">${_t('summary.questions', 'Questions')}</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${majorityPct}%</div>
            <div class="stat-label">${_t('summary.majority', 'With Majority')}</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${100 - majorityPct}%</div>
            <div class="stat-label">${_t('summary.unique', 'Unique Choices')}</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${getAnsweredCount()}</div>
            <div class="stat-label">${_t('summary.totalAnswered', 'Total Answered')}</div>
        </div>`;

    renderCuratedResources(personalityKey);
    preserveLanguageLinks();

    if (typeof gtag === 'function') {
        gtag('event', 'test_complete', {
            event_category: 'would_you_rather',
            app_name: 'would-you-rather',
            result_type: personalityKey
        });
    }
}

function getAmazonDomain(lang) {
    const map = { ja: 'amazon.co.jp', de: 'amazon.de', fr: 'amazon.fr', es: 'amazon.es', hi: 'amazon.in' };
    return map[lang] || 'amazon.com';
}

function renderCuratedResources(personalityKey) {
    const container = document.getElementById('curated-resources-card');
    if (!container) return;
    const lang = getCurrentLocale();
    const domain = getAmazonDomain(lang);
    const items = [
        {
            key: 'thinkingFastAndSlow',
            asin: '0374533555',
            title: _t('curated.thinkingTitle', 'Thinking, Fast and Slow — Daniel Kahneman'),
            desc: _t('curated.thinkingDesc', 'Nobel laureate guide to System 1 snap instincts vs. System 2 trade-offs.')
        },
        {
            key: 'predictablyIrrational',
            asin: '0061353248',
            title: _t('curated.irrationalTitle', 'Predictably Irrational — Dan Ariely'),
            desc: _t('curated.irrationalDesc', 'Why forced comparisons and hidden defaults bend everyday decisions.')
        }
    ];

    container.innerHTML = `
        <div class="curated-resources-header">
            <h3 class="curated-resources-title">${_t('curated.title', 'Recommended Decision Psychology Books')}</h3>
            <span class="curated-disclosure">${_t('curated.disclosure', 'Affiliate links')}</span>
        </div>
        <p class="curated-resources-subtitle">${_t('curated.subtitle', 'Explore cognitive trade-offs and social consensus psychology.')}</p>
        <div class="curated-list">
            ${items.map(item => `
                <a class="curated-item" href="https://www.${domain}/dp/${item.asin}?tag=dopabrain-20" target="_blank" rel="noopener sponsored nofollow" data-resource-key="${item.key}">
                    <div class="curated-item-top">
                        <span class="curated-item-title">${item.title}</span>
                        <span class="curated-item-cta">${_t('curated.cta', 'View Book ->')}</span>
                    </div>
                    <span class="curated-item-desc">${item.desc}</span>
                </a>
            `).join('')}
        </div>`;

    container.querySelectorAll('.curated-item').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'curated_resource_click', {
                    app_name: 'would-you-rather',
                    resource_key: link.getAttribute('data-resource-key'),
                    result_type: personalityKey || '',
                    content_locale: lang,
                    cta_surface: 'curated_resources'
                });
                gtag('event', 'content_cta_click', {
                    cta_type: 'curated_book',
                    destination: link.getAttribute('href'),
                    source: 'would_you_rather'
                });
            }
        });
    });
}

function saveSummaryCard() {
    const canvas = document.getElementById('share-canvas');
    if (!canvas || !lastSummaryData) return;
    const { personalityKey, personality, personalityEmoji, majorityPct, boldPct } = lastSummaryData;
    const lang = getCurrentLocale();
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, '#0f0a24');
    grad.addColorStop(0.5, '#1e1145');
    grad.addColorStop(1, '#090915');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.beginPath();
    ctx.arc(540, 500, 310, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c4b5fd';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOPABRAIN · WOULD YOU RATHER', 540, 180);

    ctx.font = '190px system-ui, sans-serif';
    ctx.fillText(personalityEmoji, 540, 510);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
    ctx.fillText(personality, 540, 700);

    const bars = [
        { label: _t('summary.majority', 'With Majority'), pct: majorityPct, color: '#8b5cf6' },
        { label: _t('summary.unique', 'Unique Choices'), pct: 100 - majorityPct, color: '#06b6d4' },
        { label: _t('summary.totalAnswered', 'Bold Rate'), pct: boldPct, color: '#f59e0b' }
    ];
    bars.forEach((b, idx) => {
        const y = 980 + idx * 170;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(b.label, 120, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#c4b5fd';
        ctx.fillText(b.pct + '%', 960, y);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(120, y + 26, 840, 28);
        ctx.fillStyle = b.color;
        ctx.fillRect(120, y + 26, Math.round((b.pct / 100) * 840), 28);
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '30px system-ui, -apple-system, sans-serif';
    ctx.fillText('dopabrain.com/would-you-rather/?lang=' + lang, 540, 1780);

    try {
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'would-you-rather-' + personalityKey + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast(_t('summary.saved', 'Card Saved!'));
        if (typeof gtag === 'function') {
            gtag('event', 'save_image', {
                event_category: 'would_you_rather',
                app_name: 'would-you-rather',
                result_type: personalityKey,
                save_surface: 'result_story_1080x1920'
            });
        }
    } catch (e) {
        showToast(_t('summary.saveFailed', 'Could not save card.'));
    }
}

// Share
document.getElementById('btn-share-summary').addEventListener('click', () => {
    let majorityCount = 0;
    answers.forEach(a => {
        const q = questions[a.idx];
        if ((a.choice === 'a' ? q.pctA : q.pctB) > 50) majorityCount++;
    });
    const majorityPct = Math.round((majorityCount / TOTAL_QUESTIONS) * 100);

    // Get personality from summary display
    const personalityEl = document.querySelector('#summary-stats .stat-value');
    const personalityText = personalityEl ? personalityEl.textContent : '';

    const text = _t('share.text', 'I agreed with the majority {pct}% of the time in Would You Rather! 🤔\nHow about you?')
        .replace('{pct}', majorityPct)
        + (personalityText ? `\n${_t('share.type', 'Type')}: ${personalityText}` : '');
    const url = getShareUrl();

    if (navigator.share) {
        navigator.share({ title: _t('share.title', 'Would You Rather'), text, url }).catch(() => {});
        if (typeof gtag === 'function') gtag('event', 'share', { method: 'web_share', content_type: 'dilemma_profile' });
    } else {
        navigator.clipboard.writeText(text + '\n' + url)
            .then(() => showToast(_t('share.copied', 'Copied to clipboard!')))
            .catch(() => {});
        if (typeof gtag === 'function') gtag('event', 'share', { method: 'copy', content_type: 'dilemma_profile' });
    }
});

document.getElementById('btn-save-card')?.addEventListener('click', saveSummaryCard);

// Play again
document.getElementById('btn-play-again').addEventListener('click', () => {
    currentIdx = 0;
    answers = [];
    hasStarted = false;
    // Shuffle questions
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    show(gameScreen);
    showQuestion();
});

// Theme
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    themeToggle.textContent = saved === 'light' ? '🌙' : '☀️';
    themeToggle.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        const next = cur === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
    });
}

// CSS animation
const style = document.createElement('style');
style.textContent = `@keyframes fadeSlideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`;
document.head.appendChild(style);
