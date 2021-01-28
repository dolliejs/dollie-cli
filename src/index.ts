import path from 'path';
import fs from 'fs';
import Environment from 'yeoman-environment';
import { program } from 'commander';
import {
  DollieInteractiveGenerator,
  DollieComposeGenerator,
  readJson,
  parseComposeConfig,
} from '@dollie/core';

const packageJson = readJson(path.resolve(__dirname, '../package.json'));

const env = Environment.createEnv();
env.registerStub(DollieInteractiveGenerator, 'dollie:interactive');
env.registerStub(DollieComposeGenerator, 'dollie:compose');

program.version(packageJson.version || '0.0.1');

program.action(() => {
  env.run('dollie:interactive', null);
});

program.command('compose <config>').action((config: string) => {
  const configFilePath = path.join(process.cwd(), config);

  if (!fs.existsSync(configFilePath)) {
    console.error(`error: file not found, stating ${config}`);
    process.exit(1);
  }
  if (!fs.statSync(configFilePath).isFile()) {
    console.error(`error: ${config} is not a file`);
    process.exit(1);
  }

  const content = fs.readFileSync(configFilePath, { encoding: 'utf-8' });
  const composeConfig = parseComposeConfig(content);
  env.run('dollie:compose', composeConfig, null);
});

program.parse(process.argv);
