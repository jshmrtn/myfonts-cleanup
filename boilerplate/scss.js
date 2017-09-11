const
  fs = require('mz/fs');

async function writeMixinsFile(output) {
  var content = `// =============================================================================
// String Replace
// =============================================================================
@function str-replace($string, $search, $replace: "") {
  $index: str-index($string, $search);
  @if $index {
    @return str-slice($string, 1, $index - 1)+$replace+str-replace(str-slice($string, $index + str-length($search)), $search, $replace);
  }
  @return $string;
}

// =============================================================================
// Font Face
// =============================================================================
@mixin font-face($name, $slug, $weight: null, $style: null, $stretch: normal, $exts: eot woff2 woff ttf svg) {
  $src: null;
  $extmods: ( eot: "?", svg: "#" + str-replace($slug, " ", "_"));
  $formats: ( otf: "opentype", ttf: "truetype");
  @each $ext in $exts {
    $extmod: if(map-has-key($extmods, $ext), $ext + map-get($extmods, $ext), $ext);
    $format: if(map-has-key($formats, $ext), map-get($formats, $ext), $ext);
    $src: append($src, url(quote("fonts/" + $slug + "-" + $style + "-" + $weight + "-" + $stretch + "." + $extmod)) format(quote($format)), comma);
  }
  @font-face {
    font-family: quote($name);
    font-style: $style;
    font-weight: $weight;
    font-stretch: $stretch;
    src: $src;
  }
}
`;

  fs.writeFile(`${output}/_mixins.scss`, content);
}

async function writeFontsFile(fontFaces, output) {
  var definitions = fontFaces
    .map(({slug, name, style, weight, stretch, files}) => {
      return `@include font-face('${name}', '${slug}', ${weight}, ${style}, ${stretch}, ${Object.keys(files).join(' ')});`;
    })
    .join("\n");

  var content = "@import \"mixins\";\n\n" + definitions;

  fs.writeFile(`${output}/_fonts.scss`, content);
}

module.exports = async function writeBoilerplateCode(fontFaces, output) {
  await writeMixinsFile(output);
  await writeFontsFile(fontFaces, output);
}
