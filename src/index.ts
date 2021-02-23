import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';
import dollie, { parseComposeConfig, log } from '@dollie/core';
import constantsConfig from '@dollie/core/lib/constants';
import { ExportedConstants } from '@dollie/core/lib/interfaces';
import { parseCamelToSnake, parseSnakeToKebab } from './utils/parsers';

const packageJson = fs.readJSONSync(path.resolve(__dirname, '../package.json'));

program.version(packageJson.version || '0.0.1');

const constantKeys = Object.keys(constantsConfig) as Array<keyof ExportedConstants>;

for (const constantKey of constantKeys) {
  const kebabKey = parseSnakeToKebab(constantKey);
  if (kebabKey) {
    if (constantKey === 'SCAFFOLD_TIMEOUT') {
      program.option(`--${kebabKey} <number> [value]`);
      continue;
    }
    program.option(`--${kebabKey} <text> [value]`);
  }
}

program.action(async (...props) => {
  const constants = Object.keys(props[0] || {}).reduce((result, currentKey) => {
    const currentSnakeKey = parseCamelToSnake(currentKey);
    const currentValue = (props[0] || {})[currentKey];
    if (currentSnakeKey && currentValue !== undefined) {
      const snakeKey = currentSnakeKey.toUpperCase() as keyof ExportedConstants;
      if (snakeKey === 'SCAFFOLD_TIMEOUT') {
        result[snakeKey] = parseInt(currentValue, 10) || 10000;
      } else {
        result[snakeKey] = currentValue;
      }
    }
    return result;
  }, {}) as ExportedConstants;
  try {
    await dollie.interactive({
      constants,
    });
  } catch (e) {
    log.error(e.toString());
    process.exit(1);
  }
});

program.command('compose <config>').action(async (config: string) => {
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

  try {
    await dollie.compose(composeConfig);
  } catch (e) {
    log.error(e);
    process.exit(1);
  }
});

program.parse(process.argv);
