import { DollieInteractiveGenerator } from '@dollie/core';
import Environment from 'yeoman-environment';

const env = Environment.createEnv();
env.registerStub(DollieInteractiveGenerator, 'dollie');
env.run('dollie', null);
