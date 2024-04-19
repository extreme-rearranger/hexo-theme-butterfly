const { Color } = require('hexo-util')
const {
  pathJoin,
  isDefaultLanguage,
  postFilter,
  getDisplayLanguages,
} = require('./i18n')(hexo);

hexo.extend.helper.register('tagcloud', function (options = {}) {
  // class, level, show_count, count_class params are not available compare to original function.
  const env = this
  let { source, min_font, max_font, unit, orderby, order } = options
  let limit = options.limit ? options.limit : options.amount
  let language = options.lang 
    ? options.lang 
    : (isDefaultLanguage(page.lang) ? getDisplayLanguages()[0] : page.lang)
  const color = options.color
  let startColor, endColor;
  if (color) {
      if (!options.start_color)
          throw new TypeError('start_color is required!');
      if (!options.end_color)
          throw new TypeError('end_color is required!');
      startColor = new Color(options.start_color);
      endColor = new Color(options.end_color);
  }
  
  unit = unit || 'px'
  let tags = source.map(tag => {
      // Filter posts by language considering. Posts without a language is considered of the default language.
      const posts = tag.posts.filter(postFilter(language));
      if (posts.length === 0) {
          return null;
      }
      return Object.assign({}, tag, {
          posts: posts,
          path: pathJoin(language, tag.path)
      });
  }).filter(category => category !== null);
  // console.log(tags)

  let result = ''
  if (limit > 0) {
    source = source.limit(limit)
  }

  const sizes = []
  source.sort('length').forEach(tag => {
    const { length } = tag
    if (sizes.includes(length)) return
    sizes.push(length)
  })

  // Sort the tags
  if (orderby === 'random' || orderby === 'rand') {
    tags = tags.map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
  }
  else {
      tags = tags.sort(orderby, order);
  }

  const length = sizes.length - 1
  tags.forEach(tag => {
    const ratio = length ? sizes.indexOf(tag.length) / length : 0
    const size = min_font + ((max_font - min_font) * ratio)
    let style = `font-size: ${parseFloat(size.toFixed(2))}${unit};`
    let midColor
    if (color) {
      midColor = startColor.mix(endColor, ratio);
      style += ` color: ${midColor.toString()}`;
    }
    else {
      midColor = 'rgb(' + Math.floor(Math.random() * 201) + ', ' + Math.floor(Math.random() * 201) + ', ' + Math.floor(Math.random() * 201) + ')' // 0,0,0 -> 200,200,200
      style += ` color: ${midColor}`
    }
    result += `<a href="${env.url_for(tag.path)}" style="${style}">${tag.name}</a>`
  })
  return result
})
