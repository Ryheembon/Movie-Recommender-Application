// DOM Elements
const navbar = document.querySelector('.navbar');
const searchContainer = document.querySelector('.search-container');
const searchInput = document.querySelector('.search-container input');
const searchIcon = document.querySelector('.search-container i');
const movieModal = document.getElementById('movieModal');
const genreModal = document.getElementById('genreModal');
const modalCloseBtn = document.querySelector('.modal-close');
const modalBody = document.querySelector('.modal-body');
const getRecommendationsBtn = document.getElementById('getRecommendations');
const selectGenresBtn = document.getElementById('selectGenres');
const saveGenresBtn = document.getElementById('saveGenres');
const genreSelectionGrid = document.getElementById('genreSelectionGrid');

// Genres data
const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' }
];

// User preferences (simulated)
let userPreferences = {
    favoriteGenres: [],
    favoriteMovies: [],
    watchlist: []
};

// Debug logging
console.log('DOM Elements:', {
    navbar: !!navbar,
    searchContainer: !!searchContainer,
    searchInput: !!searchInput,
    movieModal: !!movieModal,
    modalCloseBtn: !!modalCloseBtn,
    modalBody: !!modalBody,
    getRecommendationsBtn: !!getRecommendationsBtn
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Toggle search bar
searchIcon.addEventListener('click', () => {
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        searchInput.focus();
    }
});

// Handle search
searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            try {
                const response = await fetch(`${config.BASE_URL}/search/movie?api_key=${config.API_KEY}&query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.results && data.results.length > 0) {
                    // Clear existing content
                    document.querySelectorAll('.content-row').forEach(row => row.remove());
                    
                    // Create new row for search results
                    const searchRow = document.createElement('div');
                    searchRow.className = 'content-row';
                    searchRow.innerHTML = `
                        <h2>Search Results for "${query}"</h2>
                        <div class="movie-grid"></div>
                    `;
                    main.appendChild(searchRow);
                    
                    // Add movies to grid
                    const movieGrid = searchRow.querySelector('.movie-grid');
                    data.results.forEach(movie => {
                        movieGrid.innerHTML += createMovieCard(movie);
                    });
                    
                    // Add click handlers to new movie cards
                    searchRow.querySelectorAll('.movie-card').forEach(card => {
                        card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
                    });
                } else {
                    // Show no results message
                    const noResults = document.createElement('div');
                    noResults.className = 'error-message';
                    noResults.innerHTML = `
                        <i class="fas fa-search"></i>
                        <p>No movies found for "${query}"</p>
                    `;
                    main.innerHTML = '';
                    main.appendChild(noResults);
                }
            } catch (error) {
                console.error('Error searching movies:', error);
                showError('Failed to search movies. Please try again.');
            }
        }
    }
});

// Close search on click outside
document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
        searchContainer.classList.remove('active');
    }
});

// Loading state
function setLoading(containerId, isLoading) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (isLoading) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading movies...</p>
            </div>
        `;
    }
}

// Error state
function setError(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Cache system
const cache = {
    data: {},
    timestamps: {},
    maxAge: {
        popular: 24 * 60 * 60 * 1000, // 24 hours
        trending: 12 * 60 * 60 * 1000, // 12 hours
        nowPlaying: 12 * 60 * 60 * 1000, // 12 hours
        recommendations: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// Check if cache is valid
function isCacheValid(key) {
    const timestamp = cache.timestamps[key];
    const maxAge = cache.maxAge[key];
    if (!timestamp || !maxAge) return false;
    return Date.now() - timestamp < maxAge;
}

// Fetch movies with cache
async function fetchMoviesWithCache(endpoint, params = {}, cacheKey) {
    try {
        // Check if we have valid cached data
        if (cacheKey && isCacheValid(cacheKey)) {
            console.log(`Using cached data for ${cacheKey}`);
            return cache.data[cacheKey];
        }

        const movies = await fetchMovies(endpoint, params);
        
        // Update cache if we have a valid cache key
        if (cacheKey) {
            cache.data[cacheKey] = movies;
            cache.timestamps[cacheKey] = Date.now();
        }
        
        return movies;
    } catch (error) {
        console.error(`Error fetching ${cacheKey}:`, error);
        return [];
    }
}

// Fetch movies from TMDb API
async function fetchMovies(endpoint, params = {}) {
    try {
        const queryParams = new URLSearchParams({
            api_key: config.API_KEY,
            language: 'en-US',
            ...params
        });
        
        const response = await fetch(`${config.BASE_URL}${endpoint}?${queryParams}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
}

// Create movie card HTML
function createMovieCard(movie) {
    // Ensure config is available
    if (!window.config) {
        console.error('Config not loaded');
        return '';
    }

    const posterPath = movie.poster_path 
        ? `${window.config.IMAGE_BASE_URL}/w500${movie.poster_path}`
        : 'https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <div class="movie-poster">
                <img loading="lazy" 
                     src="${posterPath}" 
                     alt="${movie.title}"
                     width="500"
                     height="750"
                     onerror="this.onerror=null; this.src='https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';">
            </div>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${new Date(movie.release_date).getFullYear()}</p>
            </div>
        </div>
    `;
}

// Create genre card HTML
function createGenreCard(genre) {
    const genreIcons = {
        28: 'fa-fist-raised', // Action
        12: 'fa-mountain', // Adventure
        16: 'fa-paint-brush', // Animation
        35: 'fa-laugh', // Comedy
        80: 'fa-handcuffs', // Crime
        99: 'fa-camera', // Documentary
        18: 'fa-theater-masks', // Drama
        10751: 'fa-home', // Family
        14: 'fa-dragon', // Fantasy
        36: 'fa-landmark', // History
        27: 'fa-ghost', // Horror
        10402: 'fa-music', // Music
        9648: 'fa-search', // Mystery
        10749: 'fa-heart', // Romance
        878: 'fa-rocket', // Science Fiction
        53: 'fa-skull', // Thriller
        10752: 'fa-fighter-jet', // War
        37: 'fa-hat-cowboy' // Western
    };

    return `
        <div class="genre-card" data-id="${genre.id}">
            <i class="fas ${genreIcons[genre.id] || 'fa-film'}"></i>
            <h3>${genre.name}</h3>
        </div>
    `;
}

// Display movies in a container
function displayMovies(containerId, movies) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!movies || movies.length === 0) {
        setError(containerId, 'No movies found');
        return;
    }
    
    container.innerHTML = movies.map(createMovieCard).join('');
    
    // Add click events to movie cards
    container.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
    });

    // Add watchlist button events
    container.querySelectorAll('.btn-add-watchlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToWatchlist(btn.dataset.id);
        });
    });
}

