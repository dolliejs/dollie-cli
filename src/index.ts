import path from 'path';
import fs from 'fs-extra';
import { program } from 'commander';
import _ from 'lodash';
import dollie, { parseComposeConfig, log } from '@dollie/core';
import constantsConfig from '@dollie/core/lib/constants';
import { DollieBaseAppConfig, ExportedConstants, Plugin } from '@dollie/core/lib/interfaces';
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

program.option('-p, --plugins [plugin...]', 'specify an array of plugin file pathname');

program.action(async (...result) => {
  const props = result[0] || {} as DollieBaseAppConfig;
  const constants = Object.keys(_.omit(props, ['plugins'])).reduce((result, currentKey) => {
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
    const pluginPaths = (_.isArray(props.plugins) ? props.plugins : []) as Array<string>;
    const plugins = pluginPaths.map((pluginPath) => ({
      pathname: pluginPath,
      executor: require(path.resolve(pluginPath)),
    })) as Array<Plugin>;
    await dollie.interactive({
      constants,
      plugins,
    });
  } catch (e) {
    log.error(e.toString());
    process.exit(1);
  }
});

program.command('compose <config>').action(async (config: string) => {
  const configFilePath = path.join(process.cwd(), config);

  if (!fs.existsSync(configFilePath)) {
    log.error(`error: file not found, stating ${config}`);
    process.exit(1);
  }
  if (!fs.statSync(configFilePath).isFile()) {
    log.error(`error: ${config} is not a file`);
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
