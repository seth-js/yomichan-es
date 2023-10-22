const { readFileSync, writeFileSync } = require('fs');
const date = require('date-and-time');
const now = new Date();

const currentDate = date.format(now, 'MMM-DD-YYYY');

const lemmaDict = JSON.parse(readFileSync('data/tidy/spanish-lemmas.json'));
const formDict = JSON.parse(readFileSync('data/tidy/spanish-forms.json'));
const popularDict = new Set(JSON.parse(readFileSync('data/freq/nine-five.json')));
const frequencies = JSON.parse(readFileSync('data/freq/hundred.json'));

const lemmaYomi = [];
const allPOS = [];

Object.entries(lemmaDict).forEach((ent) => {
  const [lemma, allInfo] = ent;

  Object.entries(allInfo).forEach((inf) => {
    const [pos, info] = inf;

    if (!allPOS.includes(pos)) allPOS.push(pos);

    const { glosses } = info;

    let tags = [pos];

    if (info['tags']) tags.push(...info['tags']);

    tags = tags.join(' ');

    let ipa = '';

    if (info['ipa']) ipa = info['ipa'];

    let popular = '';

    if (popularDict.has(lemma)) popular = 'P';

    let freq = 0;

    if (frequencies[lemma]) freq = frequencies[lemma];

    // term, ipa, tags, rules, frequency, definitions, sequence, tags2
    lemmaYomi.push([lemma, ipa, tags, '', freq, glosses, 0, popular]);
  });
});

const formYomi = [];

Object.entries(formDict).forEach((ent) => {
  const [form, allInfo] = ent;

  Object.entries(allInfo).forEach((inf) => {
    const [lemma, info] = inf;

    Object.entries(info).forEach((part) => {
      const [pos, glosses] = part;

      const formInfos = [];

      glosses.forEach((gloss) => {
        if (/-automated-/.test(gloss)) {
          const modifiedGloss = gloss.replace('-automated- ', '');

          formInfos.push(
            `${pos} -automated- {${form} -> ${lemma}} ${modifiedGloss} (->${lemma})`,
          );
        } else {
          formInfos.push(`${pos} {${form} -> ${lemma}} ${gloss} (->${lemma})`);
        }
      });

      formYomi.push([form, '', 'non-lemma', '', 0, formInfos, 0, '']);
    });
  });
});

const tagBank = [];

allPOS.forEach((pos) => {
  tagBank.push([pos, 'partOfSpeech', -3, pos, 0]);
});

tagBank.push(['masculine', 'masculine', -3, 'masculine', 0]);
tagBank.push(['feminine', 'feminine', -3, 'feminine', 0]);
tagBank.push(['neuter', 'neuter', -3, 'neuter', 0]);
tagBank.push(['P', 'popular', -10, 'popular term', 10]);

const allYomi = [...lemmaYomi, ...formYomi];

writeFileSync(
  'data/yomichan/tag_bank_1.json',
  JSON.stringify([...tagBank, ['non-lemma', 'non-lemma', -3, 'non-lemma', 0]]),
);

writeFileSync('data/yomichan/term_bank_1.json', JSON.stringify(allYomi));

const freqYomi = [];

Object.entries(frequencies).forEach((entry) => {
  const [word, count] = entry;

  freqYomi.push([word, 'freq', count]);
});

writeFileSync('data/yomichan/term_meta_bank_1.json', JSON.stringify(freqYomi));

writeFileSync(
  'data/yomichan/index.json',
  JSON.stringify({
    title: "Seth's Spanish Dictionary",
    format: 3,
    revision: currentDate,
    sequenced: true,
  }),
);
