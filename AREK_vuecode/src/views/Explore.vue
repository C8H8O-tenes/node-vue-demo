<template>
  <div class="page">
    <topleader />

    <main class="explore">
      <section class="card">
        <div class="page-head">
          <h1>Explore</h1>
        </div>

        <div class="search-panel">
          <div
            v-for="group in searchGroups"
            :key="group.id"
            class="search-grid"
          >
            <div class="view-title">{{ group.title }}</div>

            <label class="field">
              <span class="field-label">{{ filterLabels.studyNr }}</span>
              <select v-model="group.filters.studyNr" class="field-input">
                <option value="">All</option>
                <option v-for="item in studyNrOptions" :key="`${group.id}-nr-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.subject }}</span>
              <select v-model="group.filters.subject" class="field-input">
                <option value="">All</option>
                <option v-for="item in subjectOptions" :key="`${group.id}-sub-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">{{ filterLabels.sampleType }}</span>
              <select v-model="group.filters.sampleType" class="field-input">
                <option value="">All</option>
                <option v-for="item in sampleTypeOptions" :key="`${group.id}-sample-${item}`" :value="item">{{ item }}</option>
              </select>
            </label>

            <div class="search-actions">
              <button type="button" class="go-btn" @click="goToDetail(group.filters)">Search</button>
              <button type="button" class="clear-btn" @click="clearFilters(group.filters)">Clear</button>
            </div>
          </div>
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
const message = ref('');
const messageType = ref('info');
const filterLabels = ref({
  studyNr: 'AREK Study Nr.',
  subject: 'Study subject',
  sampleType: 'Sample type'
});
const filtersData = ref({ studyNr: '', subject: '', sampleType: '' });
const filtersBiology = ref({ studyNr: '', subject: '', sampleType: '' });
const filtersOutcome = ref({ studyNr: '', subject: '', sampleType: '' });
const studyNrOptions = ref([]);
const subjectOptions = ref([]);
const sampleTypeOptions = ref([]);

const searchGroups = [
  { id: 'data', title: 'View by Data', filters: filtersData.value },
  { id: 'biology', title: 'View by Biology', filters: filtersBiology.value },
  { id: 'outcome', title: 'View by Outcome', filters: filtersOutcome.value }
];

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
    messageType.value = 'error';
    message.value = error?.response?.data?.error?.message || error.message || 'Failed to load summary filter options';
  }
};

const goToDetail = (targetFilters) => {
  router.push({
    name: 'quicksearch',
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
};

onMounted(() => {
  loadSummaryFilterOptions();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #d8dde3;
}

.explore {
  min-height: calc(100vh - 76px);
  background: #f5f7fb;
  padding: 24px;
  font-family: var(--arek-font);
}

.card {
  width: min(1200px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid var(--arek-border);
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

h1 {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 32px;
  line-height: 1.2;
}

.search-panel {
  border: 1px solid var(--arek-border);
  border-radius: 10px;
  background: #f8fafc;
  padding: 10px 12px;
}

.search-grid {
  display: grid;
  grid-template-columns: 220px 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  padding: 10px 6px;
}

.search-grid + .search-grid {
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

.go-btn,
.clear-btn {
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 20px;
}

.go-btn {
  border: 1px solid var(--arek-blue);
  background: var(--arek-blue);
  color: #fff;
}

.go-btn:hover {
  background: var(--arek-blue-deep);
}

.clear-btn {
  border: 1px solid var(--arek-border);
  background: #fff;
  color: var(--arek-text-body);
}

.message {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

@media (max-width: 900px) {
  .search-grid {
    grid-template-columns: 1fr;
  }
}
</style>