// Display genres
function displayGenres() {
    const container = document.getElementById('genres');
    if (!container) return;

    container.innerHTML = genres.map(createGenreCard).join('');

    // Add click events to genre cards
    container.querySelectorAll('.genre-card').forEach(card => {
        card.addEventListener('click', () => showGenreMovies(card.dataset.id));
    });
}

// Show movies by genre
async function showGenreMovies(genreId) {
    try {
        setLoading('featuredContent', true);
        const movies = await fetchMovies('/discover/movie', { with_genres: genreId });
        if (!movies || movies.length === 0) {
            setError('featuredContent', 'No movies found in this genre. Please try another genre.');
            return;
        }
        displayMovies('featuredContent', movies);
    } catch (error) {
        console.error('Error fetching genre movies:', error);
        setError('featuredContent', 'Error loading genre movies. Please try again.');
    }
}

// Get personalized recommendations
async function getRecommendations() {
    try {
        setLoading('featuredContent', true);
        
        // Get user's favorite genres (simulated)
        const favoriteGenres = userPreferences.favoriteGenres.length > 0 
            ? userPreferences.favoriteGenres 
            : [28, 35, 18]; // Default genres if none selected

        // Fetch movies from favorite genres
        const genreMovies = await Promise.all(
            favoriteGenres.map(genreId => 
                fetchMovies('/discover/movie', { 
                    with_genres: genreId,
                    sort_by: 'vote_average.desc'
                })
            )
        );

        // Combine and sort movies
        const allMovies = genreMovies.flat();
        const uniqueMovies = [...new Map(allMovies.map(movie => [movie.id, movie])).values()];
        const sortedMovies = uniqueMovies.sort((a, b) => b.vote_average - a.vote_average);

        displayMovies('featuredContent', sortedMovies.slice(0, 6));
    } catch (error) {
        console.error('Error getting recommendations:', error);
        setError('featuredContent', 'Error getting recommendations. Please try again.');
    }
}

