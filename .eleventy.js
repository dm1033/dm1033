const htmlmin = require("html-minifier-terser");

module.exports = function (eleventyConfig) {
  // Static assets
  eleventyConfig.addPassthroughCopy({ "static/css": "assets/css" });
  eleventyConfig.addPassthroughCopy({ "static/js": "assets/js" });
  eleventyConfig.addPassthroughCopy({ "static/img": "assets/img" });

  // Minify HTML output for a clean, production-grade build.
  // minifyJS is OFF so JSON-LD <script> blocks are preserved verbatim.
  eleventyConfig.addTransform("htmlmin", async function (content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      return await htmlmin.minify(content, {
        collapseWhitespace: true,
        conservativeCollapse: false,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: false,
        keepClosingSlash: true
      });
    }
    return content;
  });

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
