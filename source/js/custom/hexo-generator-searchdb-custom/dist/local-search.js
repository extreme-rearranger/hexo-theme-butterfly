/**
 * Refer to hexo-generator-searchdb
 * https://github.com/next-theme/hexo-generator-searchdb/blob/main/dist/search.js
 * 
 * First Modified by hexo-theme-butterfly
 * Then Add the ability to search by language, tags, and categories
 */


class LocalSearch {
  constructor ({
    path = '',
    unescape = false,
    top_n_per_article = 1
  }) {
    this.path = path
    this.unescape = unescape
    this.top_n_per_article = top_n_per_article
    this.isfetched = false
    this.datas = null
  }

  getIndexByWord (words, text, caseSensitive = false) {
    const index = []
    const included = new Set()

    if (!caseSensitive) {
      text = text.toLowerCase()
    }
    words.forEach(word => {
      if (this.unescape) {
        const div = document.createElement('div')
        div.innerText = word
        word = div.innerHTML
      }
      const wordLen = word.length
      if (wordLen === 0) return
      let startPosition = 0
      let position = -1
      if (!caseSensitive) {
        word = word.toLowerCase()
      }
      while ((position = text.indexOf(word, startPosition)) > -1) {
        index.push({ position, word })
        included.add(word)
        startPosition = position + wordLen
      }
    })
    // Sort index by position of keyword
    index.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position
      }
      return right.word.length - left.word.length
    })
    return [index, included]
  }

  // Merge hits into slices
  mergeIntoSlice (start, end, index) {
    let item = index[0]
    let { position, word } = item
    const hits = []
    const count = new Set()
    while (position + word.length <= end && index.length !== 0) {
      count.add(word)
      hits.push({
        position,
        length: word.length
      })
      const wordEnd = position + word.length

      // Move to next position of hit
      index.shift()
      while (index.length !== 0) {
        item = index[0]
        position = item.position
        word = item.word
        if (wordEnd > position) {
          index.shift()
        } else {
          break
        }
      }
    }
    return {
      hits,
      start,
      end,
      count: count.size
    }
  }

  // Highlight title and content
  highlightKeyword (val, slice) {
    let result = ''
    let index = slice.start
    for (const { position, length } of slice.hits) {
      result += val.substring(index, position)
      index = position + length
      result += `<mark class="search-keyword">${val.substr(position, length)}</mark>`
    }
    result += val.substring(index, slice.end)
    return result
  }

  getResultItems (keywords) {
    const resultItems = []
    this.datas.forEach(({ title, language, tags, categories, content, url }) => {
      // The number of different keywords included in the article.
      const [indexOfTitle, keysOfTitle] = this.getIndexByWord(keywords, title)
      const indexAndkeysOfTags = tags.map(tag => this.getIndexByWord(keywords, tag))
      const indexAndkeydOfCategories = categories.map(cat => this.getIndexByWord(keywords, cat))
      const [indexOfContent, keysOfContent] = this.getIndexByWord(keywords, content)

      // Change includedCount into weighted value (title: 3, tags: 2, categories: 2, content: 1)
      // const includedCount = new Set([...keysOfTitle, ...keysOfContent]).size  // ORIGINAL
      const includedCount = keysOfTitle.size * 3 +
                            indexAndkeysOfTags.reduce((acc, [_, keys]) => acc + keys.size, 0) * 2 +
                            indexAndkeydOfCategories.reduce((acc, [_, keys]) => acc + keys.size, 0) * 2 +
                            keysOfContent.size

      // Show search results
      // const hitCount = indexOfTitle.length + indexOfContent.length  // ORIGINAL
      const hitCount = indexOfTitle.length + indexOfContent.length + 
                      indexAndkeysOfTags.reduce((acc, [index, _]) => acc + index.length, 0) +
                      indexAndkeydOfCategories.reduce((acc, [index, _]) => acc + index.length, 0)
      if (hitCount === 0) return

      const slicesOfTitle = []
      if (indexOfTitle.length !== 0) {
        slicesOfTitle.push(this.mergeIntoSlice(0, title.length, indexOfTitle))
      }

      const slicesOfTags = []
      indexAndkeysOfTags.forEach((indexAndkeysOfTag, index) => {
        const [indexOfTag, _] = indexAndkeysOfTag
        if (indexOfTag.length !== 0) {
          slicesOfTags.push(this.mergeIntoSlice(0, tags[index].length, indexOfTag))
        }
        else {
          slicesOfTags.push(null)
        }
      })

      const slicesOfCategories = []
      indexAndkeydOfCategories.forEach((indexAndkeydOfCategory, index) => {
        const [indexOfCategory, _] = indexAndkeydOfCategory
        if (indexOfCategory.length !== 0) {
          slicesOfCategories.push(this.mergeIntoSlice(0, categories[index].length, indexOfCategory))
        }
        else {
          slicesOfCategories.push(null)
        }
      })

      let slicesOfContent = []
      while (indexOfContent.length !== 0) {
        const item = indexOfContent[0]
        const { position } = item
        // Cut out 120 characters. The maxlength of .search-input is 80.
        const start = Math.max(0, position - 20)
        const end = Math.min(content.length, position + 100)
        slicesOfContent.push(this.mergeIntoSlice(start, end, indexOfContent))
      }

      // Sort slices in content by included keywords' count and hits' count
      slicesOfContent.sort((left, right) => {
        if (left.count !== right.count) {
          return right.count - left.count
        } else if (left.hits.length !== right.hits.length) {
          return right.hits.length - left.hits.length
        }
        return left.start - right.start
      })

      // Select top N slices in content
      const upperBound = parseInt(this.top_n_per_article, 10)
      if (upperBound >= 0) {
        slicesOfContent = slicesOfContent.slice(0, upperBound)
      }

      let resultItem = ''

      url = new URL(url, location.origin)
      url.searchParams.append('highlight', keywords.join(' '))

      if (slicesOfTitle.length !== 0) {
        resultItem += `<div class="local-search-hit-item"><a href="${url.href}"><span class="search-result-title">${this.highlightKeyword(title, slicesOfTitle[0])}</span>`
      } else {
        resultItem += `<div class="local-search-hit-item"><a href="${url.href}"><span class="search-result-title">${title}</span>`
      }

      resultItem += '<div style="font-size: 0.9em; font-weight: 450; color:#999;">'
      if (slicesOfTags.filter(slice => slice).length !== 0) {
        resultItem += `<div class="search-result-tags" style="display:inline-block; padding-right:10px;">[Tags] `
        slicesOfTags.forEach((slice, index) => {
          if (slice) {
            resultItem += `<span class="search-result-tag">${this.highlightKeyword(tags[index], slice)}</span>, `
          }
        })
        resultItem = resultItem.slice(0, -2) + '</div>'
      }

      if (slicesOfCategories.filter(slice => slice).length !== 0) {
        resultItem += `<div class="search-result-categories" style="display:inline-block;">[Categories] `
        slicesOfCategories.forEach((slice, index) => {
          if (slice) {
            resultItem += `<span class="search-result-category">${this.highlightKeyword(categories[index], slice)}</span>, `
          }
        })
        resultItem = resultItem.slice(0, -2) + '</div>'
      }
      resultItem += '</div>'

      slicesOfContent.forEach(slice => {
        resultItem += `<p class="search-result">${this.highlightKeyword(content, slice)}...</p></a>`
      })

      resultItem += '</div>'
      resultItems.push({
        item: resultItem,
        id: resultItems.length,
        hitCount,
        includedCount,
        language
      })
    })
    return resultItems
  }

  fetchData () {
    const isXml = !this.path.endsWith('json')
    fetch(this.path)
      .then(response => response.text())
      .then(res => {
        // Get the contents from search data
        this.isfetched = true
        this.datas = isXml
          ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => ({
              title: element.querySelector('title').textContent,
              language: element.querySelector('language').textContent,
              tags: element.querySelector('tags').textContent,
              categories: element.querySelector('categories').textContent,
              content: element.querySelector('content').textContent,
              url: element.querySelector('url').textContent
            }))
          : JSON.parse(res)
        // Only match articles with non-empty titles
        this.datas = this.datas.filter(data => data.title).map(data => {
          data.title = data.title.trim()
          data.tags = data.tags ? data.tags.trim().replace(/\n[\s]+/g, '\n').split('\n') : []
          data.categories = data.categories ? data.categories.trim().replace(/\n[\s]+/g, '\n').split('\n') : []
          data.content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : ''
          data.url = decodeURIComponent(data.url).replace(/\/{2,}/g, '/')
          return data
        })
        // Remove loading animation
        window.dispatchEvent(new Event('search:loaded'))
      })
  }

  // Highlight by wrapping node in mark elements with the given class name
  highlightText (node, slice, className) {
    const val = node.nodeValue
    let index = slice.start
    const children = []
    for (const { position, length } of slice.hits) {
      const text = document.createTextNode(val.substring(index, position))
      index = position + length
      const mark = document.createElement('mark')
      mark.className = className
      mark.appendChild(document.createTextNode(val.substr(position, length)))
      children.push(text, mark)
    }
    node.nodeValue = val.substring(index, slice.end)
    children.forEach(element => {
      node.parentNode.insertBefore(element, node)
    })
  }

  // Highlight the search words provided in the url in the text
  highlightSearchWords (body) {
    const params = new URL(location.href).searchParams.get('highlight')
    const keywords = params ? params.split(' ') : []
    if (!keywords.length || !body) return
    const walk = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null)
    const allNodes = []
    while (walk.nextNode()) {
      if (!walk.currentNode.parentNode.matches('button, select, textarea, .mermaid')) allNodes.push(walk.currentNode)
    }
    allNodes.forEach(node => {
      const [indexOfNode] = this.getIndexByWord(keywords, node.nodeValue)
      if (!indexOfNode.length) return
      const slice = this.mergeIntoSlice(0, node.nodeValue.length, indexOfNode)
      this.highlightText(node, slice, 'search-keyword')
    })
  }
}

