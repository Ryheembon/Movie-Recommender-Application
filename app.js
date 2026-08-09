// Constants
const API_KEY = config.API_KEY;
const BASE_URL = config.BASE_URL;
const IMAGE_BASE_URL = config.IMAGE_BASE_URL;

const MOVIE_GENRES = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 18, name: 'Drama' },
    { id: 14, name: 'Fantasy' },
    { id: 27, name: 'Horror' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' }
];

const TV_GENRES = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' }
];

// DOM Elements (will be set after DOM loads)
let navbar, heroSection, heroContent, movieGrids, modal, searchInput, searchButton;

// State
let currentPage = 1;
let isLoading = false;
let hasMorePages = true;
let displayedMovies = new Set();
let favorites = [];
let currentView = 'home'; // home | movies | tv | new | genres | favorites

// Setup Infinite Scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', handleScroll);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    if (typeof config === 'undefined') {
        console.error('Config not loaded! Make sure config.js is included before app.js');
        const main = document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Bonavista needs an API key</h2>
                    <p>Add your TMDb key in <code>config.js</code>, then refresh.</p>
                </div>
            `;
        }
        return;
    }

    try {
        const storedFavorites = localStorage.getItem('movieFavorites');
        if (storedFavorites) {
            favorites = JSON.parse(storedFavorites);
        }
    } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
        favorites = [];
    }

    navbar = document.querySelector('.navbar');
    heroSection = document.querySelector('.hero');
    heroContent = document.querySelector('.hero-content');
    movieGrids = document.querySelectorAll('.movie-grid');
    modal = document.getElementById('movieModal');
    searchInput = document.querySelector('.search-input');
    searchButton = document.querySelector('.search-button');

    renderGenreBar('movie');
    loadHeroContent();
    showHomeView();
    handleResize();
    setupInfiniteScroll();
    window.addEventListener('resize', handleResize);

    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });
});

// ---------- Helpers ----------

function normalizeItem(item, fallbackType = 'movie') {
    const mediaType = item.media_type || fallbackType;
    return {
        ...item,
        media_type: mediaType,
        title: item.title || item.name || 'Untitled',
        release_date: item.release_date || item.first_air_date || ''
    };
}

function buildContentRows(rows) {
    return rows.map((row) => `
        <section class="content-row" data-category="${row.category}">
            <h2>${row.title}</h2>
            <div class="category-navigation">
                <button class="nav-arrow left" onclick="scrollCategory('${row.category}', 'left')" title="Scroll left">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="movie-grid"></div>
                <button class="nav-arrow right" onclick="scrollCategory('${row.category}', 'right')" title="Scroll right">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </section>
    `).join('');
}

function clearTemporarySections() {
    document.querySelectorAll(
        '.content-row[data-category="favorites"], .content-row[data-category="search"], .content-row[data-category="genre"]'
    ).forEach((section) => section.remove());
}

function setMainRows(rows) {
    const main = document.querySelector('main');
    displayedMovies = new Set();
    currentPage = 1;
    hasMorePages = currentView === 'home' || currentView === 'movies';
    main.innerHTML = buildContentRows(rows);
}

// ---------- Navigation views ----------

async function showHomeView() {
    currentView = 'home';
    clearTemporarySections();
    setMainRows([
        { category: 'trending', title: 'Worth a look' },
        { category: 'popular', title: 'Crowd favorites' },
        { category: 'new', title: 'Just arrived' },
        { category: 'recommended', title: 'Picked for you' }
    ]);
    updateActiveNavigation('home');
    renderGenreBar('movie');
    await loadMovieContent();
    await loadPersonalizedRecommendations();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showMoviesView() {
    currentView = 'movies';
    clearTemporarySections();
    setMainRows([
        { category: 'trending', title: 'Movies on the rise' },
        { category: 'popular', title: 'Most watched movies' },
        { category: 'new', title: 'In theaters vibe' },
        { category: 'recommended', title: 'Critically loved' }
    ]);
    updateActiveNavigation('movies');
    renderGenreBar('movie');
    await loadMovieContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showTVView() {
    currentView = 'tv';
    clearTemporarySections();
    setMainRows([
        { category: 'tv-trending', title: 'Shows people are talking about' },
        { category: 'tv-popular', title: 'Must-see series' },
        { category: 'tv-top', title: 'All-time great TV' },
        { category: 'tv-airing', title: 'On tonight' }
    ]);
    updateActiveNavigation('tv');
    renderGenreBar('tv');
    await loadTVContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showNewPopularView() {
    currentView = 'new';
    clearTemporarySections();
    setMainRows([
        { category: 'new-movies', title: 'Fresh on screen' },
        { category: 'popular-movies', title: 'Movie crowd-pleasers' },
        { category: 'popular-tv', title: 'Series everyone knows' },
        { category: 'trending-all', title: "This week's buzz" }
    ]);
    updateActiveNavigation('new');
    renderGenreBar('movie');
    await loadNewPopularContent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Keep old name working for any leftover calls
function showAllMovies() {
    showHomeView();
}

// ---------- Data loaders ----------

async function loadHeroContent() {
    try {
        const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const featuredMovie = normalizeItem(data.results[0], 'movie');
            const hero = document.querySelector('.hero');

            if (featuredMovie.backdrop_path) {
                hero.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url(${IMAGE_BASE_URL}/w1280${featuredMovie.backdrop_path})`;
            } else if (featuredMovie.poster_path) {
                hero.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url(${IMAGE_BASE_URL}/w780${featuredMovie.poster_path})`;
            }

            const content = document.querySelector('.hero-content');
            content.innerHTML = `
                <h1 class="brand-mark">Bonavista</h1>
                <p class="hero-tagline">A clearer view of what to watch next.</p>
                <p class="hero-feature">Now featuring <strong>${featuredMovie.title}</strong></p>
                <div class="hero-buttons">
                    <button class="btn-play" onclick="playMedia(${featuredMovie.id}, 'movie')">
                        <i class="fas fa-play"></i> Watch Trailer
                    </button>
                    <button class="btn-more" onclick="showMediaDetails(${featuredMovie.id}, 'movie')">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            `;
            content.classList.add('visible');
        }
    } catch (error) {
        console.error('Error loading hero content:', error);
    }
}

async function loadMovieContent() {
    try {
        const [trendingResponse, popularResponse, newResponse, recommendedResponse] = await Promise.all([
            fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`)
        ]);

        const trendingData = await trendingResponse.json();
        const popularData = await popularResponse.json();
        const newData = await newResponse.json();
        const recommendedData = await recommendedResponse.json();

        if (trendingData.results) displayMedia(trendingData.results, 'trending', 'movie');
        if (popularData.results) displayMedia(popularData.results, 'popular', 'movie');
        if (newData.results) displayMedia(newData.results, 'new', 'movie');
        if (recommendedData.results) displayMedia(recommendedData.results, 'recommended', 'movie');
    } catch (error) {
        console.error('Error loading movie content:', error);
        showLoadingError();
    }
}

