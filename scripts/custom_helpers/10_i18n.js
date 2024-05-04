// hexo-theme-minos/scripts/10_i18n.js からコピペ

const _ = require('lodash');
const util = require('hexo-util');
const postGenerator = require('hexo/dist/plugins/generator/post');
const archiveGenerator = require('hexo-generator-archive/lib/generator');
const categoryGenerator = require('hexo-generator-category/lib/generator');
const tagGenerator = require('hexo-generator-tag/lib/generator');
const { magenta } = require('chalk');
const tildify = require('tildify');
const {
    pathJoin,
    isDefaultLanguage,
    url_for,
    postFilter,
    injectLanguages,
    getUsedLanguages,
    getDisplayLanguages,
    getPageLanguage,
    isLanguageValid,
    formatRfc5646,
    formatIso639,
    getClosestRfc5646WithCountryCode
} = require('./i18n')(hexo);

const pagination = require('hexo-pagination');

// Creators

// mask the original post creator
const _original_post_creator = hexo.post.create.bind(hexo.post);

hexo.post.create = async (data, replace) => {
    let res;
    let results = [];
    if(data.path || data.layout == 'draft')
    {
        res = await _original_post_creator(data, replace);
        results.push(res);
    }else{
        for (let lang of getDisplayLanguages()) {
        // filter/new_post_path.jsとhexo/post.jsのPost.createからコピペ
        data.slug = util.slugize((data.slug || data.title).toString(), { transform: hexo.config.filename_case });
        switch (data.layout) {
            case 'page':
            data['path'] = pathJoin(lang, data.slug, 'index');
            break;
        }
        data['language'] = lang;
        let res = await _original_post_creator(data, replace);
        results.push(res);
        hexo.log.info(
            'Posts created in: %s',
            magenta(tildify(res.path))
        );
        }
    }

    for (let i in results) {
        if (i != 0) hexo.log.info('Created: %s', magenta(tildify(results[i].path)));
    }

    return results[0];
};

function injectUsedLanguages(func) {
    return function(locals) {
        return func.call(this, getUsedLanguages(), locals);
    }
}

// mask the original draft creator
hexo.extend.generator.register('index', injectUsedLanguages(function(languages, locals) {
    const config = hexo.config;
    const posts = locals.posts.sort(config.index_generator.order_by);
    
    posts.data.sort((a, b) => (b.sticky || 0) - (a.sticky || 0));

    const paginationDir = config.pagination_dir || 'page';
    const path = config.index_generator.path || '';

    return _.flatten(languages.map((language) => {
        const filteredPosts = isDefaultLanguage(language) ? posts : posts.filter(postFilter(language));
        return pagination(
            isDefaultLanguage(language) ? path : pathJoin(language, path),
            filteredPosts, 
            {
                perPage: config.index_generator.per_page,
                layout: ['index', 'archive'],
                format: paginationDir + '/%d/',
                data: {
                    __index: true
                }
        });
    }));
}));



// hexo-theme-minos/scripts/10_i18n.js　からコピペ
/**
 * Modify previous and next post link
 */
hexo.extend.generator.register('post', function(locals) {
    const langs = getDisplayLanguages();

    let posts = postGenerator(locals);
    posts.forEach(route => {
        tmp_prev = {};
        tmp_next = {};
        for (let lang of langs) {
            tmp_prev[lang] = route.data.prev? route.data.prev : null;
            tmp_next[lang] = route.data.next? route.data.next : null;
        }
        route.data.prev = tmp_prev;
        route.data.next = tmp_next;
    });

    return posts.map(route => {
        let post = route.data;
        
        langs.forEach(lang => {
            // if post language is not default and not equal to the current language, skip
            if (!isDefaultLanguage(post.lang) && post.lang !== lang) {
                delete post.prev[lang];
                delete post.next[lang];
                return;
            }

            // find the previous and next post in the current language
            if (post.next[lang]) {
                let post_next = post.next[lang];
                while (post_next && !isDefaultLanguage(post_next.lang) && (lang !== post_next.lang)) {
                    post_next = post_next.next[lang];
                }
                post.next[lang] = post_next;
                if (post_next) {
                    post_next.prev[lang] = post;
                }
                
            }
            if (post.prev[lang]) {
                let post_prev = post.prev[lang];
                while (post_prev && !isDefaultLanguage(post_prev.lang) && lang !== post_prev.lang) {
                    post_prev = post_prev.prev[lang];
                }
                post.prev[lang] = post_prev;
                if (post_prev) {
                    post_prev.next[lang] = post;
                }
            }

        });

        // console.log('\nCURRENT:', route.path);
        // if (route.data.prev){
        //     console.log('\tPREV:', Object.keys(route.data.prev).map(lang => {
        //         return `${lang}: ${route.data.prev[lang] ? route.data.prev[lang].path : null}`;
        //     }));
        // }
        // if (route.data.next){
        //     console.log('\tNEXT:', Object.keys(route.data.next).map(lang => {
        //         return `${lang}: ${route.data.next[lang] ? route.data.next[lang].path : null}`;
        //     }));
        // }

        return route;
    });
});

