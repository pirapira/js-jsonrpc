// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const yargs = require('yargs');

const interfaces = require('../src/index');

const argv = yargs.default('output', 'release').argv;

const INDEX_PATH = path.join(__dirname, '..', argv.output);
const INDEX_JSON = path.join(INDEX_PATH, 'index.json');
const methods = [];

mkdirp(INDEX_PATH);

function formatDescription (obj) {
  const optional = obj.optional ? '(optional) ' : '';
  const defaults = obj.default ? `(default: ${obj.default}) ` : '';

  return `${obj.type.name} - ${optional}${defaults}${obj.desc}`;
}

function formatType (obj) {
  if (obj.type === Object && obj.details) {
    const formatted = {};

    Object.keys(obj.details).sort().forEach((key) => {
      formatted[key] = formatType(obj.details[key]);
    });

    return {
      desc: formatDescription(obj),
      details: formatted
    };
  } else if (obj.type && obj.type.name) {
    return formatDescription(obj);
  }

  return obj;
}

Object.keys(interfaces).sort().forEach((group) => {
  Object.keys(interfaces[group]).sort().forEach((name) => {
    const method = interfaces[group][name];
    const deprecated = method.deprecated ? ' (Deprecated and not supported, to be removed in a future version)' : '';

    methods.push({
      name: `${group}_${name}`,
      desc: `${method.desc}${deprecated}`,
      params: method.params.map(formatType),
      returns: formatType(method.returns),
      inputFormatters: method.params.map((param) => param.format || null),
      outputFormatter: method.returns.format || null
    });
  });
});

fs.writeFileSync(INDEX_JSON, JSON.stringify({ methods: methods }, null, 2), 'utf8');
