<template>
  <div class="page">
    <topleader />

    <main class="home">
      <section class="card">
        <section class="welcome-panel">
          <div class="welcome-left">
            <h1 class="welcome-title">Welcome to AREK</h1>
            <p class="welcome-subtitle">Alcohol-related Enterotypes Knowledgebase</p>
            <ul class="welcome-list">
              <li>Query enterotypes across alcohol model studies</li>
              <li>Link microbes to metabolic and immune profiles</li>
              <li>Browse precomputed prediction results and key features</li>
            </ul>
          </div>
          <div class="welcome-right" aria-hidden="true"></div>
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
          <button v-for="index in 8" :key="`module-${index}`" type="button" class="module-card">
            module{{ index }}
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
  display: grid;
  place-items: center;
  background: #f5f7fb;
  padding: 24px;
}

.page {
  min-height: 100vh;
  background: #d8dde3;
}

.card {
  width: min(1200px, 100%);
  background: #ffffff;
  border: 1px solid #e6eaf2;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  text-align: left;
  font-family: 'Times New Roman', Times, serif;
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
  color: #0f2f57;
  font-size: 44px;
  line-height: 1.1;
}

.welcome-subtitle {
  margin: 8px 0 0;
  color: #374151;
  font-size: 20px;
}

.welcome-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.6;
}

.welcome-right {
  min-height: 150px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
}

.search-grid {
  display: grid;
  grid-template-columns: 220px 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.search-panel {
  margin-top: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px 12px;
  font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
}

.search-panel .search-grid {
  padding: 10px 6px;
}

.search-panel .search-grid + .search-grid {
  border-top: 1px solid #d1d5db;
}

.view-title {
  text-align: left;
  font-size: 20px;
  line-height: 1;
  font-weight: 600;
  color: #111827;
  align-self: center;
}

.field {
  display: grid;
  gap: 6px;
  text-align: left;
}

.field-label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
}

.field-input {
  width: 100%;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
}

.search-actions {
  display: flex;
  gap: 10px;
  align-items: end;
}

.go-btn {
  border: 1px solid #1d4ed8;
  background: #2563eb;
  color: #fff;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.go-btn:hover {
  background: #1d4ed8;
}

.clear-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
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
  min-height: 88px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
  text-transform: capitalize;
  cursor: pointer;
}

.module-card:hover {
  background: #f3f4f6;
}

.section-title {
  margin: 24px 0 10px;
  color: #111827;
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
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px 14px;
}

.news-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #111827;
}

.news-card p {
  margin: 6px 0;
  font-size: 13px;
  color: #374151;
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
