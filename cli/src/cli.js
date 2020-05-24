#!/usr/bin/env node
if (process.env.PROD === '1') {
    process.removeAllListeners('warning') // necessary to suppress warnings and maintain a clean stdout
}

const { readConfig } = require('./config')

const { uploadWorkloadFiles } = require('./commands/uploadFiles')
const { createWorkload, publishResults } = require('./commands/publisher')

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
    .option('c', { alias: 'config', default: 'testo.config.json', type: 'string', describe: 'path to configuration file' })
    .option('api', { type: 'string', describe: 'test api endpoint' })
    .command('upload-workload-files', 'Upload workload files to storage service', (yargs) => {
        yargs.option('files', { demandOption: true, type: 'string',
            describe: 'path to directory with asset files, can be relative'
        })
        yargs.option('id', { demandOption: true, type: 'string',
            describe: 'workload id'
        })
    }, enhanceArguments(uploadWorkloadFiles))
    .command('create-workload', 'Create workload with metadata', (yargs) => {
        yargs.option('kind', { demandOption: true, type: 'string',
            describe: 'workload kind'
        })
        yargs.option('metadata', { default: '{}', type: 'string',
            describe: 'metadata json'
        })
    }, enhanceArguments(createWorkload))
    .command('publish-results', 'Parse and publish test results', (yargs) => {
        yargs.option('files', { demandOption: true, type: 'string',
            describe: 'path to directory with test result files, can be relative'
        })
        yargs.option('id', { demandOption: true, type: 'string',
            describe: 'workload id'
        })
        yargs.option('type', { default: 'junit', type: 'string',
            describe: 'parser type to be used on files'
        })
    }, enhanceArguments(publishResults))
    .argv
