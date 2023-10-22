const { writeFileSync } = require('fs');

const LineByLineReader = require('line-by-line');

const lr = new LineByLineReader('data/kaikki/kaikki.org-dictionary-Spanish.json');

const lemmaDict = {};
const formDict = {};

const formStuff = [];
const automatedForms = {};

const blacklistedTags = [
  'table-tags',
  'nominative',
  'canonical',
  'class',
  'error-unknown-tag',
  'error-unrecognized-form',
  'infinitive',
];

lr.on('line', (line) => {
  if (line) {
    const { word, pos, senses, sounds, forms } = JSON.parse(line);

    if (forms) {
      for (const { form, tags } of forms) {
        if (form && tags && !tags.some(value => blacklistedTags.includes(value))) {
          automatedForms[form] ??= {};
          automatedForms[form][word] ??= {};
          automatedForms[form][word][pos] ??= [];

          automatedForms[form][word][pos].push(tags.join(' '));
        }
      }
    }

    let ipa = '';

    if (sounds) {
      for (const sound of sounds) {
        ipa = ipa || sound.ipa;
      }
    }

    for (const sense of senses) {
      const { raw_glosses, form_of, tags } = sense;

      const glosses = raw_glosses || sense.glosses;

      const selectedTags = (tags || []).filter(tag => ['masculine', 'feminine', 'neuter'].includes(tag));

      if (glosses && glosses.length > 0) {
        if (form_of) {
          formStuff.push([word, sense, pos]);
        } else {
          lemmaDict[word] ??= {};
          lemmaDict[word][pos] ??= {};

          lemmaDict[word][pos].ipa ??= ipa;
          lemmaDict[word][pos].glosses ??= [];
          lemmaDict[word][pos].glosses.push(...glosses);

          if (selectedTags.length > 0) {
            lemmaDict[word][pos].tags ??= [];
            for (const tag of selectedTags) {
              if (!lemmaDict[word][pos].tags.includes(tag)) {
                lemmaDict[word][pos].tags.push(tag);
              }
            }
          }
        }
      }
    }
  }
});

lr.on('end', () => {
  for (const [form, info, pos] of formStuff) {
    const { glosses, form_of } = info;
    const lemma = form_of[0].word;

    formDict[form] ??= {};
    formDict[form][lemma] ??= {};
    formDict[form][lemma][pos] ??= [];

    const [formInfo] = glosses;
    formDict[form][lemma][pos].push(formInfo);
  }

  let missingForms = 0;

  for (const [form, info] of Object.entries(automatedForms)) {
    if (!formDict[form]) {
      missingForms += 1;

      // limit forms that point to too many lemmas
      if (Object.keys(info).length < 5) {
        for (const [lemma, parts] of Object.entries(info)) {
          for (const [pos, glosses] of Object.entries(parts)) {
            formDict[form] ??= {};
            formDict[form][lemma] ??= {};
            formDict[form][lemma][pos] ??= [];

            const modifiedGlosses = glosses.map(gloss => `-automated- ${gloss}`);
            formDict[form][lemma][pos].push(...modifiedGlosses);
          }
        }
      }
    }
  }

  console.log(`There were ${missingForms.toLocaleString()} missing forms that have now been automatically populated.`);

  writeFileSync('data/tidy/spanish-lemmas.json', JSON.stringify(lemmaDict));
  writeFileSync('data/tidy/spanish-forms.json', JSON.stringify(formDict));

  console.log('Examples:');
  console.log(lemmaDict.fijar);
  console.log(formDict['fíjate']);

  console.log('Done.');
});
