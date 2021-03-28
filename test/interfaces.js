'use strict';

const path = require('path');
const metavm = require('metavm');
const metatests = require('metatests');
const { Interfaces } = require('../lib/interfaces.js');

const root = process.cwd();

const application = {
  path: path.join(root, 'test'),
  sandbox: metavm.createContext({ api: {} }),
  absolute(relative) {
    return path.join(this.path, relative);
  },
};

metatests.testAsync('lib/interfaces load', async (test) => {
  const api = new Interfaces('api', application);
  await api.load();
  test.strictSame(typeof api.api.example['1'].add.method, 'function');
  test.end();
});
