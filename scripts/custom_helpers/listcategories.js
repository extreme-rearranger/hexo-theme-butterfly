
const hexo_util_1 = require("hexo-util");
const {
  pathJoin,
  postFilter,
} = require('./i18n')(hexo);

function listCategoriesHelper(categories, options) {
  if (!options && (!categories || !Object.prototype.hasOwnProperty.call(categories, 'length'))) {
    options = categories;
    categories = this.site.categories;
  }
  if (!categories || !categories.length)
    return ''
  options = options || {};
  const { style = 'list', transform, separator = ', ', suffix = '', add_icon } = options;
  const showCount = Object.prototype.hasOwnProperty.call(options, 'show_count') ? options.show_count : true;
  const className = options.class || 'category';
  const depth = options.depth ? parseInt(options.depth, 10) : 0;
  const orderby = options.orderby || 'name';
  const order = options.order || 1;
  const showCurrent = options.show_current || false;
  const childrenIndicator = Object.prototype.hasOwnProperty.call(options, 'children_indicator') ? options.children_indicator : false;
  
  let language = options.lang ? options.lang : this.page.lang
    
  const prepareQuery = parent => {
    const query = parent ? { parent } : { parent: { $exists: false } }
    return categories.find(query).sort(orderby, order).filter(cat => cat.length)
    // return categories_lang.find(query).sort(orderby, order);  // doesn't working
  };

  const hierarchicalList = (cats_lang, level, parent) => {
    let result = '';
    prepareQuery(parent).forEach(cat => {
      let cat_lang = cats_lang.find((e) => e._id === cat._id)
      if (!cat_lang) return
      let child;
      if (!depth || level + 1 < depth) {
        child = hierarchicalList(cats_lang, level + 1, cat_lang._id);
      }
      let isCurrent = false;
      if (showCurrent && this.page) {
        for (let j = 0; j < cat_lang.length; j++) {
          const post = cat_lang.posts.data[j];
          if (post && post._id === this.page._id) {
            isCurrent = true;
            break;
          }
        }
        // special case: category page
        isCurrent = isCurrent || (this.page.base && this.page.base.startsWith(cat_lang.path));
      }
      const additionalClassName = child && childrenIndicator ? ` ${childrenIndicator}` : '';
      result += `<li class="${className}-list-item${additionalClassName}">`;
      if (add_icon) {
        result += `<i class="fa-solid fa-caret-right"></i>`;
      }
      result += `<a class="${className}-list-link${isCurrent ? ' current' : ''}" href="${hexo_util_1.url_for.call(this, cat_lang.path)}${suffix}" lang-type="relative">`;
      result += transform ? transform(cat_lang.name) : cat_lang.name;
      result += '</a>';
      if (showCount) {
        result += `<span class="${className}-list-count">${cat_lang.length}</span>`;
      }
      if (child) {
        result += `<ul class="${className}-list-child">${child}</ul>`;
      }
      result += '</li>';
    });
    return result;
  };

  const flatList = (cats_lang, level, parent) => {
    let result = '';
    prepareQuery(parent).forEach((cat, i) => {
      let cat_lang = cats_lang.find((e) => e._id === cat._id)
      if (i || level)
        result += separator;
      result += `<a class="${className}-link" href="${hexo_util_1.url_for.call(this, cat_lang.path)}${suffix}" lang-type="relative">`;
      result += transform ? transform(cat_lang.name) : cat_lang.name;
      if (showCount) {
        result += `<span class="${className}-count">${cat_lang.length}</span>`;
      }
      result += '</a>';
      if (!depth || level + 1 < depth) {
        result += flatList(cats_lang, level + 1, cat_lang._id);
      }
    });
    return result;
  };

  const categories_lang = categories.map(category => {
    // Filter posts by language considering. Posts without a language is considered of the default language.
    const posts = (language === 'default') ? category.posts : category.posts.filter(postFilter(language));
    if (posts.length === 0) {
      return null;
    }
    return Object.assign({}, category, {
      posts: posts,
      path: (language === 'default') ? category.path : pathJoin(language, category.path),
      length: posts.length
    });
  }).filter(category => category !== null);

  if (!categories_lang.length)
    return ''
    
    if (style === 'list')
      return `<ul class="${className}-list">${hierarchicalList(categories_lang, 0)}</ul>`;
    else
      return flatList(categories_lang, 0);

}

hexo.extend.helper.register('list_categories', listCategoriesHelper)