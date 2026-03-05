const fs = require('fs');
const csv = require('csv-parser');
const { PATHS, UTILS, HTTP_STATUS } = require('../constants');

const normalize = (value) => (value ?? '').toString().trim();

const readSummaryRows = (onSuccess, onError) => {
  const csvPath = PATHS.SUMMARY_TABLE_CSV;

  if (!fs.existsSync(csvPath)) {
    onError(`summarytable.csv not found: ${csvPath}`, HTTP_STATUS.NOT_FOUND, 'FILE_NOT_FOUND');
    return;
  }

  const rows = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => rows.push(row))
    .on('error', (error) => {
      onError(`Failed to read summarytable.csv: ${error.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'CSV_READ_ERROR');
    })
    .on('end', () => {
      onSuccess(rows, csvPath);
    });
};

const getSummaryFilterOptions = (req, res) => {
  readSummaryRows(
    (rows, csvPath) => {
      if (!rows.length) {
        return UTILS.sendSuccess(res, {
          headers: [],
          options: { studyNr: [], subject: [], sampleType: [] },
          count: 0
        }, 'Summary table is empty');
      }

      const headers = Object.keys(rows[0]);
      const col1 = headers[0];
      const col2 = headers[1];
      const sampleTypeHeader = headers.find((h) =>
        h.toLowerCase().includes('sample type')
      );
      const col3 = sampleTypeHeader || headers[2];

      const unique = (key) => {
        return [...new Set(rows.map((r) => normalize(r[key])).filter(Boolean))];
      };

      const studyNr = unique(col1).sort((a, b) => Number(a) - Number(b));
      const subject = unique(col2).sort((a, b) => a.localeCompare(b));
      const sampleType = unique(col3).sort((a, b) => a.localeCompare(b));

      return UTILS.sendSuccess(res, {
        headers: {
          studyNr: col1,
          subject: col2,
          sampleType: col3
        },
        options: {
          studyNr,
          subject,
          sampleType
        },
        count: rows.length,
        source: csvPath
      }, 'Summary filter options loaded');
    },
    (message, statusCode, code) => UTILS.sendError(res, message, statusCode, code)
  );
};

const getSummaryDetailTable = (req, res) => {
  readSummaryRows(
    (rows, csvPath) => {
      if (!rows.length) {
        return UTILS.sendSuccess(res, {
          headers: [],
          rows: [],
          total: 0,
          source: csvPath
        }, 'Summary table is empty');
      }

      const headers = Object.keys(rows[0]);
      const studyNrHeader = headers[0];
      const subjectHeader = headers[1];
      const sampleTypeHeader = headers.find((h) => h.toLowerCase().includes('sample type')) || headers[2];

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
        source: csvPath
      }, 'Summary detail table loaded');
    },
    (message, statusCode, code) => UTILS.sendError(res, message, statusCode, code)
  );
};

module.exports = {
  getSummaryFilterOptions,
  getSummaryDetailTable
};
