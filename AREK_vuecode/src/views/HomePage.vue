<template>
  <div class="page">
    <topleader />

    <main class="home">
      <section class="card">
        <section class="welcome-panel">
          <div class="welcome-left">
            <h1 class="welcome-title">
              <span class="welcome-title-main">Welcome to</span>
              <span class="welcome-title-brand">AREK</span>
            </h1>
            <p class="welcome-subtitle">Alcohol-related Enterotypes Knowledgebase</p>
            <ul class="welcome-list">
              <li>Query enterotypes across alcohol model studies</li>
              <li>Link microbes to metabolic and immune profiles</li>
              <li>Browse precomputed prediction results and key features</li>
            </ul>
          </div>
          <div class="welcome-right" aria-label="AREK overview workflow">
            <div v-for="(item, index) in heroSteps" :key="item.title" class="hero-step">
              <div class="hero-icon-wrap">
                <img class="hero-icon" :src="item.image" :alt="item.title" />
              </div>
              <span class="hero-label">{{ item.title }}</span>
              <span v-if="index < heroSteps.length - 1" class="hero-arrow" aria-hidden="true">&rarr;</span>
            </div>
          </div>
        </section>

        <div class="search-panel">
          <div class="search-grid">
            <div class="view-title">View by Data</div>

            <label class="field">
              <span class="field-label">{{ filterLabels.studyNr }}</span>
              <select v-model="filtersData.studyNr" class="field-input">
                <option value="">All</option>
                <option v-for="item in studyNrOptions" :key="`nr-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.subject }}</span>
              <select v-model="filtersData.subject" class="field-input">
                <option value="">All</option>
                <option v-for="item in subjectOptions" :key="`sub-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.sampleType }}</span>
              <select v-model="filtersData.sampleType" class="field-input">
                <option value="">All</option>
                <option v-for="item in sampleTypeOptions" :key="`sample-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <div class="search-actions">
              <button type="button" class="go-btn" @click="goToDetail(filtersData)">Search</button>
              <button type="button" class="clear-btn" @click="clearFilters(filtersData)">Clear</button>
            </div>
          </div>

          <div class="search-grid">
            <div class="view-title">View by Biology</div>

            <label class="field">
              <span class="field-label">{{ filterLabels.studyNr }}</span>
              <select v-model="filtersBiology.studyNr" class="field-input">
                <option value="">All</option>
                <option v-for="item in studyNrOptions" :key="`nr-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.subject }}</span>
              <select v-model="filtersBiology.subject" class="field-input">
                <option value="">All</option>
                <option v-for="item in subjectOptions" :key="`sub-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.sampleType }}</span>
              <select v-model="filtersBiology.sampleType" class="field-input">
                <option value="">All</option>
                <option v-for="item in sampleTypeOptions" :key="`sample-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <div class="search-actions">
              <button type="button" class="go-btn" @click="goToDetail(filtersBiology)">Search</button>
              <button type="button" class="clear-btn" @click="clearFilters(filtersBiology)">Clear</button>
            </div>
          </div>

          <div class="search-grid">
            <div class="view-title">View by Outcome</div>

            <label class="field">
              <span class="field-label">{{ filterLabels.studyNr }}</span>
              <select v-model="filtersOutcome.studyNr" class="field-input">
                <option value="">All</option>
                <option v-for="item in studyNrOptions" :key="`nr-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.subject }}</span>
              <select v-model="filtersOutcome.subject" class="field-input">
                <option value="">All</option>
                <option v-for="item in subjectOptions" :key="`sub-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.sampleType }}</span>
              <select v-model="filtersOutcome.sampleType" class="field-input">
                <option value="">All</option>
                <option v-for="item in sampleTypeOptions" :key="`sample-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <div class="search-actions">
              <button type="button" class="go-btn" @click="goToDetail(filtersOutcome)">Search</button>
              <button type="button" class="clear-btn" @click="clearFilters(filtersOutcome)">Clear</button>
            </div>
          </div>
        </div>

        <h2 class="section-title">Browse by Modules</h2>
        <div class="module-grid">
          <button
            v-for="module in moduleCards"
            :key="module.title"
            type="button"
            class="module-card"
          >
            <img class="module-icon" :src="module.image" :alt="module.title" />
            <div class="module-copy">
              <h3>{{ module.title }}</h3>
              <p>{{ module.description }}</p>
            </div>
            <span class="module-arrow" aria-hidden="true">&rsaquo;</span>
          </button>
        </div>

        <h2 class="section-title">What's New</h2>
        <div class="news-grid">
          <article class="news-card">
            <h3>New datasets</h3>
            <p>Added Study X dataset (n=800, mouse)</p>
            <p>Updated Y Cohort V1 to V2 (n=500, human)</p>
            <p>New taxonomy summary for [dataset]</p>
          </article>
          <article class="news-card">
            <h3>New model versions</h3>
            <p>Random Forest V12 released</p>
            <p>Logic Regression V9 updated</p>
            <p>New Deep Learning architecture tested</p>
          </article>
          <article class="news-card">
            <h3>New mechanism links</h3>
            <p>Linked microbial taxa to Pathway A</p>
            <p>Extended associations with Metabolite B</p>
            <p>Updated interactions for Cytokine C</p>
          </article>
        </div>

        <div v-if="message" class="message" :class="messageType">
          {{ message }}
        </div>

        <pre v-if="resultText" class="result">{{ resultText }}</pre>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { API_ENDPOINTS } from '@/constants';
