const { readFileSync, writeFileSync } = require('fs');

const lemmaDict = JSON.parse(readFileSync('data/tidy/spanish-lemmas.json'));
const formDict = JSON.parse(readFileSync('data/tidy/spanish-forms.json'));

const formPointer = {};

for (const [form, info] of Object.entries(formDict)) {
  const [lemma] = Object.entries(info)[0] || '';

  if (lemma && !formPointer[form]) {
    formPointer[form] = lemma;
  }
}

const nameDict = new Set();

for (const [lemma, info] of Object.entries(lemmaDict)) {

  if (Object.keys(info).length === 1 && info.name) {
    nameDict.add(lemma);
  }
}

// const sentences = JSON.parse(readFileSync('data/sentences/opensubtitles-es-sentences.json'));

const sentences = ['¡Un mundo de espadas y hechicería!', 'si Dios quiere.'];

const freqList = {};
let totalWords = 0;
let missedWords = 0;

let index = 0;
for (const sentence of sentences) {
  index++;
  // log progress the first time, then every 100,000 sentences, and the last one
  if (index === 1 || index % 100000 === 0 || index === sentences.length) {
    console.log(`(${index}/${sentences.length})`);
  }

  // stop at 5 million
  if (index === 5000000) {
    break;
  }

  const words = getWords(sentence);
  const customWords = getCustomWords(words);

  // console.log(customWords);

  for (const { word, surface } of customWords) {
    if (word !== '' && /\p{L}/u.test(word) && /\p{L}/u.test(surface) && !nameDict.has(word)) {
      totalWords++;
      freqList[word] = (freqList[word] || 0) + 1;
    }

    if (word === '' && /\p{L}/u.test(word) && /\p{L}/u.test(surface)) {
      missedWords++;
    }
  }
}

const freqArr = Object.entries(freqList)
  .filter(([word]) => lemmaDict[word])
  .map(([word, count]) => ({ word, count }))
  .sort((a, b) => b.count - a.count);

const totalCount = freqArr.reduce((sum, entry) => sum + entry.count, 0);

const thresholds = [0.95, 0.98, 0.99];
const coverage = new Map();
const thousand = [];

let percSoFar = 0.0;

for (const { word, count } of freqArr) {
  percSoFar += count / totalCount;

  for (const threshold of thresholds) {
    if (threshold >= percSoFar) {
      coverage.set(threshold, coverage.get(threshold) || new Set());
      coverage.get(threshold).add(word);
    }
  }

  if (coverage.get(0.95).size === 1000) {
    thousand.push(...coverage.get(0.95));
    console.log(`The top 1000 words cover ${+(percSoFar * 100).toFixed(2)}%.`);
  }
}

const hundredCoverage = {};

for (const { word, count } of freqArr) {
  hundredCoverage[word] = count;
}

const message = `
Your corpus is made up of ${totalCount} words.
${coverage.get(0.95).size} words cover 95%.
${coverage.get(0.98).size} words cover 98%.
${coverage.get(0.99).size} words cover 99%.

Frequency list contains ${freqArr.length} unique word(s).

${((totalWords - missedWords) / totalWords * 100).toFixed(2)}% of words were able to find a definition.
`;

console.log(message);

const frequencies = {
  'nine-five': Array.from(coverage.get(0.95)),
  'nine-eight': Array.from(coverage.get(0.98)),
  'nine-nine': Array.from(coverage.get(0.99)),
  '1k': thousand,
  'hundred': hundredCoverage,
};

for (const [file, data] of Object.entries(frequencies)) {
  writeFileSync(`data/freq/${file}.json`, JSON.stringify(data));
}

writeFileSync('data/freq/info.txt', message);

function getWords(sentence) {
  return sentence.split(/(?=\s)|(?<=\s)|(?=[.,!?—\]\[\)":¡])|(?<=[.,!?—\]\[\(":¡])/g)
    .map(word => {
      if (/[.,!?:"]|\s/.test(word)) {
        return { word, lemma: word };
      }

      for (const text of [word, word.toLowerCase(), toCapitalCase(word)]) {
        if (formPointer[text]) {
          return { word, lemma: formPointer[text] };
        }

        if (lemmaDict[text]) {
          return { word, lemma: text };
        }
      }

      return { word, lemma: word };
    });
}

function getCustomWords(words) {
  const customWordList = [];

  let outer = [...words];

  while (outer.length > 0) {
    let inner = [...outer];

    let matches = 0;
    while (inner.length > 0) {
      let lemmaText = getLemmaText(inner);
      let surfaceText = getSurfaceText(inner);

      let targetText = '';

      const surfaceTextEntries = [surfaceText, surfaceText.toLowerCase(), toCapitalCase(surfaceText)];
      const lemmaTextEntries = [lemmaText, lemmaText.toLowerCase(), toCapitalCase(lemmaText)];

      for (const text of [...surfaceTextEntries, lemmaTextEntries]) {
        if (!targetText) {
          if (lemmaDict[text]) targetText = text;
        }
      }

      if (!targetText) {
        for (const text of surfaceTextEntries) {
          if (!targetText) {
            if (formPointer[text])
              targetText = formPointer[text];
          }
        }
      }

      if (targetText !== '') {
        customWordList.push({ word: targetText, surface: surfaceText });
        matches = inner.length;
        inner.splice(0, inner.length);
      }

      inner.pop();
    }
    if (matches === 0) {
      const [missing] = [...outer];

      const { word } = missing;

      customWordList.push({ word: '', surface: word });
      outer.shift();
    } else outer.splice(0, matches);
  }

  return customWordList;
}

function toCapitalCase(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function getLemmaText(input) {
  return input.reduce((output, entry) => output + entry.lemma, '');
}

function getSurfaceText(input) {
  return input.reduce((output, entry) => output + entry.word, '');
}
