const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const dist = path.resolve(__dirname, "..", "dist");
const files = [
  "aphug-data.js",
  "apworld-data.js",
  "apes-data.js",
  "apeuro-data.js",
  "apgov-data.js",
  "appsych-data.js",
  "apush-textbook-data.js",
  "apart-data.js",
  "apcsp-data.js",
  "apbiology-data.js",
  "apstats-data.js",
  "apchem-data.js",
  "apcalculus-data.js",
  "apprecalculus-data.js",
  "apcomparative-government-data.js",
  "ap-economics-data.js",
  "ap-music-theory-data.js",
  "ap-latin-data.js",
  "ap-african-american-studies-data.js",
  "ap-cybersecurity-data.js",
  "ap-business-personal-finance-data.js",
  "ap-new-course-expansions.js",
];

const context = { window: {}, console, encodeURIComponent };
vm.createContext(context);
files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(dist, file), "utf8"), context, { filename: file }));

process.stdout.write(JSON.stringify(context.window));
