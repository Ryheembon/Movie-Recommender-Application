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
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Check if cache is valid
function isCacheValid(key) {
    const timestamp = cache.timestamps[key];
    if (!timestamp) return false;
    return Date.now() - timestamp < cache.maxAge;
}

// Fetch movies with cache
async function fetchMoviesWithCache(endpoint, params = {}, cacheKey) {
    try {
        if (cacheKey && isCacheValid(cacheKey)) {
            return cache.data[cacheKey];
        }

        const response = await fetch(`${config.BASE_URL}${endpoint}?${new URLSearchParams({
            api_key: config.API_KEY,
            language: 'en-US',
            ...params
        })}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (cacheKey) {
            cache.data[cacheKey] = data.results;
            cache.timestamps[cacheKey] = Date.now();
        }
        
        return data.results;
    } catch (error) {
        console.error('Error fetching movies:', error);
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

// Simple trailer popup function
function showTrailer(trailerUrl) {
    const modal = document.getElementById('movieModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Create trailer container
    modalContent.innerHTML = `
        <div class="modal-close">&times;</div>
        <div class="trailer-container">
            <iframe 
                src="${trailerUrl}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        </div>
    `;
    
    // Show modal
    modal.classList.add('active');
    
    // Close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Create movie card
function createMovieCard(movie) {
    const posterPath = movie.poster_path 
        ? `${config.IMAGE_BASE_URL}/w500${movie.poster_path}`
        : 'https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <img src="${posterPath}" 
                 alt="${movie.title}"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
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

// Function to create navigation arrows
function createNavigationArrows() {
    return `
        <button class="nav-arrow prev" aria-label="Previous movies">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="nav-arrow next" aria-label="Next movies">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

// Function to handle navigation
function setupNavigation(container) {
    const movieGrid = container.querySelector('.movie-grid');
    const prevBtn = container.querySelector('.nav-arrow.prev');
    const nextBtn = container.querySelector('.nav-arrow.next');
    
    if (!movieGrid || !prevBtn || !nextBtn) return;
    
    const scrollAmount = movieGrid.offsetWidth * 0.8;
    
    prevBtn.addEventListener('click', () => {
        movieGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });
    
    nextBtn.addEventListener('click', () => {
        movieGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });
    
    movieGrid.addEventListener('scroll', () => {
        const isAtStart = movieGrid.scrollLeft <= 0;
        const isAtEnd = movieGrid.scrollLeft >= (movieGrid.scrollWidth - movieGrid.offsetWidth);
        
        prevBtn.classList.toggle('hidden', isAtStart);
        nextBtn.classList.toggle('hidden', isAtEnd);
    });
    
    prevBtn.classList.add('hidden');
    if (movieGrid.scrollWidth <= movieGrid.offsetWidth) {
        nextBtn.classList.add('hidden');
    }
}

// Display movies
function displayMovies(containerId, movies) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!movies || movies.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>No movies found</p>
            </div>
        `;
        return;
    }
    
    let contentRow = container.closest('.content-row');
    if (!contentRow) {
        contentRow = document.createElement('div');
        contentRow.className = 'content-row';
        contentRow.innerHTML = `
            <h2>${containerId.replace(/([A-Z])/g, ' $1').trim()}</h2>
            <div class="movie-grid"></div>
        `;
        container.parentNode.insertBefore(contentRow, container);
    }
    
    const movieGrid = contentRow.querySelector('.movie-grid');
    movieGrid.innerHTML = movies.map(createMovieCard).join('');
    
    // Setup navigation for this section
    setupSectionNavigation(contentRow);
    
    movieGrid.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
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

// Show movie details
async function showMovieDetails(movieId) {
    try {
        modalBody.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner"></i>
                <p>Loading movie details...</p>
            </div>
        `;
        movieModal.classList.add('active');

        const [movieData, videosData] = await Promise.all([
            fetch(`${config.BASE_URL}/movie/${movieId}?api_key=${config.API_KEY}`).then(res => res.json()),
            fetch(`${config.BASE_URL}/movie/${movieId}/videos?api_key=${config.API_KEY}`).then(res => res.json())
        ]);

        const trailer = videosData.results?.find(video => 
            video.type === 'Trailer' && video.site === 'YouTube'
        );

        const posterPath = movieData.poster_path 
            ? `${config.IMAGE_BASE_URL}/w500${movieData.poster_path}`
            : 'https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';

        modalBody.innerHTML = `
            <div class="movie-details">
                <div class="movie-header">
                    <img src="${posterPath}" 
                         alt="${movieData.title}"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://placehold.co/500x750/1A1B26/FFFFFF?text=No+Image';">
                    <div class="movie-info">
                        <h2>${movieData.title}</h2>
                        <p class="release-date">${movieData.release_date ? new Date(movieData.release_date).toLocaleDateString() : 'N/A'}</p>
                        <p class="overview">${movieData.overview || 'No overview available.'}</p>
                        <div class="movie-stats">
                            <span><i class="fas fa-star"></i> ${movieData.vote_average ? movieData.vote_average.toFixed(1) : 'N/A'}</span>
                            <span><i class="fas fa-clock"></i> ${movieData.runtime ? movieData.runtime + ' min' : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                ${trailer ? `
                    <div class="trailer-section">
                        <h3>Watch Trailer</h3>
                        <div class="trailer-container">
                            <iframe 
                                width="100%" 
                                height="315" 
                                src="https://www.youtube.com/embed/${trailer.key}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('Error showing movie details:', error);
        modalBody.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading movie details. Please try again.</p>
            </div>
        `;
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

// Function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Add loading indicator
function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.className = 'loading-indicator';
    loader.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading movies...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoadingIndicator() {
    const loader = document.querySelector('.loading-indicator');
    if (loader) {
        loader.remove();
    }
}

// Function to setup recommendation section navigation
function setupRecommendationNavigation() {
    const recommendationSection = document.querySelector('.recommendation-section');
    if (!recommendationSection) return;

    const movieGrid = recommendationSection.querySelector('.movie-grid');
    if (!movieGrid) return;

    // Create navigation arrows
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-arrow prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.setAttribute('aria-label', 'Previous movies');

    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-arrow next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.setAttribute('aria-label', 'Next movies');

    // Add arrows to the section
    recommendationSection.appendChild(prevBtn);
    recommendationSection.appendChild(nextBtn);

    // Setup scroll functionality
    const scrollAmount = movieGrid.offsetWidth * 0.8;

    prevBtn.addEventListener('click', () => {
        movieGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        movieGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Show/hide arrows based on scroll position
    movieGrid.addEventListener('scroll', () => {
        const isAtStart = movieGrid.scrollLeft <= 0;
        const isAtEnd = movieGrid.scrollLeft >= (movieGrid.scrollWidth - movieGrid.offsetWidth);

        prevBtn.classList.toggle('hidden', isAtStart);
        nextBtn.classList.toggle('hidden', isAtEnd);
    });

    // Initial arrow visibility
    prevBtn.classList.add('hidden');
    if (movieGrid.scrollWidth <= movieGrid.offsetWidth) {
        nextBtn.classList.add('hidden');
    }
}

// Function to setup navigation for a movie section
function setupSectionNavigation(section) {
    const movieGrid = section.querySelector('.movie-grid');
    if (!movieGrid) return;

    // Remove existing arrows if any
    const existingArrows = section.querySelectorAll('.nav-arrow');
    existingArrows.forEach(arrow => arrow.remove());

    // Create navigation arrows
    const prevBtn = document.createElement('button');
    prevBtn.className = 'nav-arrow prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.setAttribute('aria-label', 'Previous movies');

    const nextBtn = document.createElement('button');
    nextBtn.className = 'nav-arrow next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.setAttribute('aria-label', 'Next movies');

    // Add arrows to the section
    section.appendChild(prevBtn);
    section.appendChild(nextBtn);

    // Setup scroll functionality
    const scrollAmount = movieGrid.offsetWidth * 0.8;

    prevBtn.addEventListener('click', () => {
        movieGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener('click', () => {
        movieGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Show/hide arrows based on scroll position
    movieGrid.addEventListener('scroll', () => {
        const isAtStart = movieGrid.scrollLeft <= 0;
        const isAtEnd = movieGrid.scrollLeft >= (movieGrid.scrollWidth - movieGrid.offsetWidth);

        prevBtn.classList.toggle('hidden', isAtStart);
        nextBtn.classList.toggle('hidden', isAtEnd);
    });

    // Initial arrow visibility
    prevBtn.classList.add('hidden');
    if (movieGrid.scrollWidth <= movieGrid.offsetWidth) {
        nextBtn.classList.add('hidden');
    }
}

// Update the initialization code
document.addEventListener('DOMContentLoaded', async () => {
    try {
        showLoadingIndicator();
        
        // Load user preferences
        loadUserPreferences();

        // Display genres
        displayGenres();

        // Fetch different movies for each section with different pages
        const [featuredMovies, trendingMovies, popularMovies, newReleases] = await Promise.all([
            fetchMoviesWithCache('/movie/popular', { page: Math.floor(Math.random() * 5) + 1 }, 'featured'),
            fetchMoviesWithCache('/trending/movie/week', { page: Math.floor(Math.random() * 5) + 1 }, 'trending'),
            fetchMoviesWithCache('/movie/top_rated', { page: Math.floor(Math.random() * 5) + 1 }, 'topRated'),
            fetchMoviesWithCache('/movie/now_playing', { page: Math.floor(Math.random() * 5) + 1 }, 'nowPlaying')
        ]);

        // Display movies for each section
        displayMovies('featuredContent', featuredMovies);
        displayMovies('trendingNow', trendingMovies);
        displayMovies('popularOnCineMatch', popularMovies);
        displayMovies('newReleases', newReleases);

        // Setup recommendation section navigation
        setupRecommendationNavigation();

        hideLoadingIndicator();
    } catch (error) {
        console.error('Error initializing content:', error);
        hideLoadingIndicator();
        document.querySelectorAll('.content-row').forEach(row => {
            row.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading movies. Please refresh the page.</p>
                </div>
            `;
        });
    }
});

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
            // Update the path to match your project structure
            const swPath = '/Movies_recommendations/service-worker.js';
            console.log('Registering service worker at:', swPath);
            
            const registration = await navigator.serviceWorker.register(swPath);
            console.log('ServiceWorker registration successful:', registration);
            
            // Clear any old caches
            try {
                const cacheKeys = await caches.keys();
                await Promise.all(
                    cacheKeys.map(key => {
                        if (key !== 'movie-app-v1') {
                            return caches.delete(key);
                        }
                    })
                );
            } catch (err) {
                console.warn('Failed to clear old caches:', err);
            }
            
        } catch (err) {
            console.warn('ServiceWorker registration failed:', err);
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