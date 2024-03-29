# yomichan-es 🇪🇸


### A Spanish hover dictionary. It's a modified version of Yomichan that works with Spanish (Castilian).


#### Examples:
![example-1](https://user-images.githubusercontent.com/83692925/216789784-6ae72ba2-2d23-43c7-b9ec-e4112b4b0314.png)
![example-2](https://user-images.githubusercontent.com/83692925/216789787-ce149726-57c7-4c31-b9a1-805f26dc5a1e.png)

### Instructions (firefox)
1. Download the repository, clone it, whatever.

2. Download `yomichan-settings-2023-10-22.json`, `Spanish.Dictionary.zip`, and `Spanish.Forvo.zip` from the [Releases](https://github.com/seth-js/yomichan-es/releases) section.

3. Go to: about:debugging#/runtime/this-firefox

4. Click `Load Temporary Add-on`…

5. Navigate to `yomichan-firefox/manifest.json` in the repository and choose it.

*Yomichan should now be installed.*

6. Head to the bottom of the Yomichan settings page.

7. Select `Import Settings`.

8. Choose `yomichan-settings-2023-10-22.json`

9. Search for `Enable search page clipboard text monitoring` and turn it off and on.

10. Go to the `Dictionaries` section and import `Spanish.Dictionary.zip`

### Instructions (chromium-based)
1. Download the repository, clone it, whatever.

2. Download `yomichan-settings-2023-10-22.json`, `Spanish.Dictionary.zip`, and `Spanish.Forvo.zip` from the [Releases](https://github.com/seth-js/yomichan-es/releases) section.

3. Go to: chrome://extensions/

4. Turn on `Developer mode`

5. Click `Load unpacked`

6. Navigate to `yomichan-chromium` in the repository, and select the folder.

*Yomichan should now be installed.*

7. Head to the bottom of the Yomichan settings page.

8. Select `Import Settings`.

9. Choose `yomichan-settings-2023-10-22.json`

10. Search for `Enable search page clipboard text monitoring` and turn it off and on.

11. Go to the `Dictionaries` section and import `Spanish.Dictionary.zip`

*Everything should now be set up for Yomichan on Firefox/Chromium.*

### Forvo setup

1. Extract the `Spanish Forvo` folder from `Spanish.Forvo.zip`

2. Throw it in your `addons21` folder in your [Anki appdata folder](https://docs.ankiweb.net/files.html?file-locations#file-locations).

*Mine's in `C:\Users\[Username]\AppData\Roaming\Anki2\addons21`*

3. Install [AnkiConnect](https://ankiweb.net/shared/info/2055492159).

4. Restart Anki.

*Anki must be open to connect to the Forvo server.*

#### Inflected audio feature

I added the ability to hear the inflected version of the word you've clicked on. By clicking the sound button while holding the Alt key, it will play the inflected version (ex. quiero instead of querer).

### Notes

If you are already using Yomichan for Japanese, consider using this extension in a separate browser profile. This is a modified version of Yomichan and the unmodified version will have unintended results.

The dictionary takes data from [Kaikki's Spanish Wiktionary dump](https://kaikki.org/dictionary/Spanish/) and specially formats it to work with this custom version of Yomichan. It contains over ~135,000 lemmas. That sounds like a lot, but there are still cases where you'll encounter a word that doesn't have a definition.

Many thanks to [Tatu Ylonen](http://www.lrec-conf.org/proceedings/lrec2022/pdf/2022.lrec-1.140.pdf)'s project [Wiktextract](https://github.com/tatuylonen/wiktextract). Without it, this project, and others I've made like it wouldn't exist.

I also want to thank [Alexei Yatskov](https://github.com/FooSoft) for creating Yomichan. It's the best hover dictionary available, and I'm glad I've been able to tweak it to work with other languages.

The Firefox extension unfortunately doesn't survive restarts. This means you'll have to add it through the debugging page each time, although your settings and the dictionary will not be lost.

Chrome is planning to drop support for extensions that use Manifest V2. This means that unless the developer for Yomichan updates it by then, Chrome may no longer be supported.

Frequency data was created from parsing a collection of [Spanish Netflix subtitles](https://github.com/seth-js/lang-sub-collection/tree/main/European%20Spanish%20(Netflix)). The parser used the Kaikki data as well. Phrases like "acabar de" were correctly parsed as such rather than seperately as "ababar" and "de". Words found in the 98% coverage list I created are marked as popular.
