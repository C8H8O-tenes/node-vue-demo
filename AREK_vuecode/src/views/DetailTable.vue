<template>
  <div class="page">
    <topleader />

    <main class="wrap">
      <section class="card">
        <div class="head-row">
          <h1>Detail Table</h1>
          <button type="button" class="back-btn" @click="goBack">Back</button>
        </div>

        <div class="filters">
          <span><strong>AREK Study Nr.</strong>: {{ activeFilters.studyNr || 'All' }}</span>
          <span><strong>Study subject</strong>: {{ activeFilters.subject || 'All' }}</span>
          <span><strong>Sample type</strong>: {{ activeFilters.sampleType || 'All' }}</span>
        </div>

        <div v-if="loading" class="state">Loading table data...</div>
        <div v-else-if="error" class="state error">{{ error }}</div>
        <div v-else>
          <div class="summary">Total rows: {{ total }}</div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th v-for="(header, headerIndex) in headers" :key="`h-${headerIndex}`">{{ header || '(blank)' }}</th>
                  <th>Result Link</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!rows.length">
                  <td :colspan="Math.max(headers.length + 1, 1)">No data matched current filters.</td>
                </tr>
                <tr v-for="(row, index) in rows" :key="index">
                  <td v-for="(header, headerIndex) in headers" :key="`${index}-${headerIndex}`">
                    {{ row[header] ?? '' }}
                  </td>
                  <td>
                    <router-link :to="buildResultRoute(row)" class="detail-btn">
                      detail
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_ENDPOINTS } from '@/constants';
import { apiRequest } from '@/utils/api';
import topleader from '@/components/topleader.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const error = ref('');
const headers = ref([]);
const rows = ref([]);
const total = ref(0);

const activeFilters = computed(() => ({
  studyNr: route.query.studyNr || '',
  subject: route.query.subject || '',
  sampleType: route.query.sampleType || ''
}));

const normalize = (value) => (value ?? '').toString().trim();

const studyNrHeader = computed(() => headers.value[0] || '');
const subjectHeader = computed(() => headers.value[1] || '');
const sampleTypeHeader = computed(() =>
  headers.value.find((h) => normalize(h).toLowerCase().includes('sample type')) || headers.value[2] || ''
);

const buildQueryFromRow = (row) => ({
  studyNr: normalize(row[studyNrHeader.value]) || undefined,
  subject: normalize(row[subjectHeader.value]) || undefined,
  sampleType: normalize(row[sampleTypeHeader.value]) || undefined
});

const buildResultRoute = (row) => ({
  name: 'result',
  query: buildQueryFromRow(row)
});

const loadTable = async () => {
  loading.value = true;
  error.value = '';

  try {
    const resp = await apiRequest.get(API_ENDPOINTS.SUMMARY_DETAIL_TABLE, {
      studyNr: activeFilters.value.studyNr || undefined,
      subject: activeFilters.value.subject || undefined,
      sampleType: activeFilters.value.sampleType || undefined
    });

    const data = resp?.data || {};
    headers.value = Array.isArray(data.headers) ? data.headers : [];
    rows.value = Array.isArray(data.rows) ? data.rows : [];
    total.value = Number(data.total || 0);
  } catch (err) {
    error.value = err?.response?.data?.error?.message || err.message || 'Failed to load detail table';
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'homepage' });
};

onMounted(() => {
  loadTable();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #d8dde3;
}

.wrap {
  min-height: calc(100vh - 76px);
  background: #f5f7fb;
  padding: 24px;
}

.card {
  width: min(1400px, 100%);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e6eaf2;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

h1 {
  margin: 0;
  color: #111827;
}

.back-btn {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
}

.filters {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: #374151;
}

.state {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
}

.state.error {
  background: #fef2f2;
  color: #991b1b;
}

.summary {
  margin-top: 14px;
  color: #374151;
  font-weight: 600;
}

.table-wrap {
  margin-top: 10px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px;
}

.table th,
.table td {
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #f1f5f9;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
}

.table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  font-weight: 700;
}

.table th:last-child,
.table td:last-child {
  border-right: none;
}

.table tr:last-child td {
  border-bottom: none;
}

.detail-btn {
  display: inline-block;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 6px;
  padding: 4px 10px;
  text-transform: lowercase;
}

.detail-btn:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}
</style>