// Add movie to watchlist
function addToWatchlist(movieId) {
    if (!userPreferences.watchlist.includes(movieId)) {
        userPreferences.watchlist.push(movieId);
        localStorage.setItem('watchlist', JSON.stringify(userPreferences.watchlist));
        updateWatchlist();
    }
}

// Add API request cache
const apiCache = {
    data: {},
    timestamps: {},
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Check if API cache is valid
function isApiCacheValid(key) {
    const timestamp = apiCache.timestamps[key];
    if (!timestamp) return false;
    return Date.now() - timestamp < apiCache.maxAge;
}

// Get cached API response
function getCachedApiResponse(key) {
    return apiCache.data[key];
}

// Cache API response
function cacheApiResponse(key, data) {
    apiCache.data[key] = data;
    apiCache.timestamps[key] = Date.now();
}

// Batch fetch movies
async function batchFetchMovies(movieIds) {
    const uniqueIds = [...new Set(movieIds)];
    const cacheKey = `batch_${uniqueIds.join('_')}`;
    
    if (isApiCacheValid(cacheKey)) {
        return getCachedApiResponse(cacheKey);
    }

    const movies = await Promise.all(
        uniqueIds.map(id => 
            fetch(`${config.BASE_URL}/movie/${id}?api_key=${config.API_KEY}`)
                .then(res => res.json())
        )
    );

    cacheApiResponse(cacheKey, movies);
    return movies;
}

// Update watchlist display
async function updateWatchlist() {
    try {
        setLoading('continueWatching', true);
        if (userPreferences.watchlist.length === 0) {
            displayMovies('continueWatching', []);
            return;
        }
        
        const watchlistMovies = await batchFetchMovies(userPreferences.watchlist);
        displayMovies('continueWatching', watchlistMovies);
    } catch (error) {
        console.error('Error updating watchlist:', error);
        setError('continueWatching', 'Error loading watchlist. Please try again.');
    }
}

// Preload movie posters
function preloadMoviePosters(movies) {
    movies.forEach(movie => {
        if (movie.poster_path) {
            const img = new Image();
            img.src = `${config.IMAGE_BASE_URL}/w500${movie.poster_path}`;
        }
    });
}

// Batch fetch additional data
async function batchFetchAdditionalData(movieId) {
    const cacheKey = `additional_${movieId}`;
    
    if (isApiCacheValid(cacheKey)) {
        return getCachedApiResponse(cacheKey);
    }

    const [similarResponse, providersResponse] = await Promise.all([
        fetch(`${config.BASE_URL}/movie/${movieId}/similar?api_key=${config.API_KEY}`),
        fetch(`${config.BASE_URL}/movie/${movieId}/watch/providers?api_key=${config.API_KEY}`)
    ]);

    const similarData = await similarResponse.json();
    const providersData = await providersResponse.json();

    const result = {
        similar: similarData.results || [],
        providers: providersData.results || {}
    };

    cacheApiResponse(cacheKey, result);
    return result;
}

// Show movie details in modal
async function showMovieDetails(movieId) {
    try {
        setLoading('movieModal', true);
        
        // Check cache first
        const cacheKey = `movie_${movieId}`;
        if (isApiCacheValid(cacheKey)) {
            const cachedData = getCachedApiResponse(cacheKey);
            if (cachedData) {
                const trailers = cachedData.videos?.results?.filter(video => 
                    video.type === 'Trailer' && video.site === 'YouTube'
                ) || [];
                
                const trailerUrl = trailers.length > 0 
                    ? trailers[0].key
                    : null;

                const posterPath = cachedData.poster_path 
                    ? `${config.IMAGE_BASE_URL}/w500${cachedData.poster_path}`
                    : 'https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';

                renderMovieDetails(cachedData, trailerUrl, posterPath);
                return;
            }
        }

        // First, fetch just the videos to get the trailer quickly
        const videosResponse = await fetch(`${config.BASE_URL}/movie/${movieId}/videos?api_key=${config.API_KEY}`);
        const videosData = await videosResponse.json();
        
        const trailers = videosData.results?.filter(video => 
            video.type === 'Trailer' && video.site === 'YouTube'
        ) || [];
        
        const trailerUrl = trailers.length > 0 
            ? trailers[0].key
            : null;

        // Show initial content with just the trailer
        modalBody.innerHTML = `
            <div class="movie-details">
                <div class="movie-header">
                    <div class="movie-info">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                        </div>
                    </div>
                </div>
                ${trailerUrl ? `
                    <div class="trailer-section">
                        <h3>Watch Trailer</h3>
                        <a href="https://www.youtube.com/watch?v=${trailerUrl}" target="_blank" class="btn-primary">
                            <i class="fas fa-play"></i> Watch on YouTube
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
        
        movieModal.classList.add('active');

        // Add trailer play button event immediately
        const trailerPlaceholder = modalBody.querySelector('.trailer-placeholder');
        if (trailerPlaceholder) {
            trailerPlaceholder.addEventListener('click', () => {
                const trailerUrl = trailerPlaceholder.dataset.trailerUrl;
                trailerPlaceholder.innerHTML = `
                    <iframe width="100%" height="315" 
                        src="${trailerUrl}" 
                        frameborder="0" 
                        allowfullscreen>
                    </iframe>
                `;
            });
        }

        // Now fetch the rest of the movie data
        const basicResponse = await fetch(`${config.BASE_URL}/movie/${movieId}?api_key=${config.API_KEY}`);
        if (!basicResponse.ok) {
            throw new Error(`HTTP error! status: ${basicResponse.status}`);
        }
        const movie = await basicResponse.json();
        
        if (!movie || !movie.id) {
            throw new Error('Invalid movie data received');
        }

        // Cache the movie data
        cacheApiResponse(cacheKey, movie);

        const posterPath = movie.poster_path 
            ? `${config.IMAGE_BASE_URL}/w500${movie.poster_path}`
            : 'https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';

        // Update the modal with full movie details
        const movieHeader = modalBody.querySelector('.movie-header');
        if (movieHeader) {
            movieHeader.innerHTML = `
                <img src="${posterPath}" 
                     alt="${movie.title}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';">
                <div class="movie-info">
                    <h2>${movie.title}</h2>
                    <p class="release-date">${movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A'}</p>
                    <p class="overview">${movie.overview || 'No overview available.'}</p>
                    <div class="movie-stats">
                        <span><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                        <span><i class="fas fa-clock"></i> ${movie.runtime ? movie.runtime + ' min' : 'N/A'}</span>
                    </div>
                    <div class="movie-actions">
                        <button class="btn-add-watchlist" data-id="${movie.id}">
                            <i class="fas fa-plus"></i> Add to Watchlist
                        </button>
                    </div>
                </div>
            `;
        }

        // Add watchlist button event
        const watchlistBtn = modalBody.querySelector('.btn-add-watchlist');
        if (watchlistBtn) {
            watchlistBtn.addEventListener('click', () => addToWatchlist(watchlistBtn.dataset.id));
        }

        // Add loading indicator for additional data
        const trailerSection = modalBody.querySelector('.trailer-section');
        if (trailerSection) {
            trailerSection.insertAdjacentHTML('afterend', `
                <div class="loading-additional">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading additional information...</p>
                </div>
            `);
        }
        
        // Load additional data in the background
        setTimeout(() => preloadAdditionalData(movieId), 100);

    } catch (error) {
        console.error('Error showing movie details:', error);
        setError('movieModal', 'Error loading movie details. Please try again.');
        movieModal.classList.remove('active');
    }
}

// Render movie details
function renderMovieDetails(movie, trailerUrl, posterPath) {
    modalBody.innerHTML = `
        <div class="movie-details">
            <div class="movie-header">
                <img src="${posterPath}" 
                     alt="${movie.title}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';">
                <div class="movie-info">
                    <h2>${movie.title}</h2>
                    <p class="release-date">${movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'N/A'}</p>
                    <p class="overview">${movie.overview || 'No overview available.'}</p>
                    <div class="movie-stats">
                        <span><i class="fas fa-star"></i> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                        <span><i class="fas fa-clock"></i> ${movie.runtime ? movie.runtime + ' min' : 'N/A'}</span>
                    </div>
                    <div class="movie-actions">
                        <button class="btn-add-watchlist" data-id="${movie.id}">
                            <i class="fas fa-plus"></i> Add to Watchlist
                        </button>
                    </div>
                </div>
            </div>
            ${trailerUrl ? `
                <div class="trailer-section">
                    <h3>Watch Trailer</h3>
                    <a href="https://www.youtube.com/watch?v=${trailerUrl}" target="_blank" class="btn-primary">
                        <i class="fas fa-play"></i> Watch on YouTube
                    </a>
                </div>
            ` : ''}
            <div class="loading-additional">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading additional information...</p>
            </div>
        </div>
    `;
    
    movieModal.classList.add('active');

    // Add watchlist button event
    const watchlistBtn = modalBody.querySelector('.btn-add-watchlist');
    if (watchlistBtn) {
        watchlistBtn.addEventListener('click', () => addToWatchlist(watchlistBtn.dataset.id));
    }

    // Add trailer play button event
    const trailerPlaceholder = modalBody.querySelector('.trailer-placeholder');
    if (trailerPlaceholder) {
        trailerPlaceholder.addEventListener('click', () => {
            const trailerUrl = trailerPlaceholder.dataset.trailerUrl;
            trailerPlaceholder.innerHTML = `
                <iframe width="100%" height="315" 
                    src="${trailerUrl}" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            `;
        });
    }
}

// Close modal
modalCloseBtn.addEventListener('click', () => {
    movieModal.classList.remove('active');
});

movieModal.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        movieModal.classList.remove('active');
    }
});

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Search functionality
const performSearch = async (query) => {
    if (query.length < 2) {
        setError('searchResults', 'Please enter at least 2 characters to search');
        return;
    }
    
    setLoading('searchResults', true);
    try {
        const searchResults = await fetchMovies('/search/movie', { query });
        if (!searchResults || searchResults.length === 0) {
            setError('searchResults', 'No movies found matching your search. Please try different keywords.');
            return;
        }
        displayMovies('searchResults', searchResults);
    } catch (error) {
        console.error('Error searching movies:', error);
        setError('searchResults', 'Error searching movies. Please try again.');
    }
};