window.addEventListener('load', () => {
// Search
  const { path, top_n_per_article, unescape, languages } = GLOBAL_CONFIG.localSearch
  const localSearch = new LocalSearch({
    path,
    top_n_per_article,
    unescape
  })

  const currentLanguage = document.documentElement.getAttribute('page-lang') === 'default' 
      ? document.documentElement.getAttribute('site-lang')
      : document.documentElement.getAttribute('page-lang')

  const input = document.querySelector('#local-search-input input')
  const statsItem = document.getElementById('local-search-stats-wrap')
  const $loadingStatus = document.getElementById('loading-status')
  const isXml = !path.endsWith('json')
  
  const inputEventFunction = () => {
    if (!localSearch.isfetched) return
    let searchText = input.value.trim().toLowerCase()
    isXml && (searchText = searchText.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    if (searchText !== '') $loadingStatus.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>'
    const keywords = searchText.split(/[-\s]+/)
    const container = document.getElementById('local-search-results')
    const siteLang = document.querySelector('html').getAttribute('site-lang') || document.querySelector('html').getAttribute('page-lang')
    let resultItems = []
    if (searchText.length > 0) {
    // Perform local searching
      resultItems = localSearch.getResultItems(keywords)
    }
    if (keywords.length === 1 && keywords[0] === '') {
      container.textContent = ''
      statsItem.textContent = ''
    } else if (resultItems.length === 0) {
      container.textContent = ''
      const statsDiv = document.createElement('div')
      statsDiv.className = 'search-result-stats'
      // statsDiv.textContent = languages.hits_empty.replace(/\$\{query}/, searchText)
      statsDiv.innerHTML = languages.map((item) => {
        if (item.lang === currentLanguage) {
          return `<span lang-type='relative' language=${item.lang}>${item.hits_empty.replace(/\$\{query}/, searchText)}</span>`
        } else {
          return `<span lang-type='relative' language=${item.lang} style="display: none;">${item.hits_empty.replace(/\$\{query}/, searchText)}</span>`
        }
      }).join('')
      statsItem.innerHTML = statsDiv.outerHTML
    } else {
      resultItems.sort((left, right) => {
        left_count = (siteLang === left.language) || left.language === 'default' ? left.includedCount + 10000 : left.includedCount
        right_count = (siteLang === right.language) || right.language === 'default' ? right.includedCount + 10000 : right.includedCount
        console.log(siteLang, left.language, left_count, right.language, right_count)
        if (left_count !== right_count) {
          return right_count - left_count
        } else if (left.hitCount !== right.hitCount) {
          return right.hitCount - left.hitCount
        }
        return right.id - left.id
      })

      // const stats = languages.hits_stats.replace(/\$\{hits}/, resultItems.length)
      const stats = languages.map((item) => {
        if (item.lang === currentLanguage) {
          return `<span lang-type='relative' language=${item.lang}>${item.hits_stats.replace(/\$\{hits}/, resultItems.length)}</span>`
        } else {
          return `<span lang-type='relative' language=${item.lang} style="display: none;">${item.hits_stats.replace(/\$\{hits}/, resultItems.length)}</span>`
        }
      }).join('')

      container.innerHTML = `<div class="search-result-list">${resultItems.map(result => result.item).join('')}</div>`
      statsItem.innerHTML = `<hr><div class="search-result-stats">${stats}</div>`
      window.pjax && window.pjax.refresh(container)
    }

    $loadingStatus.textContent = ''
  }

  let loadFlag = false
  const $searchMask = document.getElementById('search-mask')
  const $searchDialog = document.querySelector('#local-search .search-dialog')

  // fix safari
  const fixSafariHeight = () => {
    if (window.innerWidth < 768) {
      $searchDialog.style.setProperty('--search-height', window.innerHeight + 'px')
    }
  }

  const openSearch = () => {
    const bodyStyle = document.body.style
    bodyStyle.width = '100%'
    bodyStyle.overflow = 'hidden'
    btf.animateIn($searchMask, 'to_show 0.5s')
    btf.animateIn($searchDialog, 'titleScale 0.5s')
    setTimeout(() => { input.focus() }, 300)
    if (!loadFlag) {
      !localSearch.isfetched && localSearch.fetchData()
      input.addEventListener('input', inputEventFunction)
      loadFlag = true
    }
    // shortcut: ESC
    document.addEventListener('keydown', function f (event) {
      if (event.code === 'Escape') {
        closeSearch()
        document.removeEventListener('keydown', f)
      }
    })

    fixSafariHeight()
    window.addEventListener('resize', fixSafariHeight)
  }

  const closeSearch = () => {
    const bodyStyle = document.body.style
    bodyStyle.width = ''
    bodyStyle.overflow = ''
    btf.animateOut($searchDialog, 'search_close .5s')
    btf.animateOut($searchMask, 'to_hide 0.5s')
    window.removeEventListener('resize', fixSafariHeight)
  }

  const searchClickFn = () => {
    btf.addEventListenerPjax(document.querySelector('#search-button > .search'), 'click', openSearch)
  }

  const searchFnOnce = () => {
    document.querySelector('#local-search .search-close-button').addEventListener('click', closeSearch)
    $searchMask.addEventListener('click', closeSearch)
    if (GLOBAL_CONFIG.localSearch.preload) {
      localSearch.fetchData()
    }
    localSearch.highlightSearchWords(document.getElementById('article-container'))
  }

  window.addEventListener('search:loaded', () => {
    const $loadDataItem = document.getElementById('loading-database')
    $loadDataItem.nextElementSibling.style.display = 'block'
    $loadDataItem.remove()
  })

  searchClickFn()
  searchFnOnce()

  // pjax
  window.addEventListener('pjax:complete', () => {
    !btf.isHidden($searchMask) && closeSearch()
    localSearch.highlightSearchWords(document.getElementById('article-container'))
    searchClickFn()
  })
})
