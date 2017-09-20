require('shelljs/global');
sed("-i", /coverageReporters = coverageReporters.concat\(\['text-summary']\)/, "coverageReporters = coverageReporters", "./node_modules/jest-cli/build/reporters/coverage_reporter.js");