const debouncedSearch = debounce(performSearch, 500);

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length >= 2) {
        debouncedSearch(query);
    } else {
        // Clear search results when query is too short
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
});

// Get recommendations button
getRecommendationsBtn.addEventListener('click', getRecommendations);

// Load user preferences from localStorage
function loadUserPreferences() {
    const savedWatchlist = localStorage.getItem('watchlist');
    const savedGenres = localStorage.getItem('favoriteGenres');
    
    if (savedWatchlist) {
        userPreferences.watchlist = JSON.parse(savedWatchlist);
    }
    
    if (savedGenres) {
        userPreferences.favoriteGenres = JSON.parse(savedGenres);
    }
}

// Save user preferences to localStorage
function saveUserPreferences() {
    localStorage.setItem('watchlist', JSON.stringify(userPreferences.watchlist));
    localStorage.setItem('favoriteGenres', JSON.stringify(userPreferences.favoriteGenres));
}

// Create genre selection item HTML
function createGenreSelectionItem(genre) {
    const isSelected = userPreferences.favoriteGenres.includes(genre.id);
    return `
        <div class="genre-selection-item ${isSelected ? 'selected' : ''}" data-id="${genre.id}">
            <i class="fas fa-film"></i>
            <h3>${genre.name}</h3>
        </div>
    `;
}

