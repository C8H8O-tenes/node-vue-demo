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
              <div v-if="field.href" class="info-value">
                <a class="processed-link" :href="field.href" target="_blank" rel="noopener noreferrer">
                  {{ field.value }}
                </a>
              </div>
              <div v-else class="info-value">{{ field.value || '-' }}</div>
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
            <div v-if="!['QC', 'DIVERSITY', 'DIFFERENTIAL', 'regression', 'ASSOCIATION'].includes(section.id)" class="section-head">
              <h2>{{ sectionTitle(section) }}</h2>
              <span class="source">{{ activeTaxLevel }}</span>
            </div>

            <template v-if="section.asset">
              <div v-if="section.id === 'DIFFERENTIAL'" class="figure-block differential-block">
                <div class="qc-title-bar analysis-title-bar">
                  <h2>Differentially Abundant Microbial Taxa</h2>
                </div>
                <div class="analysis-description">
                  <p>Identify microbial taxa with significantly different abundances between alcohol-consumption groups.</p>
                  <p>Threshold: p&lt;0.05.</p>
                </div>

                <div v-if="differentialTables(section).length" class="table-stack">
                  <article
                    v-for="table in differentialTables(section)"
                    :key="table.fileName"
                    class="data-table-card"
                  >
                    <h3>{{ table.fileName }}</h3>
                    <div class="table-wrap">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th v-for="header in table.headers" :key="header">{{ header || '(blank)' }}</th>
                            <th v-if="isDifferentialSignificantTable(table)">Figure</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!table.rows.length">
                            <td :colspan="Math.max(table.headers.length + (isDifferentialSignificantTable(table) ? 1 : 0), 1)">No rows in this table.</td>
                          </tr>
                          <tr v-for="(row, rowIndex) in table.rows" :key="rowIndex">
                            <td v-for="header in table.headers" :key="`${rowIndex}-${header}`">
                              {{ differentialCellValue(row, header, table) }}
                            </td>
                            <td v-if="isDifferentialSignificantTable(table)" class="microbe-figure-cell">
                              <button
                                v-if="differentialRowFigure(row, table)"
                                type="button"
                                class="figure-button microbe-thumb-button"
                                @click="toggleFigure(differentialRowFigure(row, table))"
                              >
                                <img :src="imageSrc(differentialRowFigure(row, table))" :alt="taxonDisplayName(row, table)" />
                              </button>
                              <span v-else class="no-figure">-</span>
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
                <div v-else-if="section.asset.tablesLoaded" class="state">No differential tables found for {{ activeTaxLevel }}.</div>
              </div>

              <div v-else-if="section.id === 'regression'" class="figure-block regression-block">
                <div class="qc-title-bar analysis-title-bar">
                  <h2>Microbial Taxa Associated with Alcohol-Related Variables</h2>
                </div>
                <div class="analysis-description">
                  <p>Identify microbial taxa associated with alcohol-related variables using regression models.</p>
                  <p>Model: Taxon abundance ~ Alcohol-related variable + Covariates</p>
                </div>

                <div v-if="regressionTables(section).length" class="table-stack">
                  <article
                    v-for="table in regressionTables(section)"
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
                <div v-else-if="section.asset.tablesLoaded" class="state">No regression tables found for {{ activeTaxLevel }}.</div>

                <div v-if="regressionFigures(section).length" class="figure-stack regression-figure-grid">
                  <figure
                    v-for="figure in regressionFigures(section)"
                    :key="figure.fileName"
                    class="figure-card regression-figure-card"
                  >
                    <button
                      type="button"
                      class="figure-button"
                      @click="toggleFigure(figure)"
                    >
                      <img :src="imageSrc(figure)" :alt="figure.fileName" />
                    </button>
                    <figcaption>{{ figure.fileName }}</figcaption>
                  </figure>
                </div>
                <div v-else-if="section.asset.figuresError" class="state error">{{ section.asset.figuresError }}</div>
                <div v-else-if="section.asset.figuresLoaded" class="state">No regression coefficient plots found.</div>
              </div>

              <div v-else-if="section.id === 'ASSOCIATION'" class="figure-block association-block">
                <div class="qc-title-bar analysis-title-bar">
                  <h2>Microbial Taxa Associated with clinical and demographic information</h2>
                </div>
                <div class="analysis-description">
                  <p>Identify taxa associated with clinical and demographic variables using multivariable regression and Spearman correlation.</p>
                  <p>Model: Taxon abundance ~ Variable of interest + All other covariates</p>
                  <p>Spearman threshold: p&lt;0.05</p>
                </div>

                <div class="analysis-subtabs" role="tablist" aria-label="Association analysis tabs">
                  <button
                    type="button"
                    class="analysis-subtab-btn"
                    :class="{ active: associationActiveTab === 'Regression' }"
                    @click="associationActiveTab = 'Regression'"
                  >
                    Regression
                  </button>
                  <button
                    type="button"
                    class="analysis-subtab-btn"
                    :class="{ active: associationActiveTab === 'Correlation' }"
                    @click="associationActiveTab = 'Correlation'"
                  >
                    Correlation
                  </button>
                </div>

                <div v-if="associationActiveTab === 'Regression'" class="association-tab-panel">
                  <div v-if="associationRegressionTables(section).length" class="table-stack">
                    <article
                      v-for="table in associationRegressionTables(section)"
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
                  <div v-else-if="section.asset.tablesLoaded" class="state">No association regression tables found for {{ activeTaxLevel }}.</div>

                  <div v-if="associationRegressionFigures(section).length" class="figure-stack association-figure-grid">
                    <figure
                      v-for="figure in associationRegressionFigures(section)"
                      :key="figure.fileName"
                      class="figure-card association-figure-card"
                    >
                      <button
                        type="button"
                        class="figure-button"
                        @click="toggleFigure(figure)"
                      >
                        <img :src="imageSrc(figure)" :alt="figure.fileName" />
                      </button>
                      <figcaption>{{ figure.fileName }}</figcaption>
                    </figure>
                  </div>
                  <div v-else-if="section.asset.figuresError" class="state error">{{ section.asset.figuresError }}</div>
                  <div v-else-if="section.asset.figuresLoaded" class="state">No association regression coefficient plots found.</div>
                </div>

                <div v-else class="association-tab-panel">
                  <h3 class="association-subtitle">Spearman correlation.</h3>

                  <div v-if="associationCorrelationTables(section).length" class="table-stack">
                    <article
                      v-for="table in associationCorrelationTables(section)"
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
                  <div v-else-if="section.asset.tablesLoaded" class="state">No association correlation tables found for {{ activeTaxLevel }}.</div>

                  <div v-if="associationCorrelationFigures(section).length" class="figure-stack association-figure-grid">
                    <figure
                      v-for="figure in associationCorrelationFigures(section)"
                      :key="figure.fileName"
                      class="figure-card association-figure-card"
                    >
                      <button
                        type="button"
                        class="figure-button"
                        @click="toggleFigure(figure)"
                      >
                        <img :src="imageSrc(figure)" :alt="figure.fileName" />
                      </button>
                      <figcaption>{{ figure.fileName }}</figcaption>
                    </figure>
                  </div>
                  <div v-else-if="section.asset.figuresError" class="state error">{{ section.asset.figuresError }}</div>
                  <div v-else-if="section.asset.figuresLoaded" class="state">No association correlation heatmaps found.</div>
                </div>
              </div>

              <div v-else-if="!['QC', 'DIVERSITY'].includes(section.id) && section.asset.tables.length" class="table-stack">
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
              <div v-else-if="!['QC', 'DIVERSITY'].includes(section.id) && section.asset.tablesError" class="state error">{{ section.asset.tablesError }}</div>
              <div v-else-if="!['QC', 'DIVERSITY'].includes(section.id) && section.asset.tablesLoaded" class="state">No {{ section.label }} tables found for {{ activeTaxLevel }}.</div>

              <div v-if="section.id === 'QC'" class="figure-block qc-block">
                <div class="qc-title-bar">
                  <h2>Pre-processing: quality control</h2>
                </div>
                <p class="qc-description">Thresholds: &ge;6 samples per dataset; &ge;3 samples per group; taxon prevalence &ge;10%; mean relative abundance &ge;0.01%.</p>

                <div v-if="qcDistributionFigures(section).length" class="figure-stack qc-figure-stack">
                  <figure
                    v-for="figure in qcDistributionFigures(section)"
                    :key="figure.fileName"
                    class="figure-card qc-figure-card"
                  >
                    <button
                      type="button"
                      class="figure-button"
                      @click="toggleFigure(figure)"
                    >
                      <img :src="imageSrc(figure)" :alt="qcFigureCaption(figure)" />
                    </button>
                    <figcaption>{{ qcFigureCaption(figure) }}</figcaption>
                  </figure>
                </div>

                <div v-if="qcTopTaxaFigure(section)" class="qc-top-taxa">
                  <h3>Identification and annotation the microbiome by using QIIME2 v 2024.10.1 and SILVA release_138 nr99 SSU.</h3>
                  <figure class="figure-card qc-figure-card">
                    <button
                      type="button"
                      class="figure-button"
                      @click="toggleFigure(qcTopTaxaFigure(section))"
                    >
                      <img :src="imageSrc(qcTopTaxaFigure(section))" :alt="qcFigureCaption(qcTopTaxaFigure(section))" />
                    </button>
                    <figcaption>{{ qcFigureCaption(qcTopTaxaFigure(section)) }}</figcaption>
                  </figure>
                </div>

                <div v-else-if="section.asset.figuresError" class="state error">{{ section.asset.figuresError }}</div>
                <div v-else-if="section.asset.figuresLoaded && !qcDistributionFigures(section).length" class="state">No QC figures found.</div>
              </div>

              <div v-else-if="section.id === 'DIVERSITY'" class="figure-block diversity-block">
                <div class="qc-title-bar diversity-title-bar">
                  <h2>Diversity</h2>
                </div>

                <article
                  v-for="group in diversityFigureGroups(section)"
                  :key="group.id"
                  class="diversity-group"
                >
                  <div class="diversity-summary">
                    <h3>{{ group.title }}</h3>
                    <p v-for="line in group.description" :key="line">{{ line }}</p>
                  </div>

                  <div v-if="group.id === 'alpha' && diversityAlphaTables(section).length" class="table-stack">
                    <article
                      v-for="table in diversityAlphaTables(section)"
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
                  <div v-else-if="group.id === 'alpha' && section.asset.tablesError" class="state error">{{ section.asset.tablesError }}</div>

                  <div v-if="group.figures.length" class="figure-stack" :class="group.gridClass">
                    <figure
                      v-for="figure in group.figures"
                      :key="figure.fileName"
                      class="figure-card diversity-figure-card"
                    >
                      <button
                        type="button"
                        class="figure-button"
                        @click="toggleFigure(figure)"
                      >
                        <img :src="imageSrc(figure)" :alt="figure.fileName" />
                      </button>
                      <figcaption>{{ figure.fileName }}</figcaption>
                    </figure>
                  </div>
                  <div v-else-if="section.asset.figuresLoaded" class="state">No {{ group.title }} figures found.</div>
                </article>

                <div v-if="section.asset.figuresError" class="state error">{{ section.asset.figuresError }}</div>
              </div>

              <div v-else-if="isGenericFigureSection(section)" class="figure-block">
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

    <button type="button" class="to-top-btn" @click="scrollToTop">
      To top
    </button>

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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { API_BASE_URL, API_ENDPOINTS, PUBLIC_BASE_URL } from '@/constants';
import { apiRequest } from '@/utils/api';
import topleader from '@/components/topleader.vue';

