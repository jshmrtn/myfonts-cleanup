#!/usr/bin/env node
const
  Click = require('cli-ck'),
  lib = require('.');

var cli = new Click()
    .description('Convert messy MyFonts to useable font packages.')
    .version('1.0.0')
    .usage('$0 [--boilerplate {none,css,sass,less}] <input directory> <output directory>')
    .option('boilerplate', {
        required: true,
        alias: 'b',
        desc: 'Boilerplate Code Format',
        choices: ['none', 'scss'],
        defaultValue: 'scss',
    })
    .option('input', {
      required: true,
      alias: 'i',
      desc: 'Input Directory (Generated MyFonts Files)'
    })
    .option('output', {
      required: true,
      alias: 'o',
      desc: 'Output Directory'
    })
    .handler((args, {boilerplate, input, output}) => {
      lib.convert(input, output, boilerplate)
        .catch((error) => {
          console.error('Conversion failed');
          console.error(error);
        });
    });

cli.run(process.argv);
