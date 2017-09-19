const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const loadCoverage = require('remap-istanbul/lib/loadCoverage');
const remap = require('remap-istanbul/lib/remap');
const writeReport = require('remap-istanbul/lib/writeReport');

const coverageFile = './coverage/coverage-final.json';
const updatedCoverageFile = './coverage/coverage-updated.json';

const isWindows = process.platform === 'win32';

const originalCoverage = fs.readFileSync(coverageFile, 'utf8');

//jest does not correctly escape path to file used as key, force replace it
const originalCoverageJson = JSON.parse(isWindows ? originalCoverage.replace(/\\/g, "\\\\") : originalCoverage);
const updateCoverageJson = {};

_.forIn(originalCoverageJson, (value, key) => {
  const updatedKey = key.replace(path.normalize('/src/'), path.normalize('/src/')).replace('.ts', '.js');
  updateCoverageJson[updatedKey] = value;
});

fs.writeFileSync(updatedCoverageFile, JSON.stringify(updateCoverageJson));

const collector = remap(loadCoverage(updatedCoverageFile));
writeReport(collector, 'json', {}, './coverage_remapped/coverage.json');
writeReport(collector, 'lcovonly', {}, './coverage_remapped/coverage.lcov');
writeReport(collector, 'html', {}, './coverage_remapped/html');