const route = useRoute();
const loading = ref(false);
const error = ref('');
const datasetRow = ref({});
const activeTaxLevel = ref('Phylum');
const taxLevelAvailability = ref({});
const sectionAssets = ref({});
const lightboxFigure = ref(null);
const associationActiveTab = ref('Regression');
const activeAssetRequestId = ref(0);
const loadedSectionIds = ref({});
const sectionElements = new Map();
let sectionObserver = null;
const pageSize = 10;

const taxonomyLevels = ['Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'];
const datasetInfoFields = [
  'Study subject',
  'Study ID',
  'Study title',
  'Sample type',
  'Collection date/time',
  'Sequencing method'
];
const analysisSections = [
  { id: 'QC', label: 'Pre-processing: quality control', keyword: 'QC' },
  { id: 'DIVERSITY', label: 'Diversity', keyword: 'DIVERSITY' },
  { id: 'DIFFERENTIAL', label: 'Differentially Abundant Microbial Taxa', keyword: 'DIFFERENTIAL' },
  { id: 'regression', label: 'Microbial Taxa Associated with Alcohol-Related Variables', keyword: 'ALCOHOL_REGRESSION' },
  { id: 'ASSOCIATION', label: 'Microbial Taxa Associated with clinical and demographic information', keyword: 'OTHER_METADATA_ASSOCIATION', keywords: ['OTHER_METADATA_ASSOCIATION', 'CORRELATION'] }
];
const qcFigureDefinitions = [
  {
    token: 'read_depth_distribution.png',
    caption: 'Read depth distribution: Distribution of total read counts across samples.'
  },
  {
    token: 'taxa_abundance_distribution.png',
    caption: 'Taxon abundance distribution: Distribution of log10-transformed mean relative abundances across detected taxa.'
  },
  {
    token: 'taxa_prevalence_distribution.png',
    caption: 'Taxon prevalence distribution: Distribution of taxon prevalence across samples.'
  }
];
const qcTopTaxaDefinition = {
  token: 'top_taxa_heatmap.png',
  caption: 'Top-taxa heatmap: Heatmap of CLR-transformed and row-wise z-scored abundances of the most abundant taxa (top 30) across samples.'
};
const diversityFigureDefinitions = [
  {
    id: 'alpha',
    title: 'Alpha diversity',
    keyword: 'alpha',
    gridClass: 'diversity-grid-2',
    description: [
      'Diversity within an individual sample, reflecting microbial richness and evenness.',
      'Alpha diversity was assessed using Observed richness, Shannon diversity, Simpson evenness/dominance, and Chao1 estimated richness.'
    ],
    tokens: [
      'observed_boxplot.png',
      'shannon_boxplot.png',
      'simpson_boxplot.png',
      'chao1_boxplot.png'
    ]
  },
  {
    id: 'beta',
    title: 'Beta diversity',
    keyword: 'beta',
    gridClass: 'diversity-grid-3',
    description: [
      'Differences in microbial community composition between samples or groups',
      'Beta diversity was assessed using Aitchison, BrayCurtis, and Jaccard.'
    ],
    tokens: [
      'aitchison_pcoa.png',
      'braycurtis_pcoa.png',
      'jaccard_pcoa.png'
    ]
  },
  {
    id: 'gamma',
    title: 'Gamma diversity',
    keyword: 'gamma',
    gridClass: 'diversity-grid-2',
    description: [
      'Total microbial diversity across all samples within a dataset, group, or region.',
      'Gamma diversity was assessed using Gamma observed, Gamma Simpson.'
    ],
    tokens: [
      'observed_barplot.png',
      'simpson_barplot.png'
    ]
  }
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
const lowerText = (value) => normalize(value).toLowerCase();
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
  [
    ...datasetInfoFields.map((label) => {
      const sourceKey = Object.keys(datasetRow.value).find((key) => key.toLowerCase().includes(label.toLowerCase()));
      return {
        key: label,
        value: sourceKey ? normalize(datasetRow.value[sourceKey]) : ''
      };
    }),
    {
      key: 'Processed data',
      value: datasetId.value ? 'Open processed data' : '',
      href: datasetId.value ? `${PUBLIC_BASE_URL}/${encodePathPart(datasetId.value)}/` : ''
    }
  ]
);

