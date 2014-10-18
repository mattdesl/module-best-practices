#!/usr/bin/env node

var fs = require('fs')
var pager = require('default-pager')

module.exports = fs.createReadStream(__dirname + '/../README.md')

if (require.main === module)
	module.exports.pipe(pager())