/**
 * Multi-language archive generator.
 *
 * ATTENTION: This will override the default archive generator!
 */
hexo.extend.generator.register('archive', injectLanguages(function(languages, locals) {
    return _.flatten(languages.map((language) => {
        // Filter posts by language considering. Posts without a language is considered of the default language.
        const posts = locals.posts.filter(postFilter(language));
        if (posts.length === 0) {
            return null;
        }
        const routes = archiveGenerator.call(this, Object.assign({}, locals, {
            posts: posts
        }));
        return routes.map(route => {
            const data = Object.assign({}, route.data, {
                base: pathJoin(language, route.data.base),
                current_url: pathJoin(language, route.data.current_url)
            });
            return Object.assign({}, route, {
                path: pathJoin(language, route.path),
                data: data
            });
        });
    }).filter(post => post !== null));
}));

/**
 * Multi-language category generator.
 *
 * ATTENTION: This will override the default category generator!
 */
hexo.extend.generator.register('category', injectLanguages(function(languages, locals) {
    return _.flatten(languages.map((language) => {
        const categories = locals.categories.map(category => {
            // Filter posts by language considering. Posts without a language is considered of the default language.
            const posts = category.posts.filter(postFilter(language));
            if (posts.length === 0) {
                return null;
            }
            return Object.assign({}, category, {
                posts: posts
            });
        }).filter(category => category !== null);
        if (categories.length === 0) {
            return null;
        }

        const routes = categoryGenerator.call(this, Object.assign({}, locals, {
            categories: categories
        }));
        return routes.map(route => {
            const data = Object.assign({}, route.data, {
                base: pathJoin(language, route.data.base),
                current_url: pathJoin(language, route.data.current_url)
            });
            return Object.assign({}, route, {
                path: pathJoin(language, route.path),
                data: data
            });
        });
    }).filter(post => post !== null));
}));

/**
 * Multi-language tag generator.
 *
 * ATTENTION: This will override the default tag generator!
 */
hexo.extend.generator.register('tag', injectLanguages(function(languages, locals) {
    return _.flatten(languages.map((language) => {
        const tags = locals.tags.map(tag => {
            // Filter posts by language considering. Posts without a language is considered of the default language.
            const posts = tag.posts.filter(postFilter(language));
            if (posts.length === 0) {
                return null;
            }
            return Object.assign({}, tag, {
                posts: posts
            });
        }).filter(category => category !== null);
        if (tags.length === 0) {
            return null;
        }

        const routes = tagGenerator.call(this, Object.assign({}, locals, {
            tags: tags
        }));

        return routes.map(route => {
            const data = Object.assign({}, route.data, {
                base: pathJoin(language, route.data.base),
                current_url: pathJoin(language, route.data.current_url)
            });
            return Object.assign({}, route, {
                path: pathJoin(language, route.path),
                data: data
            });
        });
    }).filter(post => post !== null));
}));

// /**
//  * Category list page generator
//  */
// hexo.extend.generator.register('categories', injectLanguages(function(languages, locals) {
//     return languages.map((language) => {
//         const categories = locals.categories.map(category => {
//             // Filter posts by language considering. Posts without a language is considered of the default language.
//             const posts = category.posts.filter(postFilter(language));
//             if (posts.length === 0) {
//                 return null;
//             }
//             return Object.assign({}, category, {
//                 posts: posts,
//                 path: pathJoin(language, category.path)
//             });
//         }).filter(category => category !== null);
//         return {
//             path: pathJoin(language, 'categories/'),
//             layout: ['categories','archive','index'],
//             data: Object.assign({}, locals, {
//                 _categories: categories,
//                 __categories: true
//             })
//         };
//     })
// }));