const isTaxLevelAvailable = (taxLevel) => {
  const availability = taxLevelAvailability.value[taxLevel];
  return availability === undefined ? true : Boolean(availability);
};

const firstAvailableTaxLevel = () => taxonomyLevels.find((taxLevel) => isTaxLevelAvailable(taxLevel)) || taxonomyLevels[0];

const sectionId = (taxLevel, sectionIdValue) => `${taxLevel}-${sectionIdValue}`;
const publicBase = computed(() => PUBLIC_BASE_URL || '/');
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

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

const cellValue = (row, header, firstHeader) => {
  if (row && typeof row === 'object') return row[header] ?? '';
  return header === firstHeader ? row : '';
};

const toggleFigure = (figure) => {
  if (!figure) return;
  const currentKey = lightboxFigure.value ? figureKeyValue(lightboxFigure.value) : '';
  const nextKey = figureKeyValue(figure);
  lightboxFigure.value = currentKey === nextKey ? null : figure;
};

const closeLightbox = () => {
  lightboxFigure.value = null;
};

const figureKeyValue = (figure) => figure.publicPath || figure.fileName;
const lowerFigureName = (figure) => normalize(figure?.fileName).toLowerCase();

const sectionTitle = (section) => (
  {
    QC: 'Pre-processing: quality control',
    DIFFERENTIAL: 'Differentially Abundant Microbial Taxa',
    regression: 'Microbial Taxa Associated with Alcohol-Related Variables',
    ASSOCIATION: 'Microbial Taxa Associated with clinical and demographic information'
  }[section.id] || section.label
);

