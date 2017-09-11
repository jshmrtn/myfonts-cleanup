module.exports = [
  {
    test: (name) => name.toLowerCase().includes('italic'),
    fun: (fontFace) => {
      fontFace.name = fontFace.name.replace(/italic/i, '');
      fontFace.style = 'italic';
      return fontFace;
    },
  },
  {
    test: (name) => name.toLowerCase().includes('obl'),
    fun: (fontFace) => {
      fontFace.name = fontFace.name.replace(/obl/i, '');
      fontFace.style = 'italic';
      return fontFace;
    },
  },
  {
    test: (name) => name.match(/-(\d{3})/),
    fun: (fontFace) => {
      fontFace.weight = parseInt(fontFace.name.match(/-(\d{3})/)[1]);
      fontFace.name = fontFace.name.replace(/-\d{3}/, '');
      return fontFace;
    },
  },
  {
    test: (name) => name.toLowerCase().includes('black'),
    fun: (fontFace) => {
      fontFace.name = fontFace.name.replace(/black/i, '');
      fontFace.weight = 900;
      return fontFace;
    },
  },
  {
    test: (name) => name.toLowerCase().includes('light'),
    fun: (fontFace) => {
      fontFace.name = fontFace.name.replace(/light/i, '');
      fontFace.weight = 100;
      return fontFace;
    },
  },
  {
    test: (name) => name.toLowerCase().includes('bold'),
    fun: (fontFace) => {
      fontFace.name = fontFace.name.replace(/bold/i, '');
      fontFace.weight = 700;
      return fontFace;
    },
  },
  {
    test: () => true,
    fun: (fontFace) => {
      fontFace.name = fontFace.name.trim();
      fontFace.name = fontFace.name.replace(/-$/, '');
      fontFace.name = fontFace.name.replace(/_$/, '');
      return fontFace;
    },
  },
];