async function loadTVContent() {
    try {
        const [trendingRes, popularRes, topRes, airingRes] = await Promise.all([
            fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/tv/airing_today?api_key=${API_KEY}&language=en-US&page=1`)
        ]);

        const trendingData = await trendingRes.json();
        const popularData = await popularRes.json();
        const topData = await topRes.json();
        const airingData = await airingRes.json();

        if (trendingData.results) displayMedia(trendingData.results, 'tv-trending', 'tv');
        if (popularData.results) displayMedia(popularData.results, 'tv-popular', 'tv');
        if (topData.results) displayMedia(topData.results, 'tv-top', 'tv');
        if (airingData.results) displayMedia(airingData.results, 'tv-airing', 'tv');
    } catch (error) {
        console.error('Error loading TV content:', error);
        showLoadingError('TV shows');
    }
}

async function loadNewPopularContent() {
    try {
        const [newMoviesRes, popularMoviesRes, popularTvRes, trendingRes] = await Promise.all([
            fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`),
            fetch(`${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US&page=1`)
        ]);

        const newMovies = await newMoviesRes.json();
        const popularMovies = await popularMoviesRes.json();
        const popularTv = await popularTvRes.json();
        const trending = await trendingRes.json();

        if (newMovies.results) displayMedia(newMovies.results, 'new-movies', 'movie');
        if (popularMovies.results) displayMedia(popularMovies.results, 'popular-movies', 'movie');
        if (popularTv.results) displayMedia(popularTv.results, 'popular-tv', 'tv');
        if (trending.results) {
            const filtered = trending.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
            displayMedia(filtered, 'trending-all');
        }
    } catch (error) {
        console.error('Error loading new & popular content:', error);
        showLoadingError('new & popular titles');
    }
}

