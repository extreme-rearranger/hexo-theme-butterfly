document.addEventListener('DOMContentLoaded', function () {
  const languages = JSON.parse(document.documentElement.getAttribute('site-lang'))
  const defaultLanguage = 1  // 1 ~ languages.length
  const pageLanguage = document.documentElement.getAttribute('page-lang')
  let currentLanguage
  if (pageLanguage === 'default'){
    currentLanguage = 0
  }else{
    currentLanguage = languages.indexOf(pageLanguage) + 1
  }
  const targetLanguageCookie = 'change-lang'
  let targetLanguage =
    btf.saveToLocal.get(targetLanguageCookie) === undefined
      ? defaultLanguage
      : Number(btf.saveToLocal.get(targetLanguageCookie))
  let languageButtonObject
  const snackbarData = GLOBAL_CONFIG.Snackbar
  const isSnackbar = snackbarData !== undefined
  const search_config = GLOBAL_CONFIG.localSearch || GLOBAL_CONFIG.algolia

  function langToText(lang) {
    if (lang === 'ko') return 'Korean'
    if (lang === 'en') return 'English'
    else return lang
  }

  function setSiteLang() {
    if (pageLanguage !== languages[targetLanguage - 1])
      document.documentElement.setAttribute('lang', languages[targetLanguage - 1])

    if (search_config) {
      document.querySelector('#local-search-input input').setAttribute('placeholder', 
        search_config.languages.find(item => item.lang === languages[targetLanguage - 1]).input_placeholder)
    }
  }
  function changeLang (prev, post) {
    // 1. 각종 redirection url의 링크를 바꿈 (메뉴바, 사이드)
    // 2. 각종 사이드 카드 위젯을 바꿈
    // 3. 각종 언어를 바꿈
    // 4. 언어 변경을 스낵바로 알림
    // 5. 검색창의 placeholder를 바꿈
    prev_lang = languages[prev-1]
    post_lang = languages[post-1]
    const relative_links = document.querySelectorAll('a[lang-type="relative"]')
    const relative_divs = document.querySelectorAll('div[lang-type="relative"]')
    const relative_texts = document.querySelectorAll('span[lang-type="relative"]')
    if (prev === 0){
      relative_links.forEach(function(link){
        let href = link.getAttribute('href')
        href = `/${post_lang}${href}`
        link.setAttribute('href', href)
      })
      relative_divs.forEach(function(card){
        if (card.getAttribute('language') !== post_lang)
          card.classList.add('lang-hidden')
      })
      relative_texts.forEach(function(text){
        if (text.getAttribute('language') !== post_lang)
          text.classList.add('lang-hidden')
      })

    } else {
      relative_links.forEach(function(link){
        let href = link.getAttribute('href').split('/')
        href.splice(1,1,post_lang)
        link.setAttribute('href', href.join('/'))
      })
      relative_divs.forEach(function(card){
        if (card.getAttribute('language') === prev_lang)
          card.classList.add('lang-hidden')
        else if (card.getAttribute('language') === post_lang) {
          card.classList.remove('lang-hidden')
        }
      })
      relative_texts.forEach(function(text){
        if (text.getAttribute('language') === prev_lang)
          text.classList.add('lang-hidden')
        else if (text.getAttribute('language') === post_lang)
          text.classList.remove('lang-hidden')
      })

      isSnackbar && btf.snackbarShow(`Language changed from [${langToText(prev_lang)}] to [${langToText(post_lang)}]`)
    }
    if (search_config){
      document.querySelector('#local-search-input input').setAttribute('placeholder', 
        search_config.languages.find(item => item.lang === post_lang).input_placeholder)
    }
  }
  
  function moveURL (prev, post) {
    // 타겟 언어로 된 동일 게시물이 있는지 확인 후 사이트 완전히 이동
    // 만약 없다면 스낵바로 타겟 언어로 된 동일 게시물이 없음을 안내
    prev_lang = languages[prev-1]
    post_lang = languages[post-1]
    
    new_url = window.location.href.replace(`/${prev_lang}/`, `/${post_lang}/`).split('?')[0].split('#')[0]

    window
      .fetch(new_url)
      .then(response => {
        if (response.status === 200) {
          window
            .fetch(new_url, { redirect: 'manual' })
            .then(response => {
              isSnackbar && btf.snackbarShow(`Language will be changed to [${langToText(post_lang)}] in a moment.`)
              setTimeout(() => {
                window.location.href = new_url
              } , 2000)
            })
        } else {
          isSnackbar && btf.snackbarShow(`No corresponding [${langToText(post_lang)}] page exists.`)
        }
      }
    )




    

    // isSnackbar && btf.snackbarShow(`No corresponding [${langToText(post_lang)}] page exists.`)
    // isSnackbar && btf.snackbarShow(`Not implemented yet.`)
    
  }

  function changeLanguagePage () {
    languageButtonObject = document.getElementById('langmode')
    if (languageButtonObject) {
      targetLanguage = currentLanguage === languages.length ? 1 : currentLanguage + 1
      btf.saveToLocal.set(targetLanguageCookie, targetLanguage, 2)
      if (pageLanguage === 'default'){ // if page-lang is default
        setSiteLang()
        changeLang(currentLanguage, targetLanguage)
        currentLanguage = targetLanguage
        changeCardPosition()
      } else {
        moveURL(currentLanguage, targetLanguage)
      }
    }
  }

  function languageInitialization () {
    if (currentLanguage === 0) {
      setSiteLang()
      changeLang(0, targetLanguage)
      currentLanguage = targetLanguage
    }
    changeCardPosition()
  }

  function changeCardPosition () {
    let is_left = true
    const displayed_cards = document.querySelectorAll('div.sticky_layout > div.card-widget:not(#card-toc):not(.lang-hidden)')
    displayed_cards.forEach(function(card){
      if (is_left){
        card.classList.add('card-left')
        card.classList.remove('card-right')
        is_left = false
      } else {
        card.classList.add('card-right')
        card.classList.remove('card-left')
        is_left = true
      }
    })
    if (displayed_cards.length % 2 === 1){
      displayed_cards[displayed_cards.length-1].classList.remove('card-right')
      displayed_cards[displayed_cards.length-1].classList.remove('card-left')
      displayed_cards[displayed_cards.length-1].classList.add('card-full')
    }
  }

  window.changeLangaugeFn = {
    changeLang,
    changeLanguagePage,
    languageInitialization
  }

  languageInitialization()
  btf.addGlobalFn('pjaxComplete', languageInitialization, 'languageInitialization')
})
