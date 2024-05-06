# hexo-theme-butterfly (forked)

![master version](https://img.shields.io/github/package-json/v/jerryc127/hexo-theme-butterfly/master?color=%231ab1ad&label=master)
![master version](https://img.shields.io/github/package-json/v/jerryc127/hexo-theme-butterfly/dev?label=dev)
![https://img.shields.io/npm/v/hexo-theme-butterfly?color=%09%23bf00ff](https://img.shields.io/npm/v/hexo-theme-butterfly?color=%09%23bf00ff)
![hexo version](https://img.shields.io/badge/hexo-5.3.0+-0e83c)
![license](https://img.shields.io/github/license/jerryc127/hexo-theme-butterfly?color=FF5531)

![](https://cdn.jsdelivr.net/gh/jerryc127/CDN@m2/img/theme-butterfly-readme.png)


## Changed to Multilingual (Check commits from 2024-04-19 to 2024-04-20)
>In my blog, the basic goal was to make English and Korean cross-support possible.<br>
> So I used the 'hexo-generator-i18n' plug-in.<br>

> In addition, many scripts using '_p()' have been modified to make the default language page (e.g., about.html) common to all languages.<br>

> By doing this, **posts set in the 'default' language can alternately display both languages** through the right side button, and furthermore, **they are accessible to all archive/tags/categories regardless of language**.

### install generators for multilingual pages
```bash
npm install hexo-generator-i18n --save
```

### add i18n-related files in `scripts` directory
- get `i18n.js`, `rfc5646.js`, and `10_i18n.js` files from [hexo-theme-minos](https://github.com/ppoffice/hexo-theme-minos)'.
- Then add the three files into `butterfly/layout/includes/scripts`.<br>I add directory name `custom_helpers` to distinguish with original files.
- In `10_i18n.js`, `categories()` and `tags()` helpers should be all comment out since the functions don't work in this theme.
- Instead, I made `tagclouds()` and `list_categories()` helpers by referring to the two.
- Therefore, the final file structure is as follows:
```
...
├── scripts/
│   ├── custom_helpers
│   │   ├── 10_i18n.js  # from hexo-theme-minos (except categories() and tags() helpers)
│   │   ├── i18n.js     # from hexo-theme-minos 
│   │   │                 (i've changed isDefaultLanguage() and getDisplayLanguage() a little bit)
│   │   ├── listcategories.js
│   │   ├── rfc5646.js  # from hexo-theme-minos
│   │   └── tagcloud.js
...
```


### change the following to _config.yml
- Can use more than two languages though I used two.

```yaml
language: 
  - default
  - en
  - ko
language_default: default
i18n_dir: :lang
i18n: # hexo-generator-i18n settings
  type:
    # - page  # if active, then page_title, ko/page_title, en/page_title are all available with the same content
    # - post  # if active, then posts/:title, en/posts/:title, ko/posts/:title are all avaliable (this is not recommended since :title already contains language information)
  generator:  # all inactive since every helpers is defined in 10_i18n.js
    # - archive
    # - category
    # - tag
    # - index
```


### add default.yml, en.yml, and ko.yml in `languages` directory
- `default.yml` should contains all languages as the first level key.
- I copied and pasted the contents of `en.yml` and `ko.yml` to `default.yml`.<br>Then, added the `en` and `ko` keys in the first level.


### add the language as prefix to the `_p()` function's parameter
- In this theme, the `_p()` function is used to get the language-specific content.
- Since I want to use all language contents in the default language page, I added the language as prefix to the parameter of `_p()` function.
- For instance, if it had previously been written as `_p('page_title')`, then I changed it to `_p('en.page.title')` and `_p('ko.page.title')` when the language is set to default.
- In this way, the default language page can display both languages alternately if click the language transition button.
- It was a lot of work since i never studied js, pug, and any other front-end languages before.
- So the code might be a little bit messy, but it works pretty well. (maybe haha)


### add html attributes to the language related tags
- In the theme, the language-related tags are used to display the language-specific content.
- For instance, `div` is changed to `div(div(lang-type='relative' language='en')` when the content is written in English.


#### RESULT : Change the following features to support multilingual
- [x] Archive Length Helper (`findArchiveLength.js`)
  - Get archive length in multilingual manner
  - For example, the posts in Korean will be dropped when the page language is set to English.
- [x] Language Transition Button on rightside (`change_lang.js`, ...)
  - If the page language is set to default, then the button changes the text language alternately.
  - If the page language is set to specific language, then the site will be redirected to the same page in the alternative language.
- [x] Tag Cloud Helper (`tagcloud.js`)
  - `/en/tags/` and `/ko/tags/` are available
- [x] List Categories Helper (`listcategories.js`)
  - `/en/categories/` and `/ko/categories/` are available
- [x] Menu and Navigation
  - Some site url changes automatically according to the page language
  - For example, `/en/archive/` changes to `/ko/archive/` when the language is changed
- [x] Index Page with Multilingual Support (see index helper in `10_i18n.js`)
  - `index.html` show all posts
  - `en/index.html` show only English posts
  - `ko/index.html` show only Korean posts
- [X] Aside (Recent Posts, Categories, Tags, Blog Info, Archives) (`aside_categories.js`, `aside_archives.js`, ...)
  - All the aside contents are available in multilingual manner
  - If Language Transition Button is clicked, then the aside contents will be changed to the alternative language
- [X] Search (`source/js/custom/hexo-generator-searchdb-custom`)
  - The search DB is generated in multilingual manner
  - The search result is displayed in the alternative language when the language is changed
  - Also, I add tags and categories to be searched
  - The search result is sorted with weighted score of count (3: title > 2: categories, tags > 1: content)