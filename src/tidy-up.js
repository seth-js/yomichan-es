const { writeFileSync } = require('fs');

const LineByLineReader = require('line-by-line'),
  lr = new LineByLineReader('data/kaikki/kaikki.org-dictionary-Spanish.json');

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
];

lr.on('line', (line) => {
  if (line) {
    const data = JSON.parse(line);

    const { word, pos, senses, sounds, forms } = data;

    if (forms) {
      forms.forEach((ent) => {
        const { form, tags } = ent;

        if (form && tags) {
          let isBlaclisted = false;

          tags.forEach((tag) => {
            if (blacklistedTags.includes(tag)) isBlaclisted = true;
          });

          if (!isBlaclisted) {
            if (!automatedForms[form]) automatedForms[form] = {};
            if (!automatedForms[form][word]) automatedForms[form][word] = {};
            if (!automatedForms[form][word][pos])
              automatedForms[form][word][pos] = [];

            automatedForms[form][word][pos].push(tags.join(' '));
          }
        }
      });
    }

    let ipa = '';

    if (sounds) {
      sounds.forEach((sound) => {
        const soundIPA = sound['ipa'];

        if (soundIPA && !ipa) {
          ipa = soundIPA;
        }
      });
    }

    senses.forEach((sense) => {
      const { raw_glosses, form_of } = sense;

      const tags = [];

      if (sense['tags']) {
        sense['tags'].forEach((tag) => {
          if (tag === 'masculine') tags.push(tag);
          if (tag === 'feminine') tags.push(tag);
          if (tag === 'neuter') tags.push(tag);
        });
      }

      if (raw_glosses) {
        if (form_of) {
          formStuff.push([word, sense, pos]);
        } else {
          if (!lemmaDict[word]) lemmaDict[word] = {};

          if (!lemmaDict[word][pos]) lemmaDict[word][pos] = {};

          if (ipa && !lemmaDict[word][pos]['ipa'])
            lemmaDict[word][pos]['ipa'] = ipa;

          if (!lemmaDict[word][pos]['glosses'])
            lemmaDict[word][pos]['glosses'] = [];

          lemmaDict[word][pos]['glosses'].push(...raw_glosses);

          if (tags) {
            if (!lemmaDict[word][pos]['tags'])
              lemmaDict[word][pos]['tags'] = [];

            tags.forEach((tag) => {
              if (!lemmaDict[word][pos]['tags'].includes(tag))
                lemmaDict[word][pos]['tags'].push(tag);
            });
          }
        }
      }
    });
  }
});

lr.on('end', () => {
  formStuff.forEach((stuff) => {
    const [form, info, pos] = stuff;

    const { raw_glosses, form_of } = info;

    const lemma = form_of[0]['word'];

    if (!formDict[form]) formDict[form] = {};
    if (!formDict[form][lemma]) formDict[form][lemma] = {};
    if (!formDict[form][lemma][pos]) formDict[form][lemma][pos] = [];

    const [formInfo] = raw_glosses;

    formDict[form][lemma][pos].push(formInfo);
  });

  let missingForms = 0;

  Object.entries(automatedForms).forEach((ent) => {
    const [form, info] = ent;

    if (!formDict[form]) {
      missingForms += 1;

      // avoid forms that incorrectly point to a shit ton of lemmas
      if (Object.entries(info).length < 5) {
        Object.entries(info).forEach((inf) => {
          const [lemma, parts] = inf;

          Object.entries(parts).forEach((part) => {
            const [pos, glosses] = part;

            if (!formDict[form]) formDict[form] = {};
            if (!formDict[form][lemma]) formDict[form][lemma] = {};
            if (!formDict[form][lemma][pos]) formDict[form][lemma][pos] = [];

            let modifiedGlosses = [];

            glosses.forEach((gloss) => {
              modifiedGlosses.push(`-automated- ${gloss}`);
            });

            formDict[form][lemma][pos].push(...modifiedGlosses);
          });
        });
      }
    }
  });

  console.log(
    `There were ${missingForms} missing forms that have now been automatically populated.`,
  );

  writeFileSync('data/tidy/spanish-lemmas.json', JSON.stringify(lemmaDict));
  writeFileSync('data/tidy/spanish-forms.json', JSON.stringify(formDict));

  console.log(lemmaDict['fíjate'])
  console.log(formDict['fíjate'])

  console.log('Done.');
});