// /**
//  * Tag list page generator
//  */
// hexo.extend.generator.register('tags', injectLanguages(function(languages, locals) {
//     return languages.map((language) => {
//         const tags = locals.tags.map(tag => {
//             // Filter posts by language considering. Posts without a language is considered of the default language.
//             const posts = tag.posts.filter(postFilter(language));
//             if (posts.length === 0) {
//                 return null;
//             }
//             return Object.assign({}, tag, {
//                 posts: posts,
//                 path: pathJoin(language, tag.path)
//             });
//         }).filter(category => category !== null);
//         return {
//             path: pathJoin(language, 'tags/'),
//             layout: ['tags','archive','index'],
//             data: Object.assign({}, locals, {
//                 _tags: tags,
//                 __tags: true
//             })
//         };
//     })
// }));

/**
 * Multi-language insight search content.json generator.
 *
 * ATTENTION: This will override the default insight search content.json generator!
 */
hexo.extend.generator.register('insight', injectLanguages(function(languages, locals) {
    function minify(str) {
        return util.stripHTML(str).trim().replace(/\n/g, ' ').replace(/\s+/g, ' ')
            .replace(/&#x([\da-fA-F]+);/g, (match, hex) => {
                return String.fromCharCode(parseInt(hex, 16));
            })
            .replace(/&#([\d]+);/g, (match, dec) => {
                return String.fromCharCode(dec);
            });
    }
    function postMapper(post) {
        return {
            title: post.title,
            text: minify(post.content),
            link: url_for(post.path)
        }
    }
    function tagMapper(language) {
        return function (tag) {
            return {
                name: tag.name,
                slug: tag.slug,
                link: pathJoin(language, tag.path)
            }
        }
    }
    return languages.map((language) => {
        const site = {
            pages: locals.pages.filter(postFilter(language)).map(postMapper),
            posts: locals.posts.filter(postFilter(language)).map(postMapper),
            tags: locals.tags.filter(tag => tag.posts.some(postFilter(language)))
                .map(tagMapper(language)),
            categories: locals.categories.filter(category => category.posts.some(postFilter(language)))
                .map(tagMapper(language)),
        };
        return {
            path: pathJoin(language, 'content.json'),
            data: JSON.stringify(site)
        };
    });
}));

/**
 * Append language directory to the post tags and categories
 */
hexo.extend.filter.register('before_post_render', function(data) {
    data.lang = getPageLanguage(data);
    data._categories = data.categories ? data.categories.map(category => {
        return {
            name: category.name,
            path: pathJoin(data.lang, category.path)
        };
    }) : [];
    data._tags = data.tags ? data.tags.map(tag => {
        return {
            name: tag.name,
            path: pathJoin(data.lang, tag.path)
        };
    }) : [];
    return data;
});

/**
 * Get all languages set in the site's _config.yml
 */
hexo.extend.helper.register('display_languages', function () {
    return getDisplayLanguages();
});

/**
 * Test if the given language is sites default language.
 */
hexo.extend.helper.register('is_default_language', function (language) {
    return isDefaultLanguage(language);
});

/**
 * Get page language. Returns empty if language is not found or is default language.
 */
hexo.extend.helper.register('page_language', function () {
    return getPageLanguage(this.page);
});

/**
 * Get page path given a certain language tag
 */
hexo.extend.helper.register('i18n_path', function (language) {
    const path = this.page.path;
    const lang = getPageLanguage(this.page);
    const base = path.startsWith(lang) ? path.slice(lang.length + 1) : path;
    return (language ? '/' + language : '') + '/' + base;
});

/**
 * Format language to RFC5646 style
 */
hexo.extend.helper.register('rfc5646', function (language) {
    return formatRfc5646(language);
});

/**
 * Return the ISO639 part of the language tag
 */
hexo.extend.helper.register('iso639', function (language) {
    return formatIso639(language);
});

/**
 * Get the closest language tag to the provided language tag
 */
hexo.extend.helper.register('closest_rfc5646_with_country_code', function (language) {
    return getClosestRfc5646WithCountryCode(language);
});

/**
 * Get the language name
 */
hexo.extend.helper.register('language_name', function (language) {
    const name = hexo.theme.i18n.__(language)('name');
    return name === 'name' ? language : name;
});