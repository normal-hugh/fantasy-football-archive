#!/usr/bin/env node

import { App } from 'aws-cdk-lib';
import myStack from '../lib/gameDataStack.js';

const app = new App();
new myStack.MyStack(app, 'GameDataStack');
