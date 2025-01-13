'use strict'

const { postDesc } = require('../common/postDesc');

const { isDefaultLanguage, getPageLanguage, getDisplayLanguages } = require('../custom_helpers/i18n')(hexo);

hexo.extend.helper.register('related_posts', function (currentPost, allPosts) {
  let relatedPosts = []
  const tagsData = currentPost.tags
  tagsData.length && tagsData.forEach(function (tag) {
    allPosts.forEach(function (post) {
      if ((currentPost.lang === post.lang || isDefaultLanguage(getPageLanguage(post)) || isDefaultLanguage(getPageLanguage(currentPost)))
        && isTagRelated(tag.name, post.tags)) {
        const getPostDesc = post.postDesc || postDesc(post, hexo)
        const relatedPost = {
          post_lang: getPageLanguage(post),
          title: post.title,
          path: post.path,
          cover: post.cover,
          cover_type: post.cover_type,
          weight: 1,
          updated: post.updated,
          created: post.date,
          postDesc: getPostDesc
        }
        const index = findItem(relatedPosts, 'path', post.path)
        if (index !== -1) {
          relatedPosts[index].weight += 1
        } else {
          if (currentPost.path !== post.path) {
            relatedPosts.push(relatedPost)
          }
        }
      }
    })
  })
  if (relatedPosts.length === 0) {
    return ''
  }
  let result = ''
  const hexoConfig = hexo.config
  const config = hexo.theme.config

  const limitNum = config.related_post.limit || 6
  const dateType = config.related_post.date_type || 'created'
  const defaultCover = config.related_post.default_cover || 'var(--default-bg-color)'
  const setDesc = config.related_post.description || false

  const langPreficesArray = Object.entries(langPrefices)

  relatedPosts = relatedPosts.sort(compare('weight'))

  if (relatedPosts.length > 0) {
    langPreficesArray.forEach(([lang, langPrefix]) => {
      const headlineLang = this._p(langPrefix+'post.recommend')
      let result_tmp = `<div class="card-widget relatedPosts" lang-type="relative" language="${lang}">`
      result_tmp += `<div class="headline"><i class="fas fa-thumbs-up fa-fw"></i><span>${headlineLang}</span></div>`
      result_tmp += '<div class="relatedPosts-list">'
      
      let count = 0
      for (let i = 0; i < relatedPosts.length; i++) {
        let { post_lang, cover, title, path, cover_type, created, updated, postDesc } = relatedPosts[i]
        if ((post_lang !== lang) && !isDefaultLanguage(post_lang)) continue
        else count++
        const { escape_html, url_for, date } = this
        cover = cover || defaultCover
        title = escape_html(title)
        const className = (setDesc && postDesc) ? 'pagination-related' : 'pagination-related no-desc'
        result_tmp += `<a class="${className}" href="${url_for(path)}" title="${title}">`
        if (cover_type === 'img') {
          result_tmp += `<img class="cover" src="${url_for(cover)}" alt="cover">`
        } else {
          result_tmp += `<div class="cover" style="background: ${cover}"></div>`
        }
        if (dateType === 'created') {
          result_tmp += `<div class="info text-center"><div class="info-1"><div class="info-item-1"><i class="fas fa-calendar-plus fa-fw"></i> ${date(created, hexoConfig.date_format)}</div>`
        } else {
          result_tmp += `<div class="info text-center"><div class="info-1"><div class="info-item-1"><i class="fas fa-history fa-fw"></i> ${date(updated, hexoConfig.date_format)}</div>`
        }
        result_tmp += `<div class="info-item-2">${title}</div></div>`

        if (setDesc && postDesc) {
          result_tmp += `<div class="info-2"><div class="info-item-1">${postDesc}</div></div>`
        }
        
        result_tmp += '</div></a>'
        if (count >= limitNum) break
      }
      result_tmp += '</div></div>'
      if (count > 0) result += result_tmp
    })
  }
  return result
})


function isTagRelated (tagName, TBDtags) {
  let result = false
  TBDtags.forEach(function (tag) {
    if (tagName === tag.name) {
      result = true
    }
  })
  return result
}

function findItem (arrayToSearch, attr, val) {
  for (let i = 0; i < arrayToSearch.length; i++) {
    if (arrayToSearch[i][attr] === val) {
      return i
    }
  }
  return -1
}

function compare (attr) {
  return function (a, b) {
    const val1 = a[attr]
    const val2 = b[attr]
    return val2 - val1
  }
}
