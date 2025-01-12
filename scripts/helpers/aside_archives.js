'use strict'

const {
  postFilter,
} = require('../custom_helpers/i18n')(hexo);

hexo.extend.helper.register('aside_archives', function (options = {}) {
  const { config, page, site, url_for_lang, _p } = this
  const {
    archive_dir: archiveDir,
    timezone,
    language
  } = config

  // Destructure and set default options with object destructuring
  const {
    type = 'monthly',
    format = type === 'monthly' ? 'MMMM YYYY' : 'YYYY',
    show_count: showCount = true,
    order = -1,
    limit,
    transform
  } = options

  // Optimize locale handling
  const lang = toMomentLocale(options.lang || page.lang || page.language || language)
  
  // Memoize comparison function to improve performance
  const compareFunc = type === 'monthly'
    ? (yearA, monthA, yearB, monthB) => yearA === yearB && monthA === monthB
    : (yearA, yearB) => yearA === yearB

  // Set langPrefix (if it is 'default' page)
  let langPrefix = this.is_default_language(this.page_language()) ? `${lang}.` : ''
  
  // Use postFilter to filter posts by language
  const posts = site.posts.sort('date', order).filter(postFilter(lang))
  
  if (!posts.length) return ''

  let result = ''
  
  const data = posts.reduce((acc, post) => {
    // Clone the date object to avoid pollution
    let date = post.date.clone()
    if (timezone) date = date.tz(timezone)

    const year = date.year()
    const month = date.month() + 1

    if (lang) date = date.locale(lang)
    
    // Find or create archive entry
    const lastEntry = acc[acc.length - 1]
    if (!lastEntry || !compareFunc(
      lastEntry.year,
      lastEntry.month,
      year,
      month
    )) {
      acc.push({
        name: date.format(format),
        year,
        month,
        count: 1
      })
    } else {
      lastEntry.count++
    }

    return acc
  }, [])

  // Create link generator function
  const createArchiveLink = item => {
    let url = `${archiveDir}/${item.year}/`
    if (type === 'monthly') {
      url += item.month < 10 ? `0${item.month}/` : `${item.month}/`
    }
    return url_for_lang(lang+'/'+url)
  }


  // Limit results efficiently
  const limitedData = limit > 0
    ? data.slice(0, Math.min(data.length, limit))
    : data

  // Use template literal for better readability
  const archiveHeader = `
    <div class="item-headline">
      <i class="fas fa-archive"></i>
      <span>${_p(langPrefix+'aside.card_archives')}</span>
      ${((data.length > limitedData.length) || config.theme_config.aside.force_more_button)
        ? `<a class="card-more-btn" href="${url_for_lang(lang+'/'+archiveDir)}/"
            title="${_p(langPrefix+'aside.more_button')}">
            ${_p(langPrefix+'aside.more_button')}
            <i class="fas fa-angle-right"></i>
          </a>`
        : ''}
    </div>
  `

  // Use map for generating list items, join for performance
  const archiveList = `
    <ul class="card-archive-list">
      ${limitedData.map(item => `
        <li class="card-archive-list-item">
          <a class="card-archive-list-link" href="${createArchiveLink(item)}">
            <span class="card-archive-list-date">
              ${transform ? transform(item.name) : item.name}
            </span>
            ${showCount
              ? `<span class="card-archive-list-count">${item.count}</span>`
              : ''}
          </a>
        </li>
      `).join('')}
    </ul>
  `
  return archiveHeader + archiveList
})

const toMomentLocale = function (lang) {
  if (!lang || lang === undefined || lang === 'default') {
    return 'default'
  }
  return lang.toLowerCase().replace('_', '-')
}