// Display genre selection modal
function showGenreSelection() {
    genreSelectionGrid.innerHTML = genres.map(createGenreSelectionItem).join('');
    genreModal.classList.add('active');
    updateSaveButton();
}

// Update save button state
function updateSaveButton() {
    const selectedGenres = document.querySelectorAll('.genre-selection-item.selected');
    saveGenresBtn.disabled = selectedGenres.length < 3;
}

// Handle genre selection
function handleGenreSelection() {
    const selectedGenres = document.querySelectorAll('.genre-selection-item.selected');
    userPreferences.favoriteGenres = Array.from(selectedGenres).map(item => parseInt(item.dataset.id));
    saveUserPreferences();
    genreModal.classList.remove('active');
    getRecommendations(); // Update recommendations with new genres
}

// Event Listeners
selectGenresBtn.addEventListener('click', showGenreSelection);

genreSelectionGrid.addEventListener('click', (e) => {
    const genreItem = e.target.closest('.genre-selection-item');
    if (genreItem) {
        genreItem.classList.toggle('selected');
        updateSaveButton();
    }
});

saveGenresBtn.addEventListener('click', handleGenreSelection);

// Close genre modal
genreModal.querySelector('.modal-close').addEventListener('click', () => {
    genreModal.classList.remove('active');
});