async function loadPersonalizedRecommendations() {
    const recommendedGrid = document.querySelector('.content-row[data-category="recommended"] .movie-grid');
    const recommendedTitle = document.querySelector('.content-row[data-category="recommended"] h2');
    if (!recommendedGrid) return;

    if (!favorites.length) {
        if (recommendedTitle) recommendedTitle.textContent = 'Picked for you';
        return;
    }

    try {
        const seed = favorites[0];
        const mediaType = seed.media_type || 'movie';
        const response = await fetch(
            `${BASE_URL}/${mediaType}/${seed.id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            if (recommendedTitle) {
                recommendedTitle.textContent = `Because you saved ${seed.title || seed.name || 'a favorite'}`;
            }
            displayMedia(data.results, 'recommended', mediaType);
        }
    } catch (error) {
        console.error('Error loading personalized recommendations:', error);
    }
}

function showLoadingError(label = 'movies') {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Unable to load ${label}</h2>
            <p>Please check your internet connection and try again.</p>
            <button class="btn-play" onclick="location.reload()">
                <i class="fas fa-refresh"></i> Retry
            </button>
        </div>
    `;
}

// ---------- Genres ----------

function renderGenreBar(type = 'movie') {
    const genreBar = document.getElementById('genreBar');
    if (!genreBar) return;

    const genres = type === 'tv' ? TV_GENRES : MOVIE_GENRES;
    genreBar.innerHTML = `
        <div class="genre-bar-label">Explore by mood</div>
        <div class="genre-chips">
            ${genres.map((genre) => `
                <button class="genre-chip" onclick="browseGenre(${genre.id}, '${genre.name.replace(/'/g, "\\'")}', '${type}')">
                    ${genre.name}
                </button>
            `).join('')}
        </div>
    `;
}

async function browseGenre(genreId, genreName, type = 'movie') {
    currentView = 'genres';
    clearTemporarySections();
    updateActiveNavigation('genres');

    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const main = document.querySelector('main');
    main.innerHTML = `
        <section class="content-row visible" data-category="genre">
            <h2>${genreName} ${type === 'tv' ? 'TV Shows' : 'Movies'}</h2>
            <div class="category-navigation">
                <button class="nav-arrow left" onclick="scrollCategory('genre', 'left')" title="Scroll left">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="movie-grid"></div>
                <button class="nav-arrow right" onclick="scrollCategory('genre', 'right')" title="Scroll right">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </section>
    `;

    try {
        const response = await fetch(
            `${BASE_URL}/discover/${endpoint}?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=1`
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            main.querySelector('[data-category="genre"]').innerHTML = `
                <h2>No ${genreName} titles found</h2>
                <p>Try another genre.</p>
            `;
            return;
        }

        displayMedia(data.results, 'genre', endpoint);
        window.scrollTo({ top: document.querySelector('main').offsetTop - 80, behavior: 'smooth' });
    } catch (error) {
        console.error('Error browsing genre:', error);
        main.innerHTML = `
            <div class="error-message">
                <h2>Could not load ${genreName}</h2>
                <p>Please try again.</p>
            </div>
        `;
    }
}

// ---------- Display / cards ----------

function displayMedia(items, category, fallbackType = 'movie') {
    const movieGrid = document.querySelector(`.content-row[data-category="${category}"] .movie-grid`);

    if (!movieGrid) {
        console.error(`Movie grid not found for category: ${category}`);
        return;
    }

    movieGrid.innerHTML = '';
    const limitedItems = items.slice(0, 12);

    limitedItems.forEach((item) => {
        const normalized = normalizeItem(item, item.media_type || fallbackType);
        displayedMovies.add(`${normalized.media_type}-${normalized.id}`);
        movieGrid.appendChild(createMediaCard(normalized));
    });

    const contentRow = movieGrid.closest('.content-row');
    if (contentRow) {
        contentRow.classList.add('visible');
    }
}

function createMediaCard(item) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const mediaType = item.media_type || 'movie';
    const isFavorite = favorites.some((fav) => fav.id === item.id && (fav.media_type || 'movie') === mediaType);

    const posterUrl = item.poster_path
        ? `${IMAGE_BASE_URL}/w500${item.poster_path}`
        : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';

    const releaseYear = item.release_date ? item.release_date.split('-')[0] : 'N/A';
    const cleanTitle = (item.title || 'Unknown Title').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const cleanOverview = (item.overview || 'No description available').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const cleanPosterPath = item.poster_path || '';
    const cleanReleaseDate = item.release_date || '';
    const cleanVoteAverage = item.vote_average || 0;

    card.onclick = (e) => {
        if (!e.target.closest('button')) {
            showMediaDetails(item.id, mediaType);
        }
    };

    card.innerHTML = `
        <img src="${posterUrl}" alt="${cleanTitle}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750/333/fff?text=No+Image';">
        <div class="movie-info">
            <h3>${cleanTitle}</h3>
            <p>${releaseYear}${mediaType === 'tv' ? ' · TV' : ''}</p>
            <div class="movie-buttons">
                <button onclick="event.stopPropagation(); playMedia(${item.id}, '${mediaType}')" title="Play trailer">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="event.stopPropagation(); showMediaDetails(${item.id}, '${mediaType}')" title="View details">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button onclick="event.stopPropagation(); toggleFavorite(${item.id}, '${cleanTitle}', '${cleanPosterPath}', '${cleanReleaseDate}', '${cleanOverview}', ${cleanVoteAverage}, '${mediaType}')"
                        title="${isFavorite ? 'Remove from saved' : 'Save for later'}"
                        class="favorite-btn ${isFavorite ? 'active' : ''}"
                        data-media-id="${item.id}"
                        data-media-type="${mediaType}">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}

// ---------- Details / play ----------

async function showMediaDetails(mediaId, mediaType = 'movie') {
    try {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const [mediaResponse, providersResponse] = await Promise.all([
            fetch(`${BASE_URL}/${type}/${mediaId}?api_key=${API_KEY}&language=en-US&append_to_response=videos`),
            fetch(`${BASE_URL}/${type}/${mediaId}/watch/providers?api_key=${API_KEY}`)
        ]);

        const media = await mediaResponse.json();
        const providers = await providersResponse.json();
        const normalized = normalizeItem({ ...media, media_type: type }, type);

        const trailer = (media.videos && media.videos.results)
            ? media.videos.results.find((video) => video.type === 'Trailer')
            : null;
        const trailerKey = trailer ? trailer.key : null;

        const usProviders = (providers.results && providers.results.US) || {};
        const streamingServices = usProviders.flatrate || [];
        const rentServices = usProviders.rent || [];
        const buyServices = usProviders.buy || [];

        const streamingInfo = `
            <div class="streaming-info">
                ${streamingServices.length > 0 ? `
                    <div class="streaming-section">
                        <h3><i class="fas fa-play-circle"></i> Stream Now</h3>
                        <div class="provider-list">
                            ${streamingServices.map((provider) => `
                                <span class="provider" title="${provider.provider_name}">
                                    <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${rentServices.length > 0 ? `
                    <div class="streaming-section">
                        <h3><i class="fas fa-clock"></i> Rent</h3>
                        <div class="provider-list">
                            ${rentServices.map((provider) => `
                                <span class="provider" title="${provider.provider_name}">
                                    <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${buyServices.length > 0 ? `
                    <div class="streaming-section">
                        <h3><i class="fas fa-shopping-cart"></i> Buy</h3>
                        <div class="provider-list">
                            ${buyServices.map((provider) => `
                                <span class="provider" title="${provider.provider_name}">
                                    <img src="https://image.tmdb.org/t/p/original${provider.logo_path}" alt="${provider.provider_name}">
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                ${streamingServices.length === 0 && rentServices.length === 0 && buyServices.length === 0 ? `
                    <div class="streaming-section">
                        <p class="no-streaming">Streaming information not available</p>
                    </div>
                ` : ''}
            </div>
        `;

        const posterUrl = normalized.poster_path
            ? `${IMAGE_BASE_URL}/w500${normalized.poster_path}`
            : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';

        const cleanTitle = normalized.title.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const cleanOverview = (normalized.overview || 'No description available').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const cleanPosterPath = normalized.poster_path || '';
        const cleanReleaseDate = normalized.release_date || '';
        const cleanVoteAverage = normalized.vote_average || 0;
        const runtimeLabel = type === 'tv'
            ? `${(media.number_of_seasons || 'N/A')} seasons`
            : `${media.runtime || 'N/A'} min`;

        modal.innerHTML = `
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-content">
                <div class="movie-details">
                    <div class="movie-header">
                        <img src="${posterUrl}" alt="${cleanTitle}" onerror="this.src='https://via.placeholder.com/500x750/333/fff?text=No+Image';">
                        <div class="movie-info">
                            <h2>${cleanTitle}${type === 'tv' ? ' <span class="media-badge">TV</span>' : ''}</h2>
                            <p class="overview">${cleanOverview}</p>
                            <div class="movie-stats">
                                <span><i class="fas fa-star"></i> ${Number(cleanVoteAverage).toFixed(1)}</span>
                                <span><i class="fas fa-calendar"></i> ${cleanReleaseDate || 'N/A'}</span>
                                <span><i class="fas fa-clock"></i> ${runtimeLabel}</span>
                            </div>
                            <div class="hero-buttons">
                                <button class="btn-play" onclick="playMedia(${normalized.id}, '${type}')">
                                    <i class="fas fa-play"></i> Watch Trailer
                                </button>
                                <button class="btn-more" onclick="toggleFavorite(${normalized.id}, '${cleanTitle}', '${cleanPosterPath}', '${cleanReleaseDate}', '${cleanOverview}', ${cleanVoteAverage}, '${type}')">
                                    <i class="fas fa-bookmark"></i>
                                    <span id="favorite-text-${normalized.id}">${favorites.some((fav) => fav.id === normalized.id && (fav.media_type || 'movie') === type) ? 'Remove from Saved' : 'Save for later'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    ${streamingInfo}
                    ${trailerKey ? `
                        <div class="trailer-section">
                            <h3>Trailer</h3>
                            <div class="trailer-container">
                                <iframe src="https://www.youtube.com/embed/${trailerKey}"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen>
                                </iframe>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }
    } catch (error) {
        console.error('Error loading media details:', error);
        modal.innerHTML = `
            <button class="modal-close" aria-label="Close modal" onclick="closeModal()">&times;</button>
            <div class="modal-content">
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading details. Please try again later.</p>
                </div>
            </div>
        `;
    }
}

function showMovieDetails(movieId) {
    showMediaDetails(movieId, 'movie');
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    const iframe = modal.querySelector('iframe');
    if (iframe) {
        iframe.src = '';
    }
}

async function playMedia(mediaId, mediaType = 'movie') {
    try {
        const type = mediaType === 'tv' ? 'tv' : 'movie';
        const response = await fetch(`${BASE_URL}/${type}/${mediaId}?api_key=${API_KEY}&language=en-US&append_to_response=videos`);
        const media = await response.json();
        const trailer = media.videos && media.videos.results
            ? media.videos.results.find((video) => video.type === 'Trailer')
            : null;

        if (trailer) {
            window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
        } else {
            showMediaDetails(mediaId, type);
        }
    } catch (error) {
        console.error('Error playing media:', error);
        showMediaDetails(mediaId, mediaType);
    }
}

function playMovie(movieId) {
    playMedia(movieId, 'movie');
}

// ---------- Favorites ----------

function toggleFavorite(mediaId, title, posterPath, releaseDate, overview, voteAverage, mediaType = 'movie') {
    const type = mediaType === 'tv' ? 'tv' : 'movie';
    const existingIndex = favorites.findIndex(
        (fav) => fav.id === mediaId && (fav.media_type || 'movie') === type
    );

    if (existingIndex > -1) {
        favorites.splice(existingIndex, 1);
    } else {
        favorites.push({
            id: mediaId,
            title: title,
            poster_path: posterPath,
            release_date: releaseDate,
            overview: overview,
            vote_average: voteAverage,
            media_type: type
        });
    }

    try {
        localStorage.setItem('movieFavorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
    }

    updateFavoriteButtons();

    const modalFavoriteText = document.getElementById(`favorite-text-${mediaId}`);
    if (modalFavoriteText) {
        const isFavorite = favorites.some((fav) => fav.id === mediaId && (fav.media_type || 'movie') === type);
        modalFavoriteText.textContent = isFavorite ? 'Remove from Saved' : 'Save for later';
    }

    if (document.querySelector('.content-row[data-category="favorites"]')) {
        displayFavorites();
    }

    if (currentView === 'home') {
        loadPersonalizedRecommendations();
    }
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach((button) => {
        try {
            const mediaId = parseInt(button.getAttribute('data-media-id'), 10);
            const mediaType = button.getAttribute('data-media-type') || 'movie';
            if (!mediaId) return;

            const isFavorite = favorites.some(
                (fav) => fav.id === mediaId && (fav.media_type || 'movie') === mediaType
            );
            button.classList.toggle('active', isFavorite);
            button.title = isFavorite ? 'Remove from saved' : 'Save for later';
        } catch (error) {
            console.error('Error updating favorite button:', error);
        }
    });
}

function displayFavorites() {
    currentView = 'favorites';
    clearTemporarySections();

    const favoritesSection = document.createElement('section');
    favoritesSection.className = 'content-row';
    favoritesSection.setAttribute('data-category', 'favorites');

    if (favorites.length === 0) {
        favoritesSection.innerHTML = `
            <h2>Saved</h2>
            <div class="empty-favorites">
                <i class="fas fa-bookmark"></i>
                <h3>Nothing saved yet</h3>
                <p>Bookmark movies or shows to build your personal list.</p>
            </div>
        `;
    } else {
        favoritesSection.innerHTML = `
            <h2>Saved (${favorites.length})</h2>
            <div class="category-navigation">
                <button class="nav-arrow left" onclick="scrollCategory('favorites', 'left')" title="Scroll left">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="movie-grid"></div>
                <button class="nav-arrow right" onclick="scrollCategory('favorites', 'right')" title="Scroll right">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    const main = document.querySelector('main');
    main.innerHTML = '';
    main.appendChild(favoritesSection);

    if (favorites.length > 0) {
        displayMedia(favorites, 'favorites');
    }

    updateActiveNavigation('favorites');
    favoritesSection.scrollIntoView({ behavior: 'smooth' });
}

// ---------- Nav active state ----------

function updateActiveNavigation(section) {
    document.querySelectorAll('.nav-right a').forEach((link) => {
        link.classList.remove('active');
    });

    const map = {
        home: '.nav-home',
        movies: '.nav-movies',
        tv: '.nav-tv',
        new: '.nav-new',
        genres: '.nav-genres',
        favorites: '.nav-favorites'
    };

    const selector = map[section];
    if (selector) {
        const link = document.querySelector(`.nav-right a${selector}`);
        if (link) link.classList.add('active');
    }
}

// ---------- Search ----------

async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
        clearTemporarySections();

        const searchResults = document.createElement('section');
        searchResults.className = 'content-row visible';
        searchResults.setAttribute('data-category', 'search');
        searchResults.innerHTML = `
            <h2>Search Results for "${query}"</h2>
            <div class="category-navigation">
                <button class="nav-arrow left" onclick="scrollCategory('search', 'left')" title="Scroll left">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="movie-grid"></div>
                <button class="nav-arrow right" onclick="scrollCategory('search', 'right')" title="Scroll right">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        const main = document.querySelector('main');
        main.innerHTML = '';
        main.appendChild(searchResults);

        const response = await fetch(
            `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`
        );
        const data = await response.json();
        const filtered = (data.results || []).filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );

        if (filtered.length === 0) {
            searchResults.innerHTML = `
                <h2>No results found for "${query}"</h2>
                <p>Try searching for something else</p>
            `;
            return;
        }

        displayMedia(filtered, 'search');
    } catch (error) {
        console.error('Error searching:', error);
        const searchResults = document.querySelector('.content-row[data-category="search"]');
        if (searchResults) {
            searchResults.innerHTML = `
                <h2>Error searching</h2>
                <p>Please try again later</p>
            `;
        }
    }
}

// ---------- Scroll / infinite ----------

function handleScroll() {
    if (!navbar) return;

    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if ((currentView === 'home' || currentView === 'movies') && isNearBottom() && !isLoading && hasMorePages) {
        loadMoreContent();
    }
}

function handleResize() {
    if (heroSection) {
        heroSection.style.height = `${window.innerHeight * 0.8}px`;
    }
}

function isNearBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
}

async function loadMoreContent() {
    isLoading = true;
    currentPage++;

    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${currentPage}`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            hasMorePages = false;
            return;
        }

        const movieGrid = document.querySelector('.content-row[data-category="popular"] .movie-grid');
        if (!movieGrid) return;

        data.results.forEach((movie) => {
            const normalized = normalizeItem(movie, 'movie');
            const key = `movie-${normalized.id}`;
            if (!displayedMovies.has(key)) {
                displayedMovies.add(key);
                movieGrid.appendChild(createMediaCard(normalized));
            }
        });
    } catch (error) {
        console.error('Error loading more content:', error);
        currentPage--;
    } finally {
        isLoading = false;
    }
}

function scrollCategory(category, direction) {
    const movieGrid = document.querySelector(`.content-row[data-category="${category}"] .movie-grid`);
    if (!movieGrid) return;

    const scrollAmount = 300;
    const currentScroll = movieGrid.scrollLeft;
    const newScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    movieGrid.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    });
}
