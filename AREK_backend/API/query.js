const fs = require('fs/promises');
const path = require('path');
const db = require('../db');
const { DB_TABLES, PATHS, UTILS, HTTP_STATUS } = require('../constants');
const { isSupportedTableFile, parseTableFile, parseTableFilePage } = require('./read_tsv_csv_txt');

const normalize = (value) => (value ?? '').toString().trim();
const SUMMARY_TABLE = `\`${DB_TABLES.SUMMARY_DATASET_INFOR}\``;
const STUDY_ID_HEADER = 'Study ID';
const TAXONOMY_LEVELS = ['Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'];
const ASSET_DIRS = {
  tables: 'tables',
  figures: 'figures_png'
};
const DEFAULT_TABLE_PAGE_SIZE = 10;
const DEFAULT_TAXA_PAGE_SIZE = 10;
const MAX_TAXA_PAGE_SIZE = 100;
const TAXA_CORRELATION_TABLE = `\`${DB_TABLES.ALL_CORRELATION_STATISTIC}\``;
const TAXA_DIFFERENTIAL_TABLE = `\`${DB_TABLES.ALL_DIFFERENTIAL_STATISTIC}\``;

const getSummaryRows = async () => {
  const rows = await db.queryPromise(`SELECT * FROM ${SUMMARY_TABLE}`);
  return rows.map((row) => ({ ...row }));
};

const getSummaryHeaders = (rows) => {
  return rows.length ? Object.keys(rows[0]) : [];
};

const getCoreHeaders = (headers) => {
  const studyNr = headers.find((h) => h.toLowerCase().includes('arek study nr')) || headers[0];
  const subject = headers.find((h) => h.toLowerCase().includes('study subject')) || headers[1];
  const sampleType = headers.find((h) => h.toLowerCase().includes('sample type')) || headers[2];
  const studyId = headers.find((h) => h.toLowerCase() === STUDY_ID_HEADER.toLowerCase()) || STUDY_ID_HEADER;

  return { studyNr, subject, sampleType, studyId };
};