genreModal.addEventListener('click', (e) => {
    if (e.target === genreModal) {
        genreModal.classList.remove('active');
    }
});

// Initialize content
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load user preferences
        loadUserPreferences();

        // Display genres
        displayGenres();

        // Preload initial content in parallel
        const [featuredMovies, trendingMovies, popularMovies, newReleases] = await Promise.all([
            fetchMoviesWithCache('/movie/popular', {}, 'featured'),
            fetchMoviesWithCache('/trending/movie/week', {}, 'trending'),
            fetchMoviesWithCache('/movie/top_rated', {}, 'topRated'),
            fetchMoviesWithCache('/movie/now_playing', {}, 'nowPlaying')
        ]);

        // Preload posters for all sections
        preloadMoviePosters(featuredMovies.slice(0, 6));
        preloadMoviePosters(trendingMovies.slice(0, 6));
        preloadMoviePosters(popularMovies.slice(0, 6));
        preloadMoviePosters(newReleases.slice(0, 6));

        // Display content
        displayMovies('featuredContent', featuredMovies.slice(0, 6));
        displayMovies('trendingNow', trendingMovies.slice(0, 6));
        displayMovies('popularOnCineMatch', popularMovies.slice(0, 6));
        displayMovies('newReleases', newReleases.slice(0, 6));

        // Update watchlist last since it's user-specific
        updateWatchlist();

    } catch (error) {
        console.error('Error initializing content:', error);
        setError('featuredContent', 'Error loading movies. Please refresh the page.');
        setError('trendingNow', 'Error loading movies. Please refresh the page.');
        setError('continueWatching', 'Error loading watchlist. Please refresh the page.');
        setError('popularOnCineMatch', 'Error loading movies. Please refresh the page.');
        setError('newReleases', 'Error loading movies. Please refresh the page.');
    }
});

