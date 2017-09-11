const
  fs = require('mz/fs'),
  css = require('css-tree'),
  mime = require('mime-types'),
  nameTransformations = require('./fix-by-name');

function findFontFace(cssAst) {
  const families = [];
  css.walkRules(cssAst, (node) => {
    if(node.type === 'Atrule' && node.name === 'font-face') {
      families.push(node);
    }
  });
  return families;
}

function findPropertyValue(cssAst, porpertyName) {
  let returnValue = null;
  css.walkDeclarations(cssAst, (node) => {
    if(node.property === porpertyName) {
      returnValue = node.value;
    }
  });
  return returnValue;
}

function stringValue(cssAst) {
  if(!cssAst) {
    return null;
  }

  let value = null;
  css.walk(cssAst, (node) => {
    if(node.type === 'String') {
      value = node.value.split('\'').join('');
    }
  });
  return value;
}

function mimeToExtension(mimeType) {
  if(mimeType === 'font/opentype') {
    return 'otf';
  }
  return mime.extension(mimeType);
}

function fileValues(cssAst, input) {
  let files = {};
  css.walk(cssAst, (node) => {
    if(node.type === 'Url') {
      let file = stringValue(node),
        extension;

      if(file.match(/^data:[\/\w\d-]+;base64,.*/)) {
        var matches = file.match(/^data:([\/\w\d-]+);base64,(.*)/);
        file = new Buffer(matches[2], 'base64');
        extension = mimeToExtension(matches[1]);
      } else {
        file = file.split('#')[0].split('?')[0];
        file = `${input}/${file}`;
        extension = file.split('.').pop();
      }
      files[extension] = file;
    }
  });
  return files;
}

function normalizeFontFace(cssAst, input) {
  let
    name = stringValue(findPropertyValue(cssAst, 'font-family')),
    style = stringValue(findPropertyValue(cssAst, 'font-style')) || 'normal',
    stretch = stringValue(findPropertyValue(cssAst, 'font-stretch')) || 'normal',
    weight = stringValue(findPropertyValue(cssAst, 'font-weight')) || 400,
    files = fileValues(findPropertyValue(cssAst, 'src'), input);

  const fontFace = nameTransformations.reduce(
    (acc, {test, fun}) => {
      if(!test(acc.name)) {
        return acc;
      }
      return fun(acc);
    },
    {
      name: name,
      style: style,
      stretch: stretch,
      weight: weight,
      files: files,
    }
  );

  return Object.assign(fontFace, {slug: slugify(fontFace.name)});
}

function dedupAndMerge(fontFaces) {
  let dedup = {};

  for(let fontFace of fontFaces) {
    let hash = `${fontFace.name}_${fontFace.style}_${fontFace.stretch}_${fontFace.weight}`;
    if(dedup[hash]) {
      Object.assign(dedup[hash].files, fontFace.files);
    } else {
      dedup[hash] = fontFace;
    }
  }
  return Object.values(dedup);
}

async function getFontFaces(input) {
  const cssFiles = (await fs.readdir(input))
    .filter((file) => file.endsWith('.css'));

  fontFaces = (await Promise.all(cssFiles.map((file) => fs.readFile(input + '/' + file))))
    .map((cssContent) => css.parse(cssContent.toString()))
    .map((cssAst) => findFontFace(cssAst))
    .reduce((acc, array) => acc.concat(array), [])
    .map((rule) => normalizeFontFace(rule, input));

  return dedupAndMerge(fontFaces);
}

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function copyFile(src, dest) {
  if(src instanceof Buffer) {
    return fs.writeFile(dest, src);
  }

  return new Promise((resolve, reject) => {
    let readStream = fs.createReadStream(src);
    readStream.once('error', (error) => reject(error));
    readStream.once('end', () => resolve());
    readStream.pipe(fs.createWriteStream(dest));
  });
}

async function moveFontFace({slug, style, stretch, weight, files}, output) {
  for (var extension in files) {
    let
      fileName = `${slug}-${style}-${weight}-${stretch}.${extension}`,
      dest = `${output}/fonts/${fileName}`;

    await copyFile(files[extension], dest);
    files[extension] = fileName;
  }
}

async function convert(input, output, boilerplate = 'sass') {
  if(!await fs.exists(input)) {
    throw 'Input directory does not exist';
  }
  if(!await fs.exists(output)) {
    await fs.mkdir(output);
  }

  const fontFaces = await getFontFaces(input);

  await fs.mkdir(`${output}/fonts`);
  await Promise.all(fontFaces.map((fontFace) => moveFontFace(fontFace, output)));

  if(boilerplate === 'none') {
    return;
  }

  await require(`./boilerplate/${boilerplate}`)(fontFaces, output);
}

module.exports = {
  convert: convert,
};
