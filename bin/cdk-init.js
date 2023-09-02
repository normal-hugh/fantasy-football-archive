#!/usr/bin/env node

import { App } from 'aws-cdk-lib';
import widget_service from '../lib/gameDataStack.js';

const app = new App();
new widget_service.MyStack(app, 'GameDataStack');
