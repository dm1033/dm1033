module.exports = function (eleventyConfig) {
  // Static assets
  eleventyConfig.addPassthroughCopy({ "static/css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "static/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "static/img": "assets/img" });

  // Serialise an object to JSON-LD
  eleventyConfig.addFilter("jsonld", (obj) => JSON.stringify(obj));

  // ISO date helper for sitemap
  eleventyConfig.addFilter("isoDate", (d) => new Date(d || Date.now()).toISOString().split("T")[0]);

  // Collection of pages that should appear in the sitemap / nav breadcrumbs
  eleventyConfig.addCollection("sitemapPages", (collection) =>
    collection.getAll().filter((item) => item.data.eleventyExcludeFromCollections !== true && item.data.sitemap !== false)
  );

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/"
  };
};
