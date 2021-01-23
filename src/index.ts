import { DollieGenerator } from '@dollie/core';
import Environment from 'yeoman-environment';

const env = Environment.createEnv();
env.registerStub(DollieGenerator, 'dollie');
env.run('dollie', null);
