module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "static/css": "assets/css",
    "static/img": "assets/img",
    "content-seo-pack/technical-seo/sitemap.xml": "sitemap.xml",
    "content-seo-pack/technical-seo/robots.txt": "robots.txt"
  });

  eleventyConfig.addFilter("jsonld", (obj) => JSON.stringify(obj));

  return {
    dir: {
      input: "content-seo-pack/pages",
      includes: "../../src/_includes",
      data: "../../src/_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
