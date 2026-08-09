// TMDb API Configuration
// 1. Copy this file and rename it to config.js
// 2. Replace YOUR_TMDB_API_KEY with your key from https://www.themoviedb.org/settings/api

const config = {
    API_KEY: 'YOUR_TMDB_API_KEY',
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} else {
    window.config = config;
}