const isGenericFigureSection = (section) => ![
  'QC',
  'DIVERSITY',
  'DIFFERENTIAL',
  'regression',
  'ASSOCIATION'
].includes(section?.id);

const qcDistributionFigures = (section) => {
  const figures = section?.asset?.figures || [];

  return qcFigureDefinitions
    .map((definition) => figures.find((figure) => lowerFigureName(figure).includes(definition.token)))
    .filter(Boolean);
};

const qcTopTaxaFigure = (section) => {
  const figures = section?.asset?.figures || [];
  return figures.find((figure) => lowerFigureName(figure).includes(qcTopTaxaDefinition.token));
};

const qcFigureCaption = (figure) => {
  const fileName = lowerFigureName(figure);
  const definition = [...qcFigureDefinitions, qcTopTaxaDefinition]
    .find((item) => fileName.includes(item.token));

  return definition?.caption || figure?.fileName || '';
};

const diversityFigureGroups = (section) => {
  const figures = section?.asset?.figures || [];

  return diversityFigureDefinitions.map((definition) => ({
    ...definition,
    figures: definition.tokens
      .map((token) => figures.find((figure) => {
        const fileName = lowerFigureName(figure);
        return fileName.includes(definition.keyword) && fileName.includes(token);
      }))
      .filter(Boolean)
  }));
};