import { apiRequest } from '@/utils/api';
import topleader from '@/components/topleader.vue';

const router = useRouter();
const homepageIcon = (fileName) => `${process.env.BASE_URL}homepage-icons/${fileName}`;
const message = ref('');
const messageType = ref('info');
const resultText = ref('');
const filterLabels = ref({
  studyNr: 'AREK Study Nr.',
  subject: 'Study subject',
  sampleType: 'Sample type'
});
const filtersData = ref({
  studyNr: '',
  subject: '',
  sampleType: ''
});
const filtersBiology = ref({
  studyNr: '',
  subject: '',
  sampleType: ''
});
const filtersOutcome = ref({
  studyNr: '',
  subject: '',
  sampleType: ''
});

const studyNrOptions = ref([]);
const subjectOptions = ref([]);
const sampleTypeOptions = ref([]);
const heroSteps = [
  { title: 'Microbiome', image: homepageIcon('microbial-culture.png') },
  { title: 'Mechanism', image: homepageIcon('mechanism.jpg') },
  { title: 'Prediction', image: homepageIcon('monitor.png') }
];
const moduleCards = [
  {
    title: 'Datasets',
    description: 'Access curated datasets across studies',
    image: homepageIcon('Datasets.png')
  },
  {
    title: 'Enterotypes',
    description: 'Explore and define microbial enterotypes',
    image: homepageIcon('Enterotypes.png')
  },
  {
    title: 'Taxa',
    description: 'Analyze taxonomic composition and abundance',
    image: homepageIcon('Taxa.png')
  },
  {
    title: 'Functions',
    description: 'Investigate microbial functional capabilities',
    image: homepageIcon('Functions.png')
  },
  {
    title: 'Networks',
    description: 'Visualize co-occurrence and interaction networks',
    image: homepageIcon('networks.png')
  },
  {
    title: 'Mechanism Links',
    description: 'Uncover associations with metabolic pathways',
    image: homepageIcon('mechanism link.png')
  },
  {
    title: 'Prediction Leaderboard',
    description: 'Compare predictive models and performance',
    image: homepageIcon('predictive-leaderborad.png')
  },
  {
    title: 'Top Features',
    description: 'Identify key biomarkers and predictive features',
    image: homepageIcon('top features.png')
  }
];

const setResult = (type, text, payload) => {
  messageType.value = type;
  message.value = text;
  resultText.value = payload ? JSON.stringify(payload, null, 2) : '';
};

const loadSummaryFilterOptions = async () => {
  try {
    const resp = await apiRequest.get(API_ENDPOINTS.SUMMARY_FILTER_OPTIONS);
    const data = resp?.data || {};
    const headers = data.headers || {};
    const options = data.options || {};

    filterLabels.value = {
      studyNr: headers.studyNr || 'AREK Study Nr.',
      subject: headers.subject || 'Study subject',
      sampleType: 'Sample type'
    };
    studyNrOptions.value = options.studyNr || [];
    subjectOptions.value = options.subject || [];
    sampleTypeOptions.value = options.sampleType || [];
  } catch (error) {
    setResult(
      'error',
      'Failed to load summary filter options',
      error?.response?.data || { message: error.message }
    );
  }
};

onMounted(() => {
  loadSummaryFilterOptions();
});

const goToDetail = (targetFilters) => {
  router.push({
    name: 'detail-table',
    query: {
      studyNr: targetFilters.studyNr || undefined,
      subject: targetFilters.subject || undefined,
      sampleType: targetFilters.sampleType || undefined
    }
  });
};

const clearFilters = (targetFilters) => {
  targetFilters.studyNr = '';
  targetFilters.subject = '';
  targetFilters.sampleType = '';
  message.value = '';
  resultText.value = '';
};
</script>

<style scoped>
.home {
  min-height: calc(100vh - 76px);
  display: block;
  background: #f5f7fb;
  padding: 24px;
  overflow-x: hidden;
  font-family: var(--arek-font);
}

.page {
  min-height: 100vh;
  background: #d8dde3;
}