// Add refresh button to navbar
const refreshButton = document.createElement('button');
refreshButton.className = 'btn-refresh';
refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
refreshButton.title = 'Refresh Content';
refreshButton.addEventListener('click', async () => {
    refreshButton.classList.add('spinning');
    try {
        // Clear cache
        cache.data = {};
        cache.timestamps = {};
        
        // Set loading states for all sections
        setLoading('featuredContent', true);
        setLoading('trendingNow', true);
        setLoading('popularOnCineMatch', true);
        setLoading('newReleases', true);
        setLoading('continueWatching', true);
        
        // Refresh all content in parallel
        const [featuredMovies, trendingMovies, popularMovies, newReleases, watchlistMovies] = await Promise.all([
            fetchMoviesWithCache('/movie/popular', {}, 'featured'),
            fetchMoviesWithCache('/trending/movie/week', {}, 'trending'),
            fetchMoviesWithCache('/movie/top_rated', {}, 'topRated'),
            fetchMoviesWithCache('/movie/now_playing', {}, 'nowPlaying'),
            Promise.all(
                userPreferences.watchlist.map(movieId => 
                    fetch(`${config.BASE_URL}/movie/${movieId}?api_key=${config.API_KEY}`)
                        .then(res => res.json())
                )
            )
        ]);

        // Update all sections
        displayMovies('featuredContent', featuredMovies.slice(0, 6));
        displayMovies('trendingNow', trendingMovies.slice(0, 6));
        displayMovies('popularOnCineMatch', popularMovies.slice(0, 6));
        displayMovies('newReleases', newReleases.slice(0, 6));
        displayMovies('continueWatching', watchlistMovies);

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'refresh-success';
        successMessage.innerHTML = '<i class="fas fa-check"></i> Content refreshed successfully';
        document.body.appendChild(successMessage);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successMessage.remove();
        }, 3000);

    } catch (error) {
        console.error('Error refreshing content:', error);
        setError('featuredContent', 'Error refreshing content. Please try again.');
        setError('trendingNow', 'Error refreshing content. Please try again.');
        setError('popularOnCineMatch', 'Error refreshing content. Please try again.');
        setError('newReleases', 'Error refreshing content. Please try again.');
        setError('continueWatching', 'Error refreshing watchlist. Please try again.');
    } finally {
        refreshButton.classList.remove('spinning');
    }
});

// Add refresh button to navbar
document.querySelector('.navbar-right').prepend(refreshButton);

// Add intersection observer for lazy loading
function setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });

    document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

// Add debounced scroll handler for infinite scroll
let isLoadingMore = false;
let currentPage = 1;

function handleScroll() {
    if (isLoadingMore) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;
    
    if (scrollPosition >= bodyHeight - 1000) {
        loadMoreContent();
        isLoadingMore = true;
    }
}

async function loadMoreContent() {
    try {
        currentPage++;
        const movies = await fetchMovies('/movie/popular', { page: currentPage });
        if (movies && movies.length > 0) {
            const container = document.getElementById('featuredContent');
            if (container) {
                const newContent = movies.map(createMovieCard).join('');
                container.insertAdjacentHTML('beforeend', newContent);
                setupLazyLoading();
            }
        }
    } catch (error) {
        console.error('Error loading more content:', error);
        // Don't increment page on error
        currentPage--;
    } finally {
        isLoadingMore = false;
    }
}

// Add scroll event listener with debounce
const debouncedScroll = debounce(handleScroll, 200);
window.addEventListener('scroll', debouncedScroll);

// Add service worker for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Get the correct path for the service worker
            const swPath = window.location.pathname.includes('/Movies_recommendations') 
                ? '/Movies_recommendations/sw.js' 
                : '/sw.js';
            
            console.log('Registering service worker at:', swPath);
            const registration = await navigator.serviceWorker.register(swPath);
            console.log('ServiceWorker registration successful:', registration);
            
            // Preload critical assets with correct paths
            const criticalAssets = [
                window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/' : '/',
                window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/index.html' : '/index.html',
                window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/app.js' : '/app.js',
                window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/styles.css' : '/styles.css'
            ];
            
            // Cache critical assets
            const cache = await caches.open('movie-app-v1');
            await cache.addAll(criticalAssets);
            
            // Preload movie posters for featured content
            const featuredResponse = await fetch(`${config.BASE_URL}/movie/popular?api_key=${config.API_KEY}`);
            const featuredData = await featuredResponse.json();
            if (featuredData.results) {
                featuredData.results.slice(0, 6).forEach(movie => {
                    if (movie.poster_path) {
                        const img = new Image();
                        img.src = `${config.IMAGE_BASE_URL}/w500${movie.poster_path}`;
                    }
                });
            }
        } catch (err) {
            console.warn('ServiceWorker registration failed:', err);
            // Fallback to regular caching
            if ('caches' in window) {
                try {
                    const cache = await caches.open('movie-app-v1');
                    const fallbackAssets = [
                        window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/' : '/',
                        window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/index.html' : '/index.html',
                        window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/app.js' : '/app.js',
                        window.location.pathname.includes('/Movies_recommendations') ? '/Movies_recommendations/styles.css' : '/styles.css'
                    ];
                    await cache.addAll(fallbackAssets);
                } catch (cacheErr) {
                    console.warn('Cache fallback failed:', cacheErr);
                }
            }
        }
    });
}

