// Would You Rather - Main App
const _t = (k, fb) => (window.i18n?.t(k) !== k ? window.i18n.t(k) : fb);

const gameScreen = document.getElementById('game-screen');
const summaryScreen = document.getElementById('summary-screen');
const TOTAL_QUESTIONS = 20;
let currentIdx = 0;
let answers = [];
let questions = [];

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
    loadQuestions();
    showQuestion();
})();

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

    // Auto-advance after delay
    setTimeout(() => {
        currentIdx++;
        showQuestion();
    }, 1800);

    saveAnswer();
    if (typeof gtag === 'function') gtag('event', 'answer', { event_category: 'would_you_rather', event_label: `q${currentIdx + 1}_${choice}` });
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
    answers.forEach(a => {
        const q = questions[a.idx];
        const picked = a.choice === 'a' ? q.pctA : q.pctB;
        if (picked > 50) majorityCount++;
    });

    const majorityPct = Math.round((majorityCount / TOTAL_QUESTIONS) * 100);

    document.getElementById('summary-desc').textContent =
        _t('summary.desc', 'You agreed with the majority {pct}% of the time!')
            .replace('{pct}', majorityPct);

    const statsEl = document.getElementById('summary-stats');
    statsEl.innerHTML = `
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

    if (typeof gtag === 'function') gtag('event', 'complete', { event_category: 'would_you_rather', value: majorityPct });
}

// Share
document.getElementById('btn-share-summary').addEventListener('click', () => {
    let majorityCount = 0;
    answers.forEach(a => {
        const q = questions[a.idx];
        if ((a.choice === 'a' ? q.pctA : q.pctB) > 50) majorityCount++;
    });
    const majorityPct = Math.round((majorityCount / TOTAL_QUESTIONS) * 100);

    const text = _t('share.text', 'I agreed with the majority {pct}% of the time in Would You Rather! 🤔\nHow about you?')
        .replace('{pct}', majorityPct);
    const url = 'https://dopabrain.com/would-you-rather/';

    if (navigator.share) {
        navigator.share({ title: _t('share.title', 'Would You Rather'), text, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(text + '\n' + url)
            .then(() => alert(_t('share.copied', 'Copied to clipboard!')))
            .catch(() => {});
    }
});

// Play again
document.getElementById('btn-play-again').addEventListener('click', () => {
    currentIdx = 0;
    answers = [];
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
