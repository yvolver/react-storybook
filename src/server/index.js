#!/usr/bin/env node

import express from 'express';
import program from 'commander';
import path from 'path';
import fs from 'fs';
import storybook from './middleware';
import packageJson from '../../package.json';
import { parseList } from './utils';
// import { track, dontTrack } from './track_usage';

const logger = console;

program
  .version(packageJson.version)
  .option('-p, --port [number]', 'Port to run Storybook (Required)', parseInt)
  .option('-h, --host [string]', 'Host to run Storybook')
  .option('-s, --static-dir <dir-names>', 'Directory where to load static files from', parseList)
  .option('-c, --config-dir [dir-name]', 'Directory where to load Storybook configurations from')
  .option('--dont-track', 'Do not send anonymous usage stats')
  .option('--do-track', 'Send anonymous usage stats')
  .parse(process.argv);


if (program.dontTrack) {
  // We definitely don't want to send usage data
  // dontTrack();
  logger.info('Storybook will not send anonymous usage stats anymore.');
  process.exit(0);
}

if (program.doTrack) {
  // We definitely don't want to send usage data
  // dontTrack(false);
  logger.info('Storybook will send anonymous usage to getstorybooks.io.');
  process.exit(0);
}

if (!program.port) {
  logger.error('Error: port to run Storybook is required!\n');
  program.help();
  process.exit(-1);
}

// Used with `app.listen` below
const listenAddr = [program.port];

if (program.host) {
  listenAddr.push(program.host);
}

const app = express();

if (program.staticDir) {
  program.staticDir.forEach(dir => {
    const staticPath = path.resolve(dir);
    if (!fs.existsSync(staticPath)) {
      logger.error(`Error: no such directory to load static files: ${staticPath}`);
      process.exit(-1);
    }
    logger.log(`=> Loading static files from: ${staticPath} .`);
    app.use(express.static(staticPath, { index: false }));
  });
}

// Build the webpack configuration using the `baseConfig`
// custom `.babelrc` file and `webpack.config.js` files
const configDir = program.configDir || './.storybook';
app.use(storybook(configDir));

app.listen(...listenAddr, function (error) {
  if (error) {
    throw error;
  } else {
    const address = `http://${program.host || 'localhost'}:${program.port}/`;
    logger.info(`\nReact Storybook started on => ${address}\n`);
    logger.info(`\nTracking is disabled.\n`);
    // track();
  }
});