// Add error boundary for failed image loads
function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = 'https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';
}

// Add performance monitoring
const performanceMetrics = {
    startTime: performance.now(),
    pageLoads: 0,
    errors: 0
};

window.addEventListener('load', () => {
    const loadTime = performance.now() - performanceMetrics.startTime;
    console.log(`Page loaded in ${loadTime}ms`);
    performanceMetrics.pageLoads++;
});

// Add error tracking
window.addEventListener('error', (event) => {
    performanceMetrics.errors++;
    console.error('Error:', event.error);
});

// Preload additional data
async function preloadAdditionalData(movieId) {
    try {
        const { similar, providers } = await batchFetchAdditionalData(movieId);
        
        // Preload posters for similar movies
        preloadMoviePosters(similar.slice(0, 4));

        const flatrate = providers.flatrate || [];
        const rent = providers.rent || [];
        const buy = providers.buy || [];

        // Update modal with additional content
        const loadingSection = modalBody.querySelector('.loading-additional');
        if (loadingSection) {
            loadingSection.outerHTML = `
                <div class="streaming-section">
                    <h3>Where to Watch</h3>
                    ${flatrate.length > 0 ? `
                        <div class="provider-group">
                            <h4><i class="fas fa-play-circle"></i> Stream</h4>
                            <div class="provider-list">
                                ${flatrate.map(provider => `
                                    <div class="provider">
                                        <img src="https://image.tmdb.org/t/p/w92${provider.logo_path}" 
                                             alt="${provider.provider_name}"
                                             loading="lazy">
                                        <span>${provider.provider_name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${rent.length > 0 ? `
                        <div class="provider-group">
                            <h4><i class="fas fa-film"></i> Rent</h4>
                            <div class="provider-list">
                                ${rent.map(provider => `
                                    <div class="provider">
                                        <img src="https://image.tmdb.org/t/p/w92${provider.logo_path}" 
                                             alt="${provider.provider_name}"
                                             loading="lazy">
                                        <span>${provider.provider_name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${buy.length > 0 ? `
                        <div class="provider-group">
                            <h4><i class="fas fa-shopping-cart"></i> Buy</h4>
                            <div class="provider-list">
                                ${buy.map(provider => `
                                    <div class="provider">
                                        <img src="https://image.tmdb.org/t/p/w92${provider.logo_path}" 
                                             alt="${provider.provider_name}"
                                             loading="lazy">
                                        <span>${provider.provider_name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${flatrate.length === 0 && rent.length === 0 && buy.length === 0 ? `
                        <p class="no-providers">No streaming information available for this movie.</p>
                    ` : ''}
                </div>
                ${similar.length > 0 ? `
                    <div class="similar-movies">
                        <h3>Similar Movies</h3>
                        <div class="row-content">
                            ${similar.slice(0, 4).map(createMovieCard).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        }
    } catch (error) {
        console.error('Error loading additional data:', error);
        const loadingSection = modalBody.querySelector('.loading-additional');
        if (loadingSection) {
            loadingSection.innerHTML = '<p>Error loading additional information. Please try again.</p>';
        }
    }
} 