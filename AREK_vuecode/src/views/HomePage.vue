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

        <form class="home-search" @submit.prevent="goToFirstSearchResult">
          <select v-model="homeSearch.sampleType" class="sample-select" aria-label="Sample type">
            <option value="">All sample types</option>
            <option v-for="item in sampleTypeOptions" :key="`home-sample-${item}`" :value="item">{{ item }}</option>
          </select>

          <input
            v-model="homeSearch.keyword"
            class="keyword-input"
            type="search"
            placeholder="Search AREK datasets"
            aria-label="Search all summary dataset information"
          />

          <button type="submit" class="home-search-btn" :disabled="searchLoading">
            Search
          </button>
        </form>

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
const searchLoading = ref(false);
const homeSearch = ref({
  sampleType: '',
  keyword: ''
});
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

const setResult = (type, text) => {
  messageType.value = type;
  message.value = text;
};

const loadSummaryFilterOptions = async () => {
  try {
    const resp = await apiRequest.get(API_ENDPOINTS.SUMMARY_FILTER_OPTIONS);
    const data = resp?.data || {};
    const options = data.options || {};
    sampleTypeOptions.value = options.sampleType || [];
  } catch (error) {
    setResult(
      'error',
      error?.response?.data?.error?.message || error.message || 'Failed to load summary filter options'
    );
  }
};

onMounted(() => {
  loadSummaryFilterOptions();
});

const goToFirstSearchResult = async () => {
  searchLoading.value = true;
  message.value = '';

  try {
    const resp = await apiRequest.get(API_ENDPOINTS.SUMMARY_SEARCH, {
      sampleType: homeSearch.value.sampleType || undefined,
      keyword: homeSearch.value.keyword || undefined
    });
    const first = resp?.data?.first;

    if (!first?.datasetId) {
      setResult('error', 'No matching dataset found.');
      return;
    }

    router.push({
      name: 'result',
      params: {
        datasetId: first.datasetId
      },
      query: {
        studyNr: first.studyNr || undefined,
        subject: first.subject || undefined,
        sampleType: first.sampleType || undefined
      }
    });
  } catch (error) {
    setResult('error', error?.response?.data?.error?.message || error.message || 'Search failed');
  } finally {
    searchLoading.value = false;
  }
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

.home-search {
  margin-top: 14px;
  border: 1px solid var(--arek-border);
  border-radius: 10px;
  background: #ffffff;
  display: grid;
  grid-template-columns: minmax(180px, 20%) minmax(0, 1fr) auto;
  overflow: hidden;
}

.sample-select,
.keyword-input {
  min-width: 0;
  border: 0;
  border-right: 1px solid var(--arek-border);
  background: #ffffff;
  color: var(--arek-text-strong);
  font-size: 15px;
  padding: 15px 16px;
  outline: none;
}

.keyword-input {
  width: 100%;
}

.sample-select:focus,
.keyword-input:focus {
  box-shadow: inset 0 0 0 2px var(--arek-blue-soft);
}

.home-search-btn {
  border: 0;
  background: var(--arek-blue);
  color: #fff;
  cursor: pointer;
  font-weight: 700;
  padding: 0 24px;
  white-space: nowrap;
}

.home-search-btn:hover {
  background: var(--arek-blue-deep);
}

.home-search-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
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

  .home-search {
    grid-template-columns: 1fr;
  }

  .sample-select,
  .keyword-input {
    border-right: 0;
    border-bottom: 1px solid var(--arek-border);
  }

  .home-search-btn {
    min-height: 48px;
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

  .module-grid {
    grid-template-columns: 1fr 1fr;
  }

  .news-grid {
    grid-template-columns: 1fr;
  }
}
</style>
