hexo.extend.filter.register('after_render:html', (str, data) => {
  // console.log(str)
  // console.log(data)
  /**
  * Add Footnotes Detail (Header and ToC)
  */
  const cheerio = require('cheerio')
  const $ = cheerio.load(str)

  const page_language = $('html').attr('page-lang') || data.page.language
  const footnote_lang = {
    en: {
      h1: 'References',
      li: 'References'
    },
    ko: {
      h1: '참고 링크',
      li: '참고 링크'
    }
  }
  // add h1 above footnote list
  const $footnotes_list = $('section.footnotes')
  if ($footnotes_list.length) {
    const h1 = $(`<h1 id="References"></h1>`)
    if (footnote_lang[page_language]) {
      h1.text(footnote_lang[page_language].h1)
    } else {
      Object.keys(footnote_lang).forEach(lang => {
        h1.html(h1.html() + `<span lang-type="relative" language="${lang}">${footnote_lang[lang].h1}</span>`)
      })
    }
    $footnotes_list.before(h1)

    // add li on the bottom of the ToC
    const $toc = $('#card-toc > .toc-content > ol.toc > li:last-child')
    if ($toc.length) {
      const li = $(`<li class="toc-item toc-level-1"><a class="toc-link" href="#References"></a></li>`)
      if (footnote_lang[page_language]) {
        li.find('a').html(`<span class="toc-text">${footnote_lang[page_language].li}</span>`)
      } else {
        Object.keys(footnote_lang).forEach(lang => {
          li.find('a').html(li.find('a').html() + `<span class="toc-text" lang-type="relative" language="${lang}">${footnote_lang[lang].li}</span>`)
        })
      }

      $toc.after(li)
    }
  }
  
  
  return $.html()

})