<template>
  <div class="page">
    <topleader />

    <main class="taxa-shell">
      <section
        v-for="section in sectionList"
        :key="section.key"
        class="taxa-card"
      >
        <div class="taxa-title-bar">
          <h1>{{ section.title }}</h1>
        </div>

        <div v-if="section.loading" class="state">Loading taxa results...</div>
        <div v-else-if="section.error" class="state error">{{ section.error }}</div>
        <template v-else>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="header in visibleHeaders(section)" :key="header">{{ header }}</th>
                  <th>Figure</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!section.rows.length">
                  <td :colspan="visibleHeaders(section).length + 1">No rows loaded.</td>
                </tr>
                <tr v-for="(row, rowIndex) in section.rows" :key="`${section.key}-${section.page}-${rowIndex}`">
                  <td v-for="header in visibleHeaders(section)" :key="header">
                    {{ cellValue(section, row, header) }}
                  </td>
                  <td class="figure-cell">
                    <button
                      v-if="rowFigure(row) && !isMissingFigure(rowFigure(row))"
                      type="button"
                      class="figure-button"
                      @click="toggleFigure(rowFigure(row))"
                    >
                      <img
                        :src="imageSrc(rowFigure(row))"
                        :alt="taxonDisplayName(section, row)"
                        @error="markMissingFigure(rowFigure(row))"
                      />
                    </button>
                    <span v-else class="no-figure">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pager">
            <button
              type="button"
              class="pager-btn"
              :disabled="section.loading || section.page <= 1"
              @click="setPage(section, section.page - 1)"
            >
              Prev
            </button>
            <span class="pager-text">Page {{ section.page }} / {{ section.totalPages }} - {{ section.totalRows }} rows</span>
            <button
              type="button"
              class="pager-btn"
              :disabled="section.loading || section.page >= section.totalPages"
              @click="setPage(section, section.page + 1)"
            >
              Next
            </button>
          </div>
        </template>
      </section>
    </main>

    <div
      v-if="lightboxFigure"
      class="image-lightbox"
      role="dialog"
      aria-modal="true"
      @click="closeLightbox"
    >
      <button type="button" class="lightbox-close" aria-label="Close image preview" @click.stop="closeLightbox">
        Close
      </button>
      <img
        class="lightbox-image"
        :src="imageSrc(lightboxFigure)"
        :alt="lightboxFigure.fileName"
        @click.stop="closeLightbox"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { API_ENDPOINTS, PUBLIC_BASE_URL } from '@/constants';
import topleader from '@/components/topleader.vue';
import apiRequest from '@/utils/api';

const pageSize = 10;

const createSection = ({ key, title, endpoint }) => ({
  key,
  title,
  endpoint,
  loading: false,
  error: '',
  headers: [],
  rows: [],
  page: 1,
  totalRows: 0,
  totalPages: 1
});

const sections = reactive({
  differential: createSection({
    key: 'differential',
    title: 'Differential Taxa Statistics',
    endpoint: API_ENDPOINTS.TAXA_DIFFERENTIAL_STATISTICS
  }),
  correlation: createSection({
    key: 'correlation',
    title: 'Correlation Taxa Statistics',
    endpoint: API_ENDPOINTS.TAXA_CORRELATION_STATISTICS
  })
});

const lightboxFigure = ref(null);
const missingFigures = ref(new Set());

const sectionList = computed(() => [sections.differential, sections.correlation]);
const publicBase = computed(() => (PUBLIC_BASE_URL || '/').replace(/\/$/, ''));

const normalize = (value) => (value ?? '').toString().trim();
const lowerText = (value) => normalize(value).toLowerCase();
const visibleHeaders = (section) => section.headers.filter((header) => lowerText(header) !== 'source_file');

const loadSection = async (section, nextPage = section.page) => {
  section.loading = true;
  section.error = '';

  try {
    const resp = await apiRequest.get(section.endpoint, {
      page: nextPage,
      pageSize
    });

    const data = resp.data || {};
    section.headers = data.headers || [];
    section.rows = data.rows || [];
    section.page = data.page || nextPage;
    section.totalRows = data.total || 0;
    section.totalPages = data.totalPages || 1;
  } catch (err) {
    section.error = err?.response?.data?.error?.message || err.message || 'Failed to load taxa table.';
  } finally {
    section.loading = false;
  }
};