const isPathInside = (targetPath, rootPath) => {
  const relative = path.relative(rootPath, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const fileMatchesTaxLevel = (fileName, taxLevel) => {
  const lowerName = fileName.toLowerCase();
  const lowerTaxLevel = taxLevel.toLowerCase();

  return lowerName.includes(`__${lowerTaxLevel}__`) || lowerName.includes(`_${lowerTaxLevel}_`);
};

const readAssetEntries = async (assetDir) => {
  try {
    return await fs.readdir(assetDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const findAssetFiles = async ({ datasetId, taxLevel, assetType, fileFilter }) => {
  const datasetDir = path.resolve(PATHS.RESULT_PUBLIC_DIR, datasetId);
  const publicRoot = path.resolve(PATHS.RESULT_PUBLIC_DIR);

  if (!isPathInside(datasetDir, publicRoot)) {
    throw new Error('Invalid result asset path');
  }

  const assetSubdir = ASSET_DIRS[assetType];
  const directDir = path.join(datasetDir, taxLevel, assetSubdir);
  const entries = await readAssetEntries(directDir);

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter(fileFilter)
    .map((fileName) => ({
      fileName,
      assetDir: directDir,
      absolutePath: path.join(directDir, fileName),
      publicPath: path.relative(publicRoot, path.join(directDir, fileName)).split(path.sep).map(encodeURIComponent).join('/')
    }));
};

const validateResultAssetRequest = (res, datasetId, taxLevel) => {
  if (!datasetId || !/^PRJ\S+$/i.test(datasetId)) {
    UTILS.sendError(res, 'A valid PRJ dataset id is required', HTTP_STATUS.BAD_REQUEST, 'INVALID_DATASET_ID');
    return false;
  }

  if (!TAXONOMY_LEVELS.includes(taxLevel)) {
    UTILS.sendError(res, 'A valid taxonomy level is required', HTTP_STATUS.BAD_REQUEST, 'INVALID_TAXONOMY_LEVEL');
    return false;
  }

  return true;
};

const findTableFilesForRequest = async ({ datasetId, taxLevel, keyword }) => {
  return findAssetFiles({
    datasetId,
    taxLevel,
    assetType: 'tables',
    fileFilter: (name) => (
      name.toLowerCase().includes(keyword)
      && fileMatchesTaxLevel(name, taxLevel)
      && isSupportedTableFile(name)
    )
  });
};

const getAssetDirHasFiles = async (assetDir, predicate = () => true) => {
  const entries = await readAssetEntries(assetDir);
  return entries.some((entry) => entry.isFile() && predicate(entry.name));
};

const getResultAssetAvailability = async (req, res) => {
  const datasetId = normalize(req.params.datasetId || req.query.datasetId);

  if (!datasetId || !/^PRJ\S+$/i.test(datasetId)) {
    return UTILS.sendError(res, 'A valid PRJ dataset id is required', HTTP_STATUS.BAD_REQUEST, 'INVALID_DATASET_ID');
  }

  try {
    const datasetDir = path.resolve(PATHS.RESULT_PUBLIC_DIR, datasetId);
    const publicRoot = path.resolve(PATHS.RESULT_PUBLIC_DIR);

    if (!isPathInside(datasetDir, publicRoot)) {
      throw new Error('Invalid result asset path');
    }

    const levels = await Promise.all(TAXONOMY_LEVELS.map(async (taxLevel) => {
      const taxDir = path.join(datasetDir, taxLevel);
      const tablesDir = path.join(taxDir, ASSET_DIRS.tables);
      const figuresDir = path.join(taxDir, ASSET_DIRS.figures);
      const hasTables = await getAssetDirHasFiles(tablesDir, isSupportedTableFile);
      const hasFigures = await getAssetDirHasFiles(figuresDir, (name) => name.toLowerCase().endsWith('.png'));

      return {
        taxLevel,
        hasTables,
        hasFigures,
        available: hasTables || hasFigures
      };
    }));

    return UTILS.sendSuccess(res, {
      datasetId,
      levels
    }, 'Result asset availability loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'RESULT_ASSET_AVAILABILITY_ERROR');
  }
};

const getSummaryFilterOptions = async (req, res) => {
  try {
    const rows = await getSummaryRows();

    if (!rows.length) {
      return UTILS.sendSuccess(res, {
        headers: [],
        options: { studyNr: [], subject: [], sampleType: [] },
        count: 0,
        source: DB_TABLES.SUMMARY_DATASET_INFOR
      }, 'Summary dataset table is empty');
    }

    const headers = getSummaryHeaders(rows);
    const { studyNr, subject, sampleType } = getCoreHeaders(headers);

    const unique = (key) => {
      return [...new Set(rows.map((r) => normalize(r[key])).filter(Boolean))];
    };

    const studyNrOptions = unique(studyNr).sort((a, b) => Number(a) - Number(b));
    const subjectOptions = unique(subject).sort((a, b) => a.localeCompare(b));
    const sampleTypeOptions = unique(sampleType).sort((a, b) => a.localeCompare(b));

    return UTILS.sendSuccess(res, {
      headers: {
        studyNr,
        subject,
        sampleType
      },
      options: {
        studyNr: studyNrOptions,
        subject: subjectOptions,
        sampleType: sampleTypeOptions
      },
      count: rows.length,
      source: DB_TABLES.SUMMARY_DATASET_INFOR
    }, 'Summary dataset filter options loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
  }
};

const getSummaryDetailTable = async (req, res) => {
  try {
    const rows = await getSummaryRows();

    if (!rows.length) {
      return UTILS.sendSuccess(res, {
        headers: [],
        rows: [],
        total: 0,
        source: DB_TABLES.SUMMARY_DATASET_INFOR
      }, 'Summary dataset table is empty');
    }

    const headers = getSummaryHeaders(rows);
    const { studyNr: studyNrHeader, subject: subjectHeader, sampleType: sampleTypeHeader } = getCoreHeaders(headers);

    const selectedStudyNr = normalize(req.query.studyNr);
    const selectedSubject = normalize(req.query.subject);
    const selectedSampleType = normalize(req.query.sampleType);

    const filteredRows = rows.filter((row) => {
      const rowStudyNr = normalize(row[studyNrHeader]);
      const rowSubject = normalize(row[subjectHeader]);
      const rowSampleType = normalize(row[sampleTypeHeader]);

      if (selectedStudyNr && rowStudyNr !== selectedStudyNr) return false;
      if (selectedSubject && rowSubject !== selectedSubject) return false;
      if (selectedSampleType && rowSampleType !== selectedSampleType) return false;
      return true;
    });

    return UTILS.sendSuccess(res, {
      headers,
      rows: filteredRows,
      total: filteredRows.length,
      filters: {
        studyNr: selectedStudyNr,
        subject: selectedSubject,
        sampleType: selectedSampleType
      },
      source: DB_TABLES.SUMMARY_DATASET_INFOR
    }, 'Summary dataset table loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
  }
};

const getSummarySearch = async (req, res) => {
  const keyword = normalize(req.query.keyword).toLowerCase();
  const selectedSampleType = normalize(req.query.sampleType);

  try {
    const rows = await getSummaryRows();

    if (!rows.length) {
      return UTILS.sendSuccess(res, {
        headers: [],
        rows: [],
        total: 0,
        first: null,
        source: DB_TABLES.SUMMARY_DATASET_INFOR
      }, 'Summary dataset table is empty');
    }

    const headers = getSummaryHeaders(rows);
    const { sampleType: sampleTypeHeader, studyId: studyIdHeader, studyNr: studyNrHeader, subject: subjectHeader } = getCoreHeaders(headers);

    const matchedRows = rows.filter((row) => {
      if (selectedSampleType && normalize(row[sampleTypeHeader]) !== selectedSampleType) return false;
      if (!keyword) return true;

      return headers.some((header) => normalize(row[header]).toLowerCase().includes(keyword));
    });

    const mapRow = (row) => ({
      row,
      datasetId: normalize(row[studyIdHeader]),
      studyNr: normalize(row[studyNrHeader]),
      subject: normalize(row[subjectHeader]),
      sampleType: normalize(row[sampleTypeHeader])
    });

    return UTILS.sendSuccess(res, {
      headers,
      rows: matchedRows,
      total: matchedRows.length,
      first: matchedRows.length ? mapRow(matchedRows[0]) : null,
      filters: {
        keyword,
        sampleType: selectedSampleType
      },
      source: DB_TABLES.SUMMARY_DATASET_INFOR
    }, 'Summary search loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
  }
};

const getDatasetInfo = async (req, res) => {
  const datasetId = normalize(req.params.datasetId || req.query.datasetId);

  if (!datasetId || !/^PRJ\S+$/i.test(datasetId)) {
    return UTILS.sendError(res, 'A valid PRJ dataset id is required', HTTP_STATUS.BAD_REQUEST, 'INVALID_DATASET_ID');
  }

  try {
    const rows = await db.queryPromise(
      `SELECT * FROM ${SUMMARY_TABLE} WHERE \`${STUDY_ID_HEADER}\` = ? LIMIT 1`,
      [datasetId]
    );

    if (!rows.length) {
      return UTILS.sendError(
        res,
        `Dataset not found in ${DB_TABLES.SUMMARY_DATASET_INFOR}: ${datasetId}`,
        HTTP_STATUS.NOT_FOUND,
        'DATASET_NOT_FOUND'
      );
    }

    const row = { ...rows[0] };
    return UTILS.sendSuccess(res, {
      datasetId,
      headers: Object.keys(row),
      row,
      source: DB_TABLES.SUMMARY_DATASET_INFOR
    }, 'Dataset info loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
  }
};

const getResultTables = async (req, res) => {
  const datasetId = normalize(req.params.datasetId);
  const taxLevel = normalize(req.params.taxLevel);
  const keyword = normalize(req.query.keyword || 'QC').toLowerCase();

  if (!validateResultAssetRequest(res, datasetId, taxLevel)) return;

  try {
    const files = await findTableFilesForRequest({ datasetId, taxLevel, keyword });

    const tables = [];
    const sortedFiles = files.sort((a, b) => a.fileName.localeCompare(b.fileName));

    for (const { fileName, absolutePath } of sortedFiles) {
      const parsed = await parseTableFilePage(absolutePath, { page: 1, pageSize: DEFAULT_TABLE_PAGE_SIZE });

      tables.push({
        fileName,
        page: parsed.page,
        pageSize: parsed.pageSize,
        hasMore: parsed.hasMore,
        headers: parsed.headers,
        rows: parsed.rows
      });
    }

    return UTILS.sendSuccess(res, {
      datasetId,
      taxLevel,
      keyword,
      pageSize: DEFAULT_TABLE_PAGE_SIZE,
      tables,
      source: files.length ? [...new Set(files.map((file) => file.assetDir))] : path.resolve(PATHS.RESULT_PUBLIC_DIR, datasetId)
    }, 'Result tables loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'RESULT_TABLE_ERROR');
  }
};

const getResultTableFiles = async (req, res) => {
  const datasetId = normalize(req.params.datasetId);
  const taxLevel = normalize(req.params.taxLevel);
  const keyword = normalize(req.query.keyword || 'QC').toLowerCase();

  if (!validateResultAssetRequest(res, datasetId, taxLevel)) return;

  try {
    const files = (await findTableFilesForRequest({ datasetId, taxLevel, keyword }))
      .sort((a, b) => a.fileName.localeCompare(b.fileName))
      .map(({ fileName }) => ({ fileName }));

    return UTILS.sendSuccess(res, {
      datasetId,
      taxLevel,
      keyword,
      files,
      total: files.length
    }, 'Result table files loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'RESULT_TABLE_FILE_ERROR');
  }
};

const getResultTablePreview = async (req, res) => {
  const datasetId = normalize(req.params.datasetId);
  const taxLevel = normalize(req.params.taxLevel);
  const fileName = normalize(req.params.fileName);

  if (!validateResultAssetRequest(res, datasetId, taxLevel)) return;

  if (!fileName || fileName !== path.basename(fileName) || !isSupportedTableFile(fileName)) {
    return UTILS.sendError(res, 'A valid table file name is required', HTTP_STATUS.BAD_REQUEST, 'INVALID_TABLE_FILE');
  }

  try {
    const files = await findAssetFiles({
      datasetId,
      taxLevel,
      assetType: 'tables',
      fileFilter: (name) => name === fileName && fileMatchesTaxLevel(name, taxLevel) && isSupportedTableFile(name)
    });

    if (!files.length) {
      return UTILS.sendError(res, `Table file not found: ${fileName}`, HTTP_STATUS.NOT_FOUND, 'TABLE_FILE_NOT_FOUND');
    }

    const parsed = await parseTableFilePage(files[0].absolutePath, { page: 1, pageSize: DEFAULT_TABLE_PAGE_SIZE });

    return UTILS.sendSuccess(res, {
      datasetId,
      taxLevel,
      fileName,
      page: parsed.page,
      pageSize: parsed.pageSize,
      hasMore: parsed.hasMore,
      headers: parsed.headers,
      rows: parsed.rows
    }, 'Result table preview loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'RESULT_TABLE_PREVIEW_ERROR');
  }
};

const getResultTablePage = async (req, res) => {
  const datasetId = normalize(req.params.datasetId);
  const taxLevel = normalize(req.params.taxLevel);
  const fileName = normalize(req.params.fileName);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || DEFAULT_TABLE_PAGE_SIZE, 1), 100);

  if (!validateResultAssetRequest(res, datasetId, taxLevel)) return;

  if (!fileName || fileName !== path.basename(fileName) || !isSupportedTableFile(fileName)) {
    return UTILS.sendError(res, 'A valid table file name is required', HTTP_STATUS.BAD_REQUEST, 'INVALID_TABLE_FILE');
  }

  try {
    const files = await findAssetFiles({
      datasetId,
      taxLevel,
      assetType: 'tables',
      fileFilter: (name) => name === fileName && fileMatchesTaxLevel(name, taxLevel) && isSupportedTableFile(name)
    });

    if (!files.length) {
      return UTILS.sendError(res, `Table file not found: ${fileName}`, HTTP_STATUS.NOT_FOUND, 'TABLE_FILE_NOT_FOUND');
    }

    const parsed = await parseTableFilePage(files[0].absolutePath, { page, pageSize });

    return UTILS.sendSuccess(res, {
      datasetId,
      taxLevel,
      fileName,
      page: parsed.page,
      pageSize: parsed.pageSize,
      hasMore: parsed.hasMore,
      headers: parsed.headers,
      rows: parsed.rows
    }, 'Result table page loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'RESULT_TABLE_PAGE_ERROR');
  }
};

const getResultFigures = async (req, res) => {
  const datasetId = normalize(req.params.datasetId);
  const taxLevel = normalize(req.params.taxLevel);
  const keyword = normalize(req.query.keyword || 'QC').toLowerCase();

  if (!validateResultAssetRequest(res, datasetId, taxLevel)) return;

  try {
    const figures = (await findAssetFiles({
      datasetId,
      taxLevel,
      assetType: 'figures',
      fileFilter: (name) => (
        name.toLowerCase().includes(keyword)
        && fileMatchesTaxLevel(name, taxLevel)
        && name.toLowerCase().endsWith('.png')
      )
    }))
      .sort((a, b) => a.fileName.localeCompare(b.fileName))
      .map(({ fileName, publicPath }) => ({
        fileName,
        publicPath
      }));

    return UTILS.sendSuccess(res, {
      datasetId,
      taxLevel,
      keyword,
      figures,
      source: figures.length ? path.resolve(PATHS.RESULT_PUBLIC_DIR, datasetId) : path.resolve(PATHS.RESULT_PUBLIC_DIR, datasetId)
    }, 'Result figures loaded');
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'RESULT_FIGURE_ERROR');
  }
};

const safeFilePart = (value) => normalize(value)
  .replace(/:/g, '_')
  .replace(/[^A-Za-z0-9._-]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_+|_+$/g, '');

const buildCorrelationFigure = (row) => {
  const dataset = safeFilePart(row.dataset);
  const taxLevel = safeFilePart(row.tax_level);
  const variable = safeFilePart(row.variable);

  if (!dataset || !taxLevel || !variable) return null;

  const fileName = `STEP04_CORRELATION_${dataset}_${taxLevel}_${variable}_COEFFICIENT_PLOT.png`;
  return {
    fileName,
    publicPath: `${dataset}/${taxLevel}/figures_png/${fileName}`
  };
};

const buildDifferentialFigure = (row) => {
  const dataset = safeFilePart(row.dataset);
  const taxLevel = safeFilePart(row.tax_level);
  const groupVariable = safeFilePart(row.group_variable);
  const contrast = safeFilePart(row.contrast);
  const taxon = safeFilePart(row.taxon);

  if (!dataset || !taxLevel || !groupVariable || !contrast || !taxon) return null;

  const fileName = `STEP02_DIFFERENTIAL_${dataset}_${taxLevel}_${groupVariable}_${contrast}_BOXPLOT_${taxon}.png`;
  return {
    fileName,
    publicPath: `${dataset}/${taxLevel}/figures_png/${fileName}`
  };
};

const getTaxaStatisticPage = async ({
  req,
  res,
  tableName,
  fallbackHeaders,
  sourceName,
  orderBy,
  buildFigure,
  successMessage,
  errorCode
}) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || DEFAULT_TAXA_PAGE_SIZE, 1), MAX_TAXA_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  try {
    const countRows = await db.queryPromise(`SELECT COUNT(*) AS total FROM ${tableName}`);
    const total = Number(countRows?.[0]?.total) || 0;
    const rows = await db.queryPromise(
      `SELECT * FROM ${tableName}
       ORDER BY ${orderBy}
       LIMIT ${pageSize} OFFSET ${offset}`
    );

    const mappedRows = rows.map((row) => ({
      ...row,
      figure: buildFigure(row)
    }));

    return UTILS.sendSuccess(res, {
      headers: rows.length ? Object.keys(rows[0]) : fallbackHeaders,
      rows: mappedRows,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      source: sourceName
    }, successMessage);
  } catch (error) {
    return UTILS.sendError(res, error.message, HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode);
  }
};

const getTaxaCorrelationStatistics = async (req, res) => getTaxaStatisticPage({
  req,
  res,
  tableName: TAXA_CORRELATION_TABLE,
  fallbackHeaders: [
    'dataset',
    'tax_level',
    'analysis_role',
    'variable',
    'variable_display',
    'taxon',
    'rho',
    'p_value',
    'n_samples',
    'FDR_p_value',
    'direction',
    'raw_p_significance',
    'FDR_p_significance',
    'source_file'
  ],
  sourceName: DB_TABLES.ALL_CORRELATION_STATISTIC,
  orderBy: 'dataset, tax_level, variable, taxon',
  buildFigure: buildCorrelationFigure,
  successMessage: 'Taxa correlation statistics loaded',
  errorCode: 'TAXA_CORRELATION_STATISTICS_ERROR'
});

const getTaxaDifferentialStatistics = async (req, res) => getTaxaStatisticPage({
  req,
  res,
  tableName: TAXA_DIFFERENTIAL_TABLE,
  fallbackHeaders: [
    'source_file',
    'dataset',
    'tax_level',
    'group_variable',
    'contrast',
    'group_a',
    'group_b',
    'taxon',
    'n_a',
    'n_b',
    'mean_relative_abundance_a',
    'mean_relative_abundance_b',
    'median_clr_a',
    'median_clr_b',
    'effect_size_clr_median_difference',
    'rank_biserial',
    'log2_fold_change',
    'statistic',
    'p_value',
    'direction',
    'FDR_p_value',
    'raw_p_significance',
    'FDR_p_significance'
  ],
  sourceName: DB_TABLES.ALL_DIFFERENTIAL_STATISTIC,
  orderBy: 'dataset, tax_level, group_variable, contrast, taxon',
  buildFigure: buildDifferentialFigure,
  successMessage: 'Taxa differential statistics loaded',
  errorCode: 'TAXA_DIFFERENTIAL_STATISTICS_ERROR'
});

module.exports = {
  getSummaryFilterOptions,
  getSummarySearch,
  getSummaryDetailTable,
  getDatasetInfo,
  getResultAssetAvailability,
  getResultTables,
  getResultTableFiles,
  getResultTablePreview,
  getResultTablePage,
  getResultFigures,
  getTaxaCorrelationStatistics,
  getTaxaDifferentialStatistics
};
