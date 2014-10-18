#!/usr/bin/env node

var fs = require('fs');
var pager = require('default-pager');

fs.createReadStream(__dirname + '/../README.md').pipe(pager());