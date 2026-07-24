<template>
  <div class="page">
    <topleader />

    <main class="result-shell">
      <aside class="side-nav" aria-label="Result section navigation">
        <div class="dataset-id">{{ datasetId || 'No dataset' }}</div>
        <a class="nav-item root-link" href="#dataset_infor">dataset_infor</a>

        <div v-for="taxLevel in taxonomyLevels" :key="taxLevel" class="nav-group">
          <button
            type="button"
            class="nav-group-title"
            :class="{ active: activeTaxLevel === taxLevel, disabled: !isTaxLevelAvailable(taxLevel) }"
            :disabled="!isTaxLevelAvailable(taxLevel)"
            @click="setActiveTaxLevel(taxLevel)"
          >
            {{ taxLevel }}
          </button>
          <button
            v-for="section in displayedSections"
            :key="`${taxLevel}-${section.id}`"
            type="button"
            class="nav-subitem"
            :disabled="!isTaxLevelAvailable(taxLevel)"
            @click="jumpToSection(taxLevel, section.id)"
          >
            {{ section.label }}
          </button>
        </div>
      </aside>

      <section class="content">
        <section id="dataset_infor" class="result-section">
          <div class="section-head">
            <h1>dataset_infor</h1>
            <span class="source">summary_dataset_infor</span>
          </div>

          <div v-if="loading" class="state">Loading dataset information...</div>
          <div v-else-if="error" class="state error">{{ error }}</div>
          <div v-else-if="datasetFields.length" class="dataset-grid">
            <div
              v-for="field in datasetFields"
              :key="field.key"
              class="info-row"
            >
              <div class="info-key">{{ field.key }}</div>
              <div class="info-value">{{ field.value || '-' }}</div>
            </div>
          </div>
          <div v-else class="state">No dataset information loaded.</div>
        </section>

        <div class="tabs" role="tablist" aria-label="Taxonomy levels">
          <button
            v-for="taxLevel in taxonomyLevels"
            :key="taxLevel"
            type="button"
            class="tab-btn"
            :class="{ active: activeTaxLevel === taxLevel, disabled: !isTaxLevelAvailable(taxLevel) }"
            :disabled="!isTaxLevelAvailable(taxLevel)"
            @click="setActiveTaxLevel(taxLevel)"
          >
            {{ taxLevel }}
          </button>
        </div>

        <section class="taxonomy-panel">
          <section
            v-for="section in displayedSections"
            :id="sectionId(activeTaxLevel, section.id)"
            :key="`${activeTaxLevel}-${section.id}`"
            :ref="(el) => setSectionElement(section.id, el)"
            class="result-section analysis-section"
          >
            <div class="section-head">
              <h2>{{ section.label }}</h2>
              <span class="source">{{ activeTaxLevel }}</span>
            </div>

            <template v-if="section.asset">
              <div v-if="section.asset.tables.length" class="table-stack">
                <article
                  v-for="table in section.asset.tables"
                  :key="table.fileName"
                  class="data-table-card"
                >
                  <h3>{{ table.fileName }}</h3>
                  <div class="table-wrap">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <th v-for="header in table.headers" :key="header">{{ header || '(blank)' }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-if="!table.rows.length">
                          <td :colspan="Math.max(table.headers.length, 1)">No rows in this table.</td>
                        </tr>
                        <tr v-for="(row, rowIndex) in table.rows" :key="rowIndex">
                          <td v-for="header in table.headers" :key="`${rowIndex}-${header}`">
                            {{ cellValue(row, header, table.headers[0]) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-if="table.page > 1 || table.hasMore || table.pageLoading" class="pager">
                    <button
                      type="button"
                      class="pager-btn"
                      :disabled="table.page <= 1 || table.pageLoading"
                      @click="loadTablePage(section.id, table, table.page - 1)"
                    >
                      Prev
                    </button>
                    <span class="pager-text">
                      Page {{ table.page }}
                    </span>
                    <button
                      type="button"
                      class="pager-btn"
                      :disabled="!table.hasMore || table.pageLoading"
                      @click="loadTablePage(section.id, table, table.page + 1)"
                    >
                      Next
                    </button>
                  </div>
                </article>
              </div>
              <div v-else-if="section.asset.tablesError" class="state error">{{ section.asset.tablesError }}</div>
              <div v-else-if="section.asset.tablesLoaded" class="state">No {{ section.label }} tables found for {{ activeTaxLevel }}.</div>

              <div class="figure-block">
                <h3>{{ section.label }} figures</h3>
                <div v-if="section.asset.figures.length" class="figure-stack">
                  <figure
                    v-for="figure in section.asset.figures"
                    :key="figure.fileName"
                    class="figure-card"
                  >
                    <button
                      type="button"
                      class="figure-button"
                      :class="{ expanded: expandedFigureKey === figureKeyValue(figure) }"
                      @click="toggleFigure(figure)"
                    >
                      <img :src="imageSrc(figure)" :alt="figure.fileName" />
                    </button>
                    <figcaption>{{ figure.fileName }}</figcaption>
                  </figure>
                </div>
                <div v-else-if="section.asset.figuresError" class="state error">{{ section.asset.figuresError }}</div>
                <div v-else-if="section.asset.figuresLoaded" class="state">No figures found.</div>
              </div>
            </template>
          </section>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants';
import { apiRequest } from '@/utils/api';
import topleader from '@/components/topleader.vue';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const datasetRow = ref({});
const activeTaxLevel = ref('Phylum');
const taxLevelAvailability = ref({});
const sectionAssets = ref({});
const expandedFigureKey = ref('');
const activeAssetRequestId = ref(0);
const loadedSectionIds = ref({});
const sectionElements = new Map();
let sectionObserver = null;
const pageSize = 10;

const taxonomyLevels = ['Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'];
const analysisSections = [
  { id: 'QC', label: 'QC', keyword: 'QC' },
  { id: 'DIVERSITY', label: 'DIVERSITY', keyword: 'DIVERSITY' },
  { id: 'DIFFERENTIAL', label: 'DIFFERENTIAL', keyword: 'DIFFERENTIAL' },
  { id: 'regression', label: 'regression', keyword: 'ALCOHOL_REGRESSION' },
  { id: 'ASSOCIATION', label: 'ASSOCIATION', keyword: 'OTHER_METADATA_ASSOCIATION' },
  { id: 'CORRELATION', label: 'CORRELATION', keyword: 'CORRELATION' }
];

const createEmptySectionState = () => ({
  tables: [],
  tableFilesLoaded: false,
  tablesLoading: false,
  tablesError: '',
  tablesLoaded: false,
  figures: [],
  figuresLoading: false,
  figuresError: '',
  figuresLoaded: false
});
const displayedSections = ref([]);

const resetDisplayedSections = () => {
  const nextAssets = {};
  displayedSections.value = analysisSections.map((section) => {
    const asset = createEmptySectionState();
    nextAssets[section.id] = asset;
    return {
      ...section,
      asset
    };
  });
  sectionAssets.value = nextAssets;
};

resetDisplayedSections();

const normalize = (value) => (value ?? '').toString().trim();
const encodePathPart = (value) => encodeURIComponent(value);
const apiBase = computed(() => (API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL));
const FETCH_TIMEOUT_MS = 30000;
const DEBUG_RESULT_ASSETS = false;

const fetchJson = async (endpoint, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.set(key, value);
  });

  const url = `${apiBase.value}${endpoint}${query.toString() ? `?${query.toString()}` : ''}`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  let payload;

  try {
    response = await fetch(url, { signal: controller.signal });
    payload = await response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s: ${endpoint}`);
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error?.message || `Request failed: ${response.status}`);
  }

  return payload;
};

const datasetId = computed(() => {
  const fromParam = normalize(route.params.datasetId);
  const fromQuery = normalize(route.query.datasetId || route.query.studyId);
  return fromParam || fromQuery;
});

const datasetFields = computed(() =>
  Object.entries(datasetRow.value).map(([key, value]) => ({
    key,
    value: normalize(value)
  }))
);

const isTaxLevelAvailable = (taxLevel) => {
  const availability = taxLevelAvailability.value[taxLevel];
  return availability === undefined ? true : Boolean(availability);
};

const firstAvailableTaxLevel = () => taxonomyLevels.find((taxLevel) => isTaxLevelAvailable(taxLevel)) || taxonomyLevels[0];

const sectionId = (taxLevel, sectionIdValue) => `${taxLevel}-${sectionIdValue}`;
const publicBase = computed(() => process.env.BASE_URL || '/');
const sectionState = (sectionIdValue) => sectionAssets.value[sectionIdValue] || createEmptySectionState();

const setSectionElement = (sectionIdValue, el) => {
  if (el) {
    sectionElements.set(sectionIdValue, el);
  } else {
    sectionElements.delete(sectionIdValue);
  }
};

const imageSrc = (figure) => {
  const base = publicBase.value.endsWith('/') ? publicBase.value : `${publicBase.value}/`;
  return `${base}${figure.publicPath}`;
};

const cellValue = (row, header, firstHeader) => {
  if (row && typeof row === 'object') return row[header] ?? '';
  return header === firstHeader ? row : '';
};

const toggleFigure = (figure) => {
  const key = figureKeyValue(figure);
  expandedFigureKey.value = expandedFigureKey.value === key ? '' : key;
};

const figureKeyValue = (figure) => figure.publicPath || figure.fileName;

const loadDatasetInfo = async () => {
  if (!datasetId.value) {
    error.value = 'Missing PRJ dataset id in browser path.';
    datasetRow.value = {};
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const resp = await apiRequest.get(`${API_ENDPOINTS.DATASET_INFO}/${encodePathPart(datasetId.value)}`);
    datasetRow.value = resp?.data?.row || {};
  } catch (err) {
    error.value = err?.response?.data?.error?.message || err.message || 'Failed to load dataset information';
    datasetRow.value = {};
  } finally {
    loading.value = false;
  }
};

const loadTaxLevelAvailability = async () => {
  if (!datasetId.value) return;

  try {
    const resp = await fetchJson(`${API_ENDPOINTS.RESULT_ASSET_AVAILABILITY}/${encodePathPart(datasetId.value)}`);
    const levels = resp?.data?.levels || [];
    taxLevelAvailability.value = levels.reduce((availability, item) => {
      availability[item.taxLevel] = Boolean(item.available);
      return availability;
    }, {});

    if (!isTaxLevelAvailable(activeTaxLevel.value)) {
      activeTaxLevel.value = firstAvailableTaxLevel();
    }
  } catch (err) {
    taxLevelAvailability.value = {};
  }
};

const updateSectionState = (sectionIdValue, patch, requestId = activeAssetRequestId.value) => {
  if (activeAssetRequestId.value !== requestId) {
    if (DEBUG_RESULT_ASSETS) {
      console.log('[result assets] ignore stale update', {
        requestId,
        activeRequestId: activeAssetRequestId.value,
        section: sectionIdValue,
        patch
      });
    }
    return;
  }

  const nextAsset = {
    ...sectionState(sectionIdValue),
    ...patch
  };
  sectionAssets.value = {
    ...sectionAssets.value,
    [sectionIdValue]: nextAsset
  };
  displayedSections.value = displayedSections.value.map((section) => (
    section.id === sectionIdValue
      ? { ...section, asset: nextAsset }
      : section
  ));
};

const updateTableState = (sectionIdValue, fileName, patch, requestId = activeAssetRequestId.value) => {
  const currentTables = sectionState(sectionIdValue).tables || [];
  updateSectionState(sectionIdValue, {
    tables: currentTables.map((table) => (
      table.fileName === fileName
        ? { ...table, ...patch }
        : table
    ))
  }, requestId);
};

const loadTablePage = async (sectionIdValue, table, page) => {
  const requestId = activeAssetRequestId.value;
  const safePage = Math.max(Number(page) || 1, 1);
  const taxLevel = activeTaxLevel.value;
  const commonPath = `${encodePathPart(datasetId.value)}/${encodePathPart(taxLevel)}`;

  updateTableState(sectionIdValue, table.fileName, { pageLoading: true }, requestId);

  try {
    const resp = await fetchJson(
      `${API_ENDPOINTS.RESULT_TABLE_PAGE}/${commonPath}/${encodePathPart(table.fileName)}`,
      { page: safePage, pageSize }
    );
    const pageData = resp?.data || {};

    updateTableState(sectionIdValue, table.fileName, {
      headers: pageData.headers || [],
      rows: pageData.rows || [],
      page: pageData.page || safePage,
      pageSize: pageData.pageSize || pageSize,
      hasMore: Boolean(pageData.hasMore),
      pageLoading: false,
      pageError: ''
    }, requestId);
  } catch (err) {
    updateTableState(sectionIdValue, table.fileName, {
      pageLoading: false,
      pageError: err?.response?.data?.error?.message || err.message || 'Failed to load table page'
    }, requestId);
  }
};

const loadSectionAssets = async (sectionIdValue, taxLevel = activeTaxLevel.value, requestId = activeAssetRequestId.value) => {
  const section = analysisSections.find((item) => item.id === sectionIdValue);

  if (!datasetId.value || !section || loadedSectionIds.value[sectionIdValue]) return;

  loadedSectionIds.value = {
    ...loadedSectionIds.value,
    [sectionIdValue]: true
  };

  const commonPath = `${encodePathPart(datasetId.value)}/${encodePathPart(taxLevel)}`;
  updateSectionState(section.id, { tablesLoading: true, figuresLoading: true }, requestId);

  const loadTableFiles = fetchJson(
    `${API_ENDPOINTS.RESULT_TABLE_FILES}/${commonPath}`,
    { keyword: section.keyword }
  )
    .then(async (resp) => {
      const files = resp?.data?.files || [];
      if (DEBUG_RESULT_ASSETS) {
        console.log('[result table files]', {
          requestId,
          taxLevel,
          section: section.id,
          keyword: section.keyword,
          count: files.length,
          files
        });
      }

      if (!files.length) {
        updateSectionState(section.id, { tablesLoaded: true, tablesLoading: false }, requestId);
        return;
      }

      updateSectionState(section.id, {
        tables: files.map((file) => ({
          fileName: file.fileName,
          headers: [],
          rows: [],
          page: 1,
          pageSize,
          hasMore: false,
          pageLoading: true,
          pageError: ''
        })),
        tableFilesLoaded: true
      }, requestId);

      for (const file of files) {
        if (activeAssetRequestId.value !== requestId) return;
        await loadTablePage(section.id, { fileName: file.fileName }, 1);
      }

      updateSectionState(section.id, { tablesLoaded: true, tablesLoading: false }, requestId);
    })
    .catch((err) => {
      if (DEBUG_RESULT_ASSETS) {
        console.error('[result table files] error', {
          requestId,
          taxLevel,
          section: section.id,
          keyword: section.keyword,
          error: err
        });
      }
      updateSectionState(section.id, {
        tablesError: err?.response?.data?.error?.message || err.message || `Failed to load ${section.label} tables`,
        tablesLoaded: true,
        tablesLoading: false
      }, requestId);
    });

  const loadFigures = fetchJson(
    `${API_ENDPOINTS.RESULT_FIGURES}/${commonPath}`,
    { keyword: section.keyword }
  )
    .then((resp) => {
      const figures = resp?.data?.figures || [];
      if (DEBUG_RESULT_ASSETS) {
        console.log('[result figures]', {
          requestId,
          taxLevel,
          section: section.id,
          keyword: section.keyword,
          count: figures.length,
          figures
        });
      }
      updateSectionState(section.id, { figures }, requestId);
    })
    .catch((err) => {
      if (DEBUG_RESULT_ASSETS) {
        console.error('[result figures] error', {
          requestId,
          taxLevel,
          section: section.id,
          keyword: section.keyword,
          error: err
        });
      }
      updateSectionState(section.id, {
        figuresError: err?.response?.data?.error?.message || err.message || `Failed to load ${section.label} figures`
      }, requestId);
    })
    .finally(() => {
      updateSectionState(section.id, { figuresLoaded: true, figuresLoading: false }, requestId);
    });

  await Promise.allSettled([loadTableFiles, loadFigures]);
};

const setupSectionObserver = () => {
  if (sectionObserver) sectionObserver.disconnect();

  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const sectionIdValue = entry.target?.dataset?.sectionId;
      if (sectionIdValue) {
        loadSectionAssets(sectionIdValue);
      }
    });
  }, {
    rootMargin: '300px 0px'
  });

  sectionElements.forEach((el, sectionIdValue) => {
    el.dataset.sectionId = sectionIdValue;
    sectionObserver.observe(el);
  });
};

const loadActiveTaxLevelAssets = async (taxLevel = activeTaxLevel.value) => {
  if (!datasetId.value) return;

  const requestId = activeAssetRequestId.value + 1;
  activeAssetRequestId.value = requestId;
  loadedSectionIds.value = {};
  expandedFigureKey.value = '';
  resetDisplayedSections();

  if (DEBUG_RESULT_ASSETS) {
    console.log('[result assets] start', {
      requestId,
      datasetId: datasetId.value,
      taxLevel
    });
  }

  await nextTick();
  setupSectionObserver();
  loadSectionAssets('QC', taxLevel, requestId);
};

const setActiveTaxLevel = (taxLevel) => {
  if (!isTaxLevelAvailable(taxLevel)) return;
  activeTaxLevel.value = taxLevel;
};

const jumpToSection = async (taxLevel, targetSectionId) => {
  if (!isTaxLevelAvailable(taxLevel)) return;
  activeTaxLevel.value = taxLevel;
  await nextTick();
  loadSectionAssets(targetSectionId, taxLevel, activeAssetRequestId.value);
  document.getElementById(sectionId(taxLevel, targetSectionId))?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
};

onMounted(() => {
  loadDatasetInfo();
  loadTaxLevelAvailability();
  loadActiveTaxLevelAssets();
});

watch(datasetId, () => {
  datasetRow.value = {};
  sectionAssets.value = {};
  taxLevelAvailability.value = {};
  expandedFigureKey.value = '';
  loadDatasetInfo();
  loadTaxLevelAvailability();
  loadActiveTaxLevelAssets();
});

watch(activeTaxLevel, (taxLevel) => {
  expandedFigureKey.value = '';
  loadActiveTaxLevelAssets(taxLevel);
});

onBeforeUnmount(() => {
  if (sectionObserver) sectionObserver.disconnect();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #d8dde3;
}

.result-shell {
  min-height: calc(100vh - 76px);
  display: grid;
  grid-template-columns: minmax(180px, 20%) minmax(0, 80%);
  gap: 0;
  background: #f5f7fb;
  font-family: var(--arek-font);
}

.side-nav {
  position: sticky;
  top: 0;
  align-self: start;
  max-height: 100vh;
  overflow: auto;
  border-right: 1px solid var(--arek-border);
  background: #ffffff;
  padding: 24px 18px;
}

.dataset-id {
  margin-bottom: 12px;
  color: var(--arek-blue-deep);
  font-size: 18px;
  font-weight: 800;
  word-break: break-word;
}

.nav-item,
.nav-group-title,
.nav-subitem {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.nav-item {
  display: block;
  box-sizing: border-box;
  border-left: 3px solid transparent;
  color: var(--arek-text-body);
  text-decoration: none;
  font-weight: 800;
  padding: 10px 10px 10px 12px;
}

.root-link {
  margin-bottom: 12px;
}

.nav-group {
  border-top: 1px solid #edf1f7;
  padding: 10px 0;
}

.nav-group-title {
  color: var(--arek-text-strong);
  font-size: 15px;
  font-weight: 800;
  padding: 8px 10px;
}

.nav-group-title.active {
  color: var(--arek-blue-deep);
  background: #eef6fb;
}

.nav-group-title.disabled,
.nav-subitem:disabled,
.tab-btn.disabled {
  color: #a0a8b6;
  background: #f1f5f9;
  cursor: not-allowed;
}

.nav-subitem {
  color: var(--arek-text-muted);
  font-size: 13px;
  font-weight: 700;
  padding: 7px 10px 7px 22px;
}

.nav-item:hover,
.nav-group-title:hover,
.nav-subitem:hover {
  background: #f3f7fb;
  color: var(--arek-blue-deep);
}

.nav-group-title:disabled:hover,
.nav-subitem:disabled:hover {
  background: #f1f5f9;
  color: #a0a8b6;
}

.content {
  padding: 24px;
}

.result-section {
  scroll-margin-top: 20px;
  margin: 0 0 22px;
  border: 1px solid var(--arek-border);
  border-radius: 8px;
  background: #ffffff;
  padding: 22px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

h1,
h2 {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 24px;
  line-height: 1.2;
}

h3 {
  margin: 0 0 10px;
  color: var(--arek-text-strong);
  font-size: 15px;
  line-height: 1.35;
  word-break: break-word;
}

.source {
  color: var(--arek-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.dataset-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 14px;
}

.info-row {
  min-width: 0;
  border: 1px solid #e8edf5;
  border-radius: 8px;
  background: #fbfdff;
  padding: 10px 12px;
}

.info-key {
  color: var(--arek-text-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.info-value {
  margin-top: 5px;
  color: var(--arek-text-strong);
  font-size: 14px;
  line-height: 1.45;
  word-break: break-word;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 18px;
  border-bottom: 1px solid var(--arek-border);
}

.tab-btn {
  border: 1px solid var(--arek-border);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #ffffff;
  color: var(--arek-text-body);
  cursor: pointer;
  font-weight: 800;
  padding: 10px 18px;
}

.tab-btn.active {
  background: var(--arek-blue-deep);
  border-color: var(--arek-blue-deep);
  color: #ffffff;
}

.tab-btn.disabled {
  border-color: #d8dee8;
}

.tab-btn.disabled.active {
  background: #94a3b8;
  border-color: #94a3b8;
}

.taxonomy-panel {
  min-width: 0;
}

.analysis-section {
  min-height: 160px;
}

.table-stack {
  display: grid;
  gap: 18px;
  margin-bottom: 20px;
}

.data-table-card {
  min-width: 0;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.data-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #eef2f7;
  padding: 8px 10px;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.35;
  text-align: left;
  vertical-align: top;
  white-space: nowrap;
}

.data-table th {
  background: #f8fafc;
  color: var(--arek-text-strong);
  font-weight: 800;
}

.data-table th:last-child,
.data-table td:last-child {
  border-right: 0;
}

.data-table tr:last-child td {
  border-bottom: 0;
}

.pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
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

.figure-block {
  display: grid;
  gap: 14px;
}

.figure-block h3 {
  margin: 0 0 10px;
  color: var(--arek-text-strong);
  font-size: 15px;
  line-height: 1.35;
  word-break: break-word;
}

.figure-stack {
  display: grid;
  gap: 18px;
}

.figure-card {
  margin: 0;
  display: grid;
  justify-items: center;
  gap: 8px;
}

.figure-button {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  cursor: zoom-in;
  padding: 14px;
}

.figure-button img {
  display: block;
  width: 50%;
  height: auto;
  margin: 0 auto;
}

.figure-button.expanded {
  cursor: zoom-out;
}

.figure-button.expanded img {
  width: min(100%, 1200px);
}

figcaption {
  color: var(--arek-text-muted);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
}

.state,
.placeholder {
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

@media (max-width: 860px) {
  .result-shell {
    grid-template-columns: 1fr;
  }

  .side-nav {
    position: static;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid var(--arek-border);
  }

  .dataset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
