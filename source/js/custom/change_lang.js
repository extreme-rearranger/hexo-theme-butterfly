document.addEventListener('DOMContentLoaded', function () {
  const languages = JSON.parse(document.documentElement.getAttribute('lang'))
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
  
  function langToText(lang) {
    if (lang === 'ko') return 'Korean'
    if (lang === 'en') return 'English'
    else return lang
  }

  function setSiteLang() {
    if (pageLanguage !== languages[targetLanguage - 1])
      document.documentElement.setAttribute('site-lang', languages[targetLanguage - 1])
    else
      document.documentElement.removeAttribute('site-lang')
  }
  function changeLang (prev, post) {
    // 1. 각종 redirection url의 링크를 바꿈 (메뉴바, 사이드)
    // 2. 각종 사이드 카드 위젯을 바꿈
    // 3. 각종 언어를 바꿈
    prev_lang = languages[prev-1]
    post_lang = languages[post-1]
    const relative_links = document.querySelectorAll('a[lang-type="relative"]')
    const relative_cards = document.querySelectorAll('div[lang-type="relative"]')
    const relative_texts = document.querySelectorAll('span[lang-type="relative"]')
    if (prev === 0){
      relative_links.forEach(function(link){
        let href = link.getAttribute('href')
        href = `/${post_lang}${href}`
        link.setAttribute('href', href)
      })
      relative_cards.forEach(function(card){
        if (card.getAttribute('language') !== post_lang)
          card.style['display']  = 'none';
      })
      relative_texts.forEach(function(text){
        if (text.getAttribute('language') !== post_lang)
          text.style['display']  = 'none';
      })
    } else {
      relative_links.forEach(function(link){
        let href = link.getAttribute('href').split('/')
        href.splice(1,1,post_lang)
        link.setAttribute('href', href.join('/'))
      })
      relative_cards.forEach(function(card){
        if (card.getAttribute('language') === prev_lang)
          card.style['display']  = 'none';
        else if (card.getAttribute('language') === post_lang)
          card.style.removeProperty('display');
      })
      relative_texts.forEach(function(text){
        if (text.getAttribute('language') === prev_lang)
          text.style['display']  = 'none';
        else if (text.getAttribute('language') === post_lang)
          text.style.removeProperty('display');
      })
      isSnackbar && btf.snackbarShow(`Language changed from [${langToText(prev_lang)}] to [${langToText(post_lang)}]`)
    }
  }
  
  function moveURL (prev, post) {
    // 타겟 언어로 된 동일 게시물이 있는지 확인 후 사이트 완전히 이동
    // 만약 없다면 스낵바로 타겟 언어로 된 동일 게시물이 없음을 안내
    prev_lang = languages[prev-1]
    post_lang = languages[post-1]
    // isSnackbar && btf.snackbarShow(`No corresponding [${langToText(post_lang)}] page exists.`)
    isSnackbar && btf.snackbarShow(`Not implemented yet.`)
    
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
  }

  window.changeLangaugeFn = {
    changeLang,
    changeLanguagePage,
    languageInitialization
  }

  languageInitialization()
  btf.addGlobalFn('pjaxComplete', languageInitialization, 'languageInitialization')
})