const setPage = (section, nextPage) => {
  const normalizedPage = Math.min(Math.max(Number(nextPage) || 1, 1), section.totalPages || 1);
  if (normalizedPage === section.page) return;
  loadSection(section, normalizedPage);
};

const taxonHeader = (section) => (
  section.headers.find((header) => lowerText(header) === 'taxon')
  || section.headers.find((header) => lowerText(header).includes('taxon'))
  || 'taxon'
);

const taxonDisplayName = (section, row) => {
  const rawTaxon = normalize(row?.[taxonHeader(section)]);
  if (!rawTaxon) return '';
  return rawTaxon.includes(':') ? rawTaxon.split(':').pop().trim() : rawTaxon;
};

const cellValue = (section, row, header) => (
  header === taxonHeader(section)
    ? taxonDisplayName(section, row)
    : normalize(row?.[header])
);

const rowFigure = (row) => (row?.figure?.publicPath ? row.figure : null);

const figureKeyValue = (figure) => figure?.publicPath || figure?.fileName || '';

const imageSrc = (figure) => `${publicBase.value}/${figure.publicPath.split('/').map(encodeURIComponent).join('/')}`;

const isMissingFigure = (figure) => missingFigures.value.has(figureKeyValue(figure));

const markMissingFigure = (figure) => {
  const key = figureKeyValue(figure);
  if (!key) return;
  const next = new Set(missingFigures.value);
  next.add(key);
  missingFigures.value = next;
};

const toggleFigure = (figure) => {
  if (!figure) return;
  const currentKey = figureKeyValue(lightboxFigure.value);
  const nextKey = figureKeyValue(figure);
  lightboxFigure.value = currentKey === nextKey ? null : figure;
};

const closeLightbox = () => {
  lightboxFigure.value = null;
};

onMounted(() => {
  sectionList.value.forEach((section) => loadSection(section));
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fb;
}

.taxa-shell {
  display: grid;
  gap: 24px;
  padding: 24px;
  font-family: var(--arek-font);
}

.taxa-card {
  display: grid;
  gap: 18px;
  border: 1px solid var(--arek-border);
  border-radius: 8px;
  background: #ffffff;
  padding: 22px;
}

.taxa-title-bar {
  background: #67679d;
  border-radius: 2px;
  color: #ffffff;
  padding: 12px 14px;
}

.taxa-title-bar h1 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  line-height: 1.25;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  min-width: 1200px;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #eef2f7;
  padding: 8px 10px;
  color: #1f2937;
  line-height: 1.35;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

.data-table th {
  background: #f8fafc;
  color: var(--arek-text-strong);
  font-size: 16px;
  font-weight: 800;
}

.data-table td {
  font-size: 14px;
}

.data-table th:last-child,
.data-table td:last-child {
  border-right: 0;
}

.data-table tr:last-child td {
  border-bottom: 0;
}

.figure-cell {
  min-width: 170px;
}

.figure-button {
  width: 160px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  cursor: zoom-in;
  padding: 0;
  overflow: hidden;
}

.figure-button img {
  display: block;
  width: 100%;
  height: auto;
}

.no-figure {
  color: var(--arek-text-muted);
  font-weight: 700;
}

.pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
}

.pager-btn {
  border: 1px solid var(--arek-border);
  border-radius: 6px;
  background: #ffffff;
  color: var(--arek-text-strong);
  cursor: pointer;
  font-weight: 700;
  padding: 6px 12px;
}

.pager-btn:disabled {
  color: #a0a8b6;
  cursor: not-allowed;
}

.pager-text {
  color: var(--arek-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.state {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: var(--arek-text-muted);
  padding: 14px;
  font-weight: 600;
}

.state.error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.image-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.88);
  padding: 5vh 5vw;
  cursor: zoom-out;
}

.lightbox-image {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
}

.lightbox-close {
  position: fixed;
  top: 22px;
  right: 26px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  padding: 10px 14px;
}

.lightbox-close:hover {
  background: rgba(37, 99, 235, 0.9);
}
</style>