.card {
  width: min(1200px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid var(--arek-border);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  text-align: left;
}

.welcome-panel {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  align-items: start;
  padding-bottom: 18px;
  border-bottom: 1px solid #e5e7eb;
}

.welcome-title {
  margin: 0;
  font-size: 44px;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.welcome-title-main {
  color: var(--arek-blue-deep);
}

.welcome-title-brand {
  color: var(--arek-blue);
  margin-left: 0.18em;
}

.welcome-subtitle {
  margin: 8px 0 0;
  color: var(--arek-text-strong);
  font-size: 20px;
  font-weight: 500;
}

.welcome-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: var(--arek-text-body);
  font-size: 15px;
  line-height: 1.7;
  font-weight: 500;
}

.welcome-right {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  border-radius: 20px;
  background:
    radial-gradient(circle at top, rgba(18, 150, 216, 0.16), transparent 42%),
    linear-gradient(180deg, #ffffff 0%, #eef4fb 100%);
  padding: 18px;
}

.hero-step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.hero-icon-wrap {
  width: 128px;
  height: 128px;
  border-radius: 999px;
  border: 6px solid var(--arek-blue-soft);
  background: #fff;
  box-shadow: 0 12px 28px rgba(18, 150, 216, 0.18);
  display: grid;
  place-items: center;
}

.hero-icon {
  width: 76px;
  height: 76px;
  object-fit: contain;
}

.hero-label {
  color: var(--arek-text-strong);
  font-size: 18px;
  font-weight: 700;
}

.hero-arrow {
  position: absolute;
  right: -26px;
  top: 46px;
  color: var(--arek-text-muted);
  font-size: 44px;
  line-height: 1;
}

.search-grid {
  display: grid;
  grid-template-columns: 220px 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.search-panel {
  margin-top: 14px;
  border: 1px solid var(--arek-border);
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px 12px;
}

.search-panel .search-grid {
  padding: 10px 6px;
}

.search-panel .search-grid + .search-grid {
  border-top: 1px solid var(--arek-border);
}

.view-title {
  text-align: left;
  font-size: 20px;
  line-height: 1;
  font-weight: 700;
  color: var(--arek-text-strong);
  align-self: center;
}

.field {
  display: grid;
  gap: 6px;
  text-align: left;
}

.field-label {
  color: var(--arek-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.field-input {
  width: 100%;
  border: 1px solid var(--arek-border);
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--arek-text-strong);
}

.search-actions {
  display: flex;
  gap: 10px;
  align-items: end;
}

.go-btn {
  border: 1px solid var(--arek-blue);
  background: var(--arek-blue);
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.go-btn:hover {
  background: var(--arek-blue-deep);
}

.clear-btn {
  border: 1px solid var(--arek-border);
  background: #fff;
  color: var(--arek-text-body);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.clear-btn:hover {
  background: #f9fafb;
}

.module-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.module-card {
  min-height: 102px;
  border: 1px solid var(--arek-border);
  border-radius: 10px;
  background: #ffffff;
  color: var(--arek-text-strong);
  cursor: pointer;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 14px;
  align-items: center;
  text-align: left;
  padding: 16px 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.module-card:hover {
  background: #f8fbff;
  border-color: var(--arek-blue-soft);
}

.module-icon {
  width: 46px;
  height: 46px;
  object-fit: contain;
}

.module-copy h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--arek-text-strong);
  font-weight: 700;
}

.module-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.35;
  color: var(--arek-text-body);
  font-weight: 500;
}

.module-arrow {
  color: var(--arek-text-muted);
  font-size: 28px;
  line-height: 1;
}

.section-title {
  margin: 24px 0 10px;
  color: var(--arek-text-strong);
  font-size: 18px;
  font-weight: 700;
}

.news-grid {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.news-card {
  border: 1px solid var(--arek-border);
  border-radius: 10px;
  background: #ffffff;
  padding: 12px 14px;
}

.news-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--arek-text-strong);
  font-weight: 700;
}

.news-card p {
  margin: 6px 0;
  font-size: 13px;
  color: var(--arek-text-body);
  font-weight: 500;
}

.message {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.message.info {
  background: #eff6ff;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
}

.result {
  margin-top: 12px;
  text-align: left;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .welcome-panel {
    grid-template-columns: 1fr;
  }

  .welcome-title {
    font-size: 34px;
  }

  .welcome-subtitle {
    font-size: 18px;
  }

  .search-grid {
    grid-template-columns: 1fr;
  }

  .welcome-right {
    flex-direction: column;
    gap: 26px;
  }

  .hero-arrow {
    position: static;
    transform: rotate(90deg);
    margin-top: -6px;
  }

  .view-title {
    font-size: 28px;
  }

  .search-actions {
    justify-content: flex-start;
  }

  .module-grid {
    grid-template-columns: 1fr 1fr;
  }

  .news-grid {
    grid-template-columns: 1fr;
  }
}
</style>
