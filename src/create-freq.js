const { readFileSync, writeFileSync } = require('fs');

const lemmaDict = JSON.parse(readFileSync('data/tidy/spanish-lemmas.json'));
const formDict = JSON.parse(readFileSync('data/tidy/spanish-forms.json'));

const formPointer = {};

Object.entries(formDict).forEach((ent) => {
  const [form, info] = ent;

  let lemma = '';

  Object.entries(info).forEach((inf) => {
    lemma = inf[0];
  });

  if (lemma && !formPointer[form]) formPointer[form] = lemma;
});

const nameDict = {};

Object.entries(lemmaDict).forEach((ent) => {
  const [lemma, info] = ent;

  if (
    JSON.stringify(info).includes('"name"') &&
    Object.entries(info).length === 1
  )
    nameDict[lemma] = 1;
});

const sentences = JSON.parse(
  readFileSync('data/sentences/opensubtitles-es-sentences.json'),
);

// const sentences = ['¡ Un mundo de espadas y hechicería !'];

const freqList = {};
let totalWords = 0;
let missedWords = 0;

let index = 0;
for (const sentence of sentences) {
  index += 1;
  // every 100,000 and the first one
  if (index === 1 || index % 100000 === 0)
    console.log(`(${index}/${sentences.length})`);

  // stop at 5 million
  if (index === 5000000) break;

  const words = getWords(sentence);

  const customWords = getCustomWords(words);

  customWords.forEach((ent) => {
    const { word, surface } = ent;

    if (
      word !== 'JUNK' &&
      /\p{L}/u.test(word) &&
      /\p{L}/u.test(surface) &&
      !nameDict[word]
    ) {
      totalWords += 1;
      if (freqList[word]) freqList[word] += 1;
      else freqList[word] = 1;
    }

    if (word === 'JUNK' && /\p{L}/u.test(word) && /\p{L}/u.test(surface))
      missedWords += 1;
  });
}

const freqArr = [];

Object.entries(freqList).forEach((freq) => {
  const [word, count] = freq;

  if (lemmaDict[word]) {
    freqArr.push({ word, count });
  }
});

freqArr.sort((a, b) => (a.count < b.count ? 1 : -1));

let totalCount = 0;
freqArr.forEach((entry) => {
  const { count } = entry;
  totalCount += count;
});

let percSoFar = 0.0;
const nineFive = [];
const nineFiveObj = {};
const nineEight = [];
const nineEightObj = {};
const nineNine = [];
const nineNineObj = {};
const thousand = [];
const hundredCoverage = {};
freqArr.forEach((entry) => {
  const { word, count } = entry;

  if (percSoFar < 0.99) {
    percSoFar += count / totalCount;
    nineNine.push(word);
    nineNineObj[word] = count;
  }

  if (percSoFar < 0.98) {
    nineEight.push(word);
    nineEightObj[word] = count;
  }
  
  if (percSoFar < 0.95) {
    nineFive.push(word);
    nineFiveObj[word] = count;
  }

  if (nineEight.length === 1000) {
    thousand.push(...nineEight);
    console.log(
      `1000 words cover ${+parseFloat(percSoFar).toFixed(2) * 100}%.`,
    );
  }

  if (hundredCoverage[word]) hundredCoverage[word] += count;
  else hundredCoverage[word] = count;
});

let message = '';

message += `Your corpus is made up of ${totalCount} words.\n`;
message += `${nineFive.length} words cover 95%.\n`;
message += `${nineEight.length} words cover 98%.\n`;
message += `${nineNine.length} words cover 99%.\n`;

writeFileSync('data/freq/freq.json', JSON.stringify(freqArr));
writeFileSync('data/freq/nine-five.json', JSON.stringify(nineFiveObj));
writeFileSync('data/freq/nine-eight.json', JSON.stringify(nineEightObj));
writeFileSync('data/freq/nine-nine.json', JSON.stringify(nineNineObj));
writeFileSync('data/freq/1k.json', JSON.stringify(thousand));
writeFileSync('data/freq/hundred.json', JSON.stringify(hundredCoverage));

const minus = totalWords - missedWords;

message += `${
  +parseFloat(minus / totalWords).toFixed(2) * 100
}% of words were able to find a definition.\n`;

message += `Frequency list contains ${freqArr.length} unique word(s).`;

console.log(message);

writeFileSync('data/freq/info.txt', message);

function getWords(sentence) {
  const wordList = [];

  const words = sentence.split(/(?=\s)|(?<=\s)/);

  words.forEach((word) => {
    let lemma = '';
    if (!/[.,!?:"]|\s/.test(word)) {
      if (formPointer[word]) {
        lemma = formPointer[word];
      }

      if (lemmaDict[word]) {
        lemma = word;
      }

      if (word !== word.toLowerCase()) {
        if (formPointer[word.toLowerCase()]) {
          lemma = formPointer[word.toLowerCase()];
        }

        if (lemmaDict[word.toLowerCase()]) {
          lemma = word.toLowerCase();
        }
      }
    }

    if (lemma) wordList.push({ word, lemma });
    else wordList.push({ word, lemma: word });
  });

  return wordList;
}

function getCustomWords(words) {
  const customWordList = [];

  let outer = [...words];

  while (outer.length > 0) {
    let inner = [...outer];

    let matches = 0;
    while (inner.length > 0) {
      let lemma_text = get_lemma_text(inner);
      let surface_text = get_surface_text(inner);

      let target_text = '';

      let try_search = false;

      if (lemmaDict[surface_text]) target_text = surface_text;
      else if (lemmaDict[surface_text.toLowerCase()])
        target_text = surface_text.toLowerCase();
      else if (lemmaDict[lemma_text]) target_text = lemma_text;
      else if (lemmaDict[lemma_text.toLowerCase()])
        target_text = lemma_text.toLowerCase();
      else try_search = true;

      if (try_search) {
        if (lemmaDict[surface_text]) target_text = formPointer[surface_text];

        if (formPointer[surface_text.toLowerCase()])
          target_text = formPointer[surface_text.toLowerCase()];
      }

      if (target_text !== '') {
        customWordList.push({ word: target_text, surface: surface_text });
        matches = inner.length;
        inner.splice(0, inner.length);
      }

      inner.pop();
    }
    if (matches === 0) {
      const [missing] = [...outer];

      const { word } = missing;

      customWordList.push({ word: 'JUNK', surface: word });
      outer.shift();
    } else outer.splice(0, matches);
  }

  return customWordList;
}

function get_lemma_text(input) {
  let output = '';

  for (entry of input) {
    const { lemma } = entry;

    output += lemma;
  }

  return output;
}

function get_surface_text(input) {
  let output = '';

  for (entry of input) {
    const surface = entry['word'];

    output += surface;
  }

  return output;
}
