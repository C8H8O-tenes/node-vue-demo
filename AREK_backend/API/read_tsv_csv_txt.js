const fs = require('fs/promises');
const streamFs = require('fs');
const readline = require('readline');
const path = require('path');

const SUPPORTED_TABLE_EXTENSIONS = new Set(['.tsv', '.csv', '.txt']);

const stripBom = (text) => text.replace(/^\uFEFF/, '');

const detectDelimiter = (text, extension) => {
  if (extension === '.tsv') return '\t';
  if (extension === '.csv') return ',';

  const firstLine = stripBom(text).split(/\r?\n/).find((line) => line.trim().length) || '';
  if (firstLine.includes('\t')) return '\t';
  if (firstLine.includes(',')) return ',';
  return /\s+/;
};

const parseCsvLine = (line, delimiter) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseLine = (line, delimiter) => {
  if (delimiter instanceof RegExp) {
    return line.trim().length ? line.trim().split(delimiter) : [];
  }

  if (delimiter === ',') {
    return parseCsvLine(line, delimiter);
  }

  return line.split(delimiter);
};

const normalizeHeaders = (headers) => {
  return headers.map((header, index) => header || `column_${index + 1}`);
};

const parseDelimitedText = (text, extension = '.tsv', options = {}) => {
  const maxRows = Number.isFinite(Number(options.maxRows)) ? Number(options.maxRows) : null;
  const cleanText = stripBom(text);
  const lines = cleanText.split(/\r?\n/).filter((line) => line.length);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(cleanText, extension.toLowerCase());
  const headers = normalizeHeaders(parseLine(lines[0], delimiter));
  const dataLines = maxRows === null ? lines.slice(1) : lines.slice(1, maxRows + 1);
  const rows = dataLines.map((line) => {
    const values = parseLine(line, delimiter);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });

  return { headers, rows };
};

const readTablePreviewText = async (filePath, maxRows) => {
  const wantedLines = Math.max(Number(maxRows) || 0, 0) + 1;

  if (!wantedLines) {
    return '';
  }

  const lines = [];
  const input = streamFs.createReadStream(filePath, { encoding: 'utf8' });
  const reader = readline.createInterface({
    input,
    crlfDelay: Infinity
  });

  for await (const line of reader) {
    lines.push(line);
    if (lines.length >= wantedLines) {
      reader.close();
      input.destroy();
      break;
    }
  }

  return lines.join('\n');
};

const parseTableFile = async (filePath, options = {}) => {
  const extension = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_TABLE_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported table file extension: ${extension || '(none)'}`);
  }

  const maxRows = Number.isFinite(Number(options.maxRows)) ? Number(options.maxRows) : null;
  const text = maxRows === null
    ? await fs.readFile(filePath, 'utf8')
    : await readTablePreviewText(filePath, maxRows);

  return parseDelimitedText(text, extension, { maxRows });
};

const parseTableFilePage = async (filePath, options = {}) => {
  const extension = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_TABLE_EXTENSIONS.has(extension)) {
    throw new Error(`Unsupported table file extension: ${extension || '(none)'}`);
  }

  const page = Math.max(Number(options.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(options.pageSize) || 10, 1), 100);
  const offset = (page - 1) * pageSize;
  const rows = [];
  let headers = [];
  let delimiter = '\t';
  let dataRowIndex = 0;
  let hasMore = false;

  const input = streamFs.createReadStream(filePath, { encoding: 'utf8' });
  const reader = readline.createInterface({
    input,
    crlfDelay: Infinity
  });

  for await (const rawLine of reader) {
    if (!rawLine.length) continue;

    const line = headers.length ? rawLine : stripBom(rawLine);

    if (!headers.length) {
      delimiter = detectDelimiter(line, extension);
      headers = normalizeHeaders(parseLine(line, delimiter));
      continue;
    }

    if (dataRowIndex < offset) {
      dataRowIndex += 1;
      continue;
    }

    if (rows.length >= pageSize) {
      hasMore = true;
      reader.close();
      input.destroy();
      break;
    }

    const values = parseLine(line, delimiter);
    rows.push(headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {}));
    dataRowIndex += 1;
  }

  return {
    headers,
    rows,
    page,
    pageSize,
    hasMore
  };
};

const isSupportedTableFile = (fileName) => {
  return SUPPORTED_TABLE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
};

module.exports = {
  SUPPORTED_TABLE_EXTENSIONS,
  parseDelimitedText,
  parseTableFile,
  parseTableFilePage,
  isSupportedTableFile
};
