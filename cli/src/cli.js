#!/usr/bin/env node
const { readConfig } = require('./config')

const { uploadFiles } = require('./commands/uploadFiles')

const enhanceArguments = f => async args => {
    const config = await readConfig(args.config)
    return f({
        ...config,
        ...args // prioritize inline args over configuration file args
    })
}

require('yargs')
    .strict()
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .scriptName("testo")
    .usage('$0 <cmd> [args]')
    .option('c', { alias: 'config', default: 'testo.config.json', type: 'string' })
    .option('api', { default: 'testo-api.foobar.com', type: 'string' })
    .command('upload-files', 'Upload files to storage services', (yargs) => {
        yargs.option('f', { alias: 'files', demandOption: true, type: 'string',
            describe: 'path to directory with asset files, can be relative'
        })
    }, enhanceArguments(uploadFiles))
    .argv
