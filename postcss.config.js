const purgeConfig = require('./purgecss.config');
module.exports = {
    plugins: [
        // require('@fullhuman/postcss-purgecss')({
        //     content: [
        //         './app/**/*.html.erb',
        //         './app/helpers/**/*.rb',
        //         './app/javascript/**/*.js',
        //     ],
        //     defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        //     safelist: purgeConfig.safelist,
        // }),
        require('autoprefixer'),
    ]
}