const isDiversityAlphaSignificantFileName = (fileName) => {
  const lower = lowerText(fileName);
  return lower.includes('diversity_alpha') && lower.includes('_significant_p005.tsv');
};

const diversityAlphaTables = (section) => (
  (section?.asset?.tables || [])
    .filter((table) => isDiversityAlphaSignificantFileName(table.fileName))
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const isDifferentialSignificantFileName = (fileName) => lowerText(fileName).endsWith('significant_raw_p005.tsv');
const isDifferentialAllTaxaFileName = (fileName) => lowerText(fileName).endsWith('_all_taxa.tsv');
const isDifferentialRelevantFileName = (fileName) => (
  isDifferentialSignificantFileName(fileName) || isDifferentialAllTaxaFileName(fileName)
);

const isDifferentialSignificantTable = (table) => isDifferentialSignificantFileName(table?.fileName);
const isDifferentialAllTaxaTable = (table) => isDifferentialAllTaxaFileName(table?.fileName);

const differentialTables = (section) => (
  (section?.asset?.tables || [])
    .filter((table) => isDifferentialRelevantFileName(table.fileName))
    .sort((a, b) => {
      const aRank = isDifferentialSignificantTable(a) ? 0 : 1;
      const bRank = isDifferentialSignificantTable(b) ? 0 : 1;
      return aRank - bRank || a.fileName.localeCompare(b.fileName);
    })
);

const taxonHeader = (table) => (
  table?.headers?.find((header) => lowerText(header) === 'taxon')
  || table?.headers?.find((header) => lowerText(header).includes('taxon'))
  || 'taxon'
);

const taxonDisplayName = (row, table) => {
  const rawTaxon = normalize(row?.[taxonHeader(table)]);
  if (!rawTaxon) return '';
  return rawTaxon.includes(':') ? rawTaxon.split(':').pop().trim() : rawTaxon;
};

const differentialCellValue = (row, header, table) => {
  if (isDifferentialSignificantTable(table) && header === taxonHeader(table)) {
    return taxonDisplayName(row, table);
  }

  return cellValue(row, header, table.headers[0]);
};

const figureSearchToken = (value) => lowerText(value).replace(/[^a-z0-9]+/g, '');

const differentialRowFigure = (row, table) => {
  const microbeName = taxonDisplayName(row, table);
  const microbeToken = figureSearchToken(microbeName);
  if (!microbeToken) return null;

  const figures = sectionState('DIFFERENTIAL').figures || [];
  const matches = figures.filter((figure) => {
    const fileName = lowerFigureName(figure);
    return fileName.includes('differential') && figureSearchToken(fileName).includes(microbeToken);
  });

  return matches.find((figure) => lowerFigureName(figure).includes('boxplot')) || matches[0] || null;
};

const isRegressionSignificantFileName = (fileName) => lowerText(fileName).endsWith('significant_raw_p005.tsv');

const regressionTables = (section) => (
  (section?.asset?.tables || [])
    .filter((table) => isRegressionSignificantFileName(table.fileName))
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const regressionFigures = (section) => (
  (section?.asset?.figures || [])
    .filter((figure) => {
      const fileName = lowerFigureName(figure);
      return fileName.includes('regression') && fileName.endsWith('_coefficient_plot.png');
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const isAssociationRegressionTableFileName = (fileName) => {
  const lower = lowerText(fileName);
  return lower.includes('other_metadata_association')
    && lower.endsWith('all_variables__significance_tiers_raw_or_fdr_p_lt_0.05.tsv');
};

const associationRegressionTables = (section) => (
  (section?.asset?.tables || [])
    .filter((table) => isAssociationRegressionTableFileName(table.fileName))
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const associationRegressionFigures = (section) => (
  (section?.asset?.figures || [])
    .filter((figure) => {
      const fileName = lowerFigureName(figure);
      return fileName.endsWith('_coefficient_plot.png')
        && (
          fileName.includes('regression')
          || fileName.includes('other_metadata_association')
        );
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const isAssociationCorrelationTableFileName = (fileName) => {
  const lower = lowerText(fileName);
  return lower.includes('correlation__')
    && lower.endsWith('__significance_tiers_raw_or_fdr_p_lt_0.05.tsv');
};

const associationCorrelationTables = (section) => (
  (section?.asset?.tables || [])
    .filter((table) => isAssociationCorrelationTableFileName(table.fileName))
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const associationCorrelationFigures = (section) => (
  (section?.asset?.figures || [])
    .filter((figure) => {
      const fileName = lowerFigureName(figure);
      return fileName.includes('correlation') && fileName.endsWith('_all_variables_heatmap.png');
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName))
);

const uniqueAssetItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.fileName || item.publicPath;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sectionKeywords = (section) => section.keywords || [section.keyword];

const tableFilesForSection = (section, files) => {
  if (section.id === 'DIFFERENTIAL') {
    return files.filter((file) => isDifferentialRelevantFileName(file.fileName));
  }

  if (section.id === 'regression') {
    return files.filter((file) => isRegressionSignificantFileName(file.fileName));
  }

  if (section.id === 'DIVERSITY') {
    return files.filter((file) => isDiversityAlphaSignificantFileName(file.fileName));
  }

  if (section.id === 'ASSOCIATION') {
    return files.filter((file) => (
      isAssociationRegressionTableFileName(file.fileName)
      || isAssociationCorrelationTableFileName(file.fileName)
    ));
  }

  return files;
};

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
  const keywords = sectionKeywords(section);
  updateSectionState(section.id, { tablesLoading: section.id !== 'QC', figuresLoading: true }, requestId);

  const loadTableFiles = section.id === 'QC'
    ? Promise.resolve(updateSectionState(section.id, { tablesLoaded: true, tablesLoading: false }, requestId))
    : Promise.all(
      keywords.map((keyword) => fetchJson(
        `${API_ENDPOINTS.RESULT_TABLE_FILES}/${commonPath}`,
        { keyword }
      ))
    )
      .then(async (responses) => {
        const allFiles = uniqueAssetItems(responses.flatMap((resp) => resp?.data?.files || []));
        const files = tableFilesForSection(section, allFiles);
        if (DEBUG_RESULT_ASSETS) {
          console.log('[result table files]', {
            requestId,
            taxLevel,
            section: section.id,
            keywords,
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
            keywords,
            error: err
          });
        }
        updateSectionState(section.id, {
          tablesError: err?.response?.data?.error?.message || err.message || `Failed to load ${section.label} tables`,
          tablesLoaded: true,
          tablesLoading: false
        }, requestId);
      });

  const loadFigures = Promise.all(
    keywords.map((keyword) => fetchJson(
      `${API_ENDPOINTS.RESULT_FIGURES}/${commonPath}`,
      { keyword }
    ))
  )
    .then((responses) => {
      const figures = uniqueAssetItems(responses.flatMap((resp) => resp?.data?.figures || []));
      if (DEBUG_RESULT_ASSETS) {
        console.log('[result figures]', {
          requestId,
          taxLevel,
          section: section.id,
          keywords,
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
          keywords,
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
  closeLightbox();
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
  closeLightbox();
  loadDatasetInfo();
  loadTaxLevelAvailability();
  loadActiveTaxLevelAssets();
});

watch(activeTaxLevel, (taxLevel) => {
  closeLightbox();
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
  line-height: 1.35;
  overflow-wrap: anywhere;
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

.processed-link {
  color: var(--arek-blue);
  font-weight: 800;
  text-decoration: none;
}

.processed-link:hover {
  text-decoration: underline;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 18px;
  border-bottom: 1px solid var(--arek-border);
}

.tab-btn {
  min-width: 142px;
  border: 1px solid var(--arek-border);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #ffffff;
  color: var(--arek-text-body);
  cursor: pointer;
  font-weight: 800;
  padding: 14px 28px;
  text-align: center;
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

.to-top-btn {
  position: fixed;
  right: 26px;
  bottom: 26px;
  z-index: 20;
  border: 0;
  border-radius: 8px;
  background: var(--arek-blue-deep);
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  padding: 12px 18px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
}

.to-top-btn:hover {
  background: var(--arek-blue);
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

.qc-block {
  gap: 18px;
}

.qc-title-bar {
  background: #67679d;
  border-radius: 2px;
  color: #ffffff;
  padding: 12px 14px;
}

.qc-title-bar h2 {
  margin: 0;
  color: #ffffff;
  font-size: 22px;
  line-height: 1.25;
}

.qc-description {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.45;
}

.analysis-title-bar {
  margin-bottom: 2px;
}

.analysis-description {
  display: grid;
  gap: 4px;
}

.analysis-description p {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.qc-summary {
  background: #67679d;
  color: #ffffff;
  border-radius: 2px;
  padding: 12px 14px;
}

.qc-summary p {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.35;
}

.qc-figure-stack {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.qc-top-taxa {
  display: grid;
  gap: 12px;
}

.qc-top-taxa h3 {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 18px;
  line-height: 1.35;
}

.diversity-block {
  gap: 24px;
}

.diversity-title-bar {
  margin-bottom: 2px;
}

.diversity-group {
  display: grid;
  gap: 14px;
}

.diversity-summary {
  display: grid;
  gap: 4px;
}

.diversity-summary h3 {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 18px;
  line-height: 1.25;
}

.diversity-summary p {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
}

.diversity-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.diversity-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.regression-figure-grid,
.association-figure-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
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
  padding: 0;
  overflow: hidden;
}

.figure-button img {
  display: block;
  width: 100%;
  height: auto;
}

figcaption {
  color: var(--arek-text-muted);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  word-break: break-word;
}

.qc-figure-card figcaption {
  color: var(--arek-text-strong);
  font-size: 14px;
  line-height: 1.45;
  text-align: left;
}

.diversity-figure-card figcaption {
  color: var(--arek-text-strong);
  font-size: 13px;
  line-height: 1.4;
}

.differential-block,
.regression-block,
.association-block {
  gap: 18px;
}

.differential-summary,
.regression-summary,
.association-summary {
  display: grid;
  gap: 4px;
}

.differential-summary h3,
.regression-summary h3,
.association-summary h3 {
  margin: 0;
  color: #ffffff;
  font-size: 18px;
  line-height: 1.25;
}

.differential-summary p,
.regression-summary p,
.association-summary p {
  font-size: 15px;
}

.analysis-subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--arek-border);
}

.analysis-subtab-btn {
  border: 1px solid var(--arek-border);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: #ffffff;
  color: var(--arek-text-body);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  padding: 10px 20px;
}

.analysis-subtab-btn.active {
  background: var(--arek-blue-deep);
  border-color: var(--arek-blue-deep);
  color: #ffffff;
}

.association-tab-panel {
  display: grid;
  gap: 18px;
}

.association-subtitle {
  margin: 0;
  color: var(--arek-text-strong);
  font-size: 18px;
  line-height: 1.35;
}

.regression-figure-card figcaption,
.association-figure-card figcaption {
  color: var(--arek-text-strong);
  font-size: 13px;
  line-height: 1.4;
}

.microbe-figure-cell {
  min-width: 160px;
  white-space: normal;
}

.microbe-thumb-button {
  max-width: 150px;
  padding: 6px;
}

.microbe-thumb-button img {
  width: 100%;
}

.no-figure {
  color: var(--arek-text-muted);
  font-weight: 700;
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

  .qc-figure-stack {
    grid-template-columns: 1fr;
  }

  .diversity-grid-2,
  .diversity-grid-3,
  .regression-figure-grid,
  .association-figure-grid {
    grid-template-columns: 1fr;
  }
}
</style>
