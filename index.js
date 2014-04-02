'use strict';

var through = require('through');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var File = gutil.File;

// prepare content and get 'javascript' strings
var escapeContent = function(content, quoteChar, indentString) {
    var bsRegexp = new RegExp('\\\\', 'g');
    var quoteRegexp = new RegExp('\\' + quoteChar, 'g');
    var nlReplace = '\\n' + quoteChar + ' +\n' + indentString + indentString + quoteChar;
    return content.replace(bsRegexp, '\\\\').replace(quoteRegexp, '\\' + quoteChar).replace(/\r?\n/g, nlReplace);
};

// wrap content to an object (obj['file'] = <content>)
var wrapContent = function(content, quoteChar, objectName, fileName) {
    return objectName + '[' + quoteChar + fileName + quoteChar + ']' + ' = ' + quoteChar + content + quoteChar + ';';
};

var getFileName = function(relative) {
    return relative.split('.')[0];
};

// parse one file
var processFile = function(file, objectName, quoteChar, indentString) {
    var fileName = getFileName(file.relative);
    var fileContents = file.contents.toString('utf-8');
    var escapedContent = escapeContent(fileContents, quoteChar, indentString);
    var wrappedContent = wrapContent(escapedContent, quoteChar, objectName, fileName);
    var parsedFile = new File({
        cwd: file.cwd,
        base: file.base,
        path: fileName + '.js',
        contents: new Buffer(wrappedContent)
    });
    return parsedFile;
};

module.exports = function(objectName) {
    if (!objectName) {
        throw new PluginError('gulp-html2jsobject', 'Missing objectName option for gulp-html2jsobject');
    }
    var quoteChar = '\"';
    var indentString = '  ';
    return through(function(file) {
        if (file.isNull()) {
            return; // ignore
        }
        if (file.isStream()) {
            return this.emit('error', new PluginError('gulp-html2jsobject', 'Streaming not supported'));
        }
        this.emit('data', processFile(file, objectName, quoteChar, indentString));
    });
};