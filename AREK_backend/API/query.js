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

module.exports = {
  getSummaryFilterOptions,
  getSummaryDetailTable,
  getDatasetInfo,
  getResultTables,
  getResultTableFiles,
  getResultTablePreview,
  getResultTablePage,
  getResultFigures
};
