// DOM Elements
const elements = {
    navbar: document.querySelector('.navbar'),
    heroSection: document.querySelector('.hero'),
    movieGrids: document.querySelectorAll('.movie-grid'),
    modal: document.querySelector('.modal'),
    modalClose: document.querySelector('.modal-close'),
    modalContent: document.querySelector('.modal-content'),
    loadingIndicator: document.querySelector('.loading-indicator'),
    navLinks: document.querySelectorAll('.nav-right a'),
    genreModal: document.querySelector('.genre-modal'),
    genreButtons: document.querySelectorAll('.genre-selection-item'),
    saveGenresBtn: document.getElementById('saveGenres'),
    randomMoviesSection: document.querySelector('.random-movies-section'),
    randomMoviesGrid: document.querySelector('.random-movies-grid'),
    randomMoviesTitle: document.querySelector('.random-movies-title'),
    randomMoviesClose: document.querySelector('.random-movies-close'),
    movieGrid: document.querySelector('.movie-grid'),
    searchInput: document.querySelector('.search-input'),
    searchButton: document.querySelector('.search-button'),
    sections: document.querySelectorAll('section')
};

// Log DOM elements for debugging
console.log('DOM Elements:', elements);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Show loading indicator
        elements.loadingIndicator.style.display = 'flex';
        
        // Load user preferences
        loadUserPreferences();

        // Fetch different movies for each section with random pages
        const [trendingMovies, popularMovies, newReleases, recommendedMovies] = await Promise.all([
            fetchMovies('/trending/movie/week'),
            fetchMovies('/movie/popular'),
            fetchMovies('/movie/now_playing'),
            fetchMovies('/movie/top_rated')
        ]);

        // Display movies for each section (take only 6 movies from each shuffled array)
        const sections = document.querySelectorAll('.content-row');
        sections[0].querySelector('.movie-grid').innerHTML = trendingMovies.slice(0, 6).map(createMovieCard).join('');
        sections[1].querySelector('.movie-grid').innerHTML = popularMovies.slice(0, 6).map(createMovieCard).join('');
        sections[2].querySelector('.movie-grid').innerHTML = newReleases.slice(0, 6).map(createMovieCard).join('');
        sections[3].querySelector('.movie-grid').innerHTML = recommendedMovies.slice(0, 6).map(createMovieCard).join('');

        // Add click events to all movie cards
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
        });

        // Setup navigation for each section
        sections.forEach(section => setupSectionNavigation(section));

        // Hide loading indicator
        elements.loadingIndicator.style.display = 'none';
    } catch (error) {
        console.error('Error initializing content:', error);
        elements.loadingIndicator.style.display = 'none';
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
    navbar: !!elements.navbar,
    searchContainer: !!elements.searchContainer,
    searchInput: !!elements.searchInput,
    movieModal: !!elements.modal,
    modalCloseBtn: !!elements.modalClose,
    modalBody: !!elements.modalContent,
    getRecommendationsBtn: !!elements.getRecommendationsBtn
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        elements.navbar.classList.add('navbar-scrolled');
    } else {
        elements.navbar.classList.remove('navbar-scrolled');
    }
});

// Toggle search bar
elements.searchIcon.addEventListener('click', () => {
    elements.searchContainer.classList.toggle('active');
    if (elements.searchContainer.classList.contains('active')) {
        elements.searchInput.focus();
    }
});

// Handle search
elements.searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const query = elements.searchInput.value.trim();
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
    if (!elements.searchContainer.contains(e.target)) {
        elements.searchContainer.classList.remove('active');
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

// Fetch movies from TMDb API with random page selection
async function fetchMovies(endpoint, params = {}) {
    try {
        // Get a random page between 1 and 20
        const randomPage = Math.floor(Math.random() * 20) + 1;
        
        const queryParams = new URLSearchParams({
            api_key: config.API_KEY,
            language: 'en-US',
            page: randomPage,
            ...params
        });
        
        console.log(`Fetching movies from page ${randomPage}`);
        
        const response = await fetch(`${config.BASE_URL}${endpoint}?${queryParams}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            console.warn(`No results found for endpoint: ${endpoint}`);
            return [];
        }
        
        // Shuffle the results before returning
        return shuffleArray(data.results);
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
        elements.modalContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading movie details...</p>
            </div>
        `;
        elements.modal.classList.add('active');

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

        elements.modalContent.innerHTML = `
            <button class="modal-close">&times;</button>
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
                            ${movieData.genres ? `<span><i class="fas fa-film"></i> ${movieData.genres.map(g => g.name).join(', ')}</span>` : ''}
                        </div>
                    </div>
                </div>
                ${trailer ? `
                    <div class="trailer-section">
                        <h3>Watch Trailer</h3>
                        <div class="trailer-container">
                            <iframe 
                                src="https://www.youtube.com/embed/${trailer.key}?rel=0" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Add close button functionality
        const closeBtn = elements.modalContent.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                elements.modal.classList.remove('active');
            });
        }

    } catch (error) {
        console.error('Error showing movie details:', error);
        elements.modalContent.innerHTML = `
            <button class="modal-close">&times;</button>
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading movie details. Please try again.</p>
            </div>
        `;
    }
}

// Close modal
elements.modalClose.addEventListener('click', () => {
    elements.modal.classList.remove('active');
});

elements.modal.addEventListener('click', (e) => {
    if (e.target === elements.modal) {
        elements.modal.classList.remove('active');
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

elements.searchInput.addEventListener('input', (e) => {
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
elements.getRecommendationsBtn.addEventListener('click', getRecommendations);

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
    elements.genreSelectionGrid.innerHTML = genres.map(createGenreSelectionItem).join('');
    elements.genreModal.classList.add('active');
    updateSaveButton();
}

// Update save button state
function updateSaveButton() {
    const selectedGenres = document.querySelectorAll('.genre-selection-item.selected');
    elements.saveGenresBtn.disabled = selectedGenres.length < 3;
}

// Handle genre selection
function handleGenreSelection() {
    const selectedGenres = document.querySelectorAll('.genre-selection-item.selected');
    userPreferences.favoriteGenres = Array.from(selectedGenres).map(item => parseInt(item.dataset.id));
    saveUserPreferences();
    elements.genreModal.classList.remove('active');
    getRecommendations(); // Update recommendations with new genres
}

// Event Listeners
elements.selectGenresBtn.addEventListener('click', showGenreSelection);

elements.genreSelectionGrid.addEventListener('click', (e) => {
    const genreItem = e.target.closest('.genre-selection-item');
    if (genreItem) {
        genreItem.classList.toggle('selected');
        updateSaveButton();
    }
});

elements.saveGenresBtn.addEventListener('click', handleGenreSelection);

// Close genre modal
elements.genreModal.querySelector('.modal-close').addEventListener('click', () => {
    elements.genreModal.classList.remove('active');
});

elements.genreModal.addEventListener('click', (e) => {
    if (e.target === elements.genreModal) {
        elements.genreModal.classList.remove('active');
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
        const loadingSection = elements.modalContent.querySelector('.loading-additional');
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
        const loadingSection = elements.modalContent.querySelector('.loading-additional');
        if (loadingSection) {
            loadingSection.innerHTML = '<p>Error loading additional information. Please try again.</p>';
        }
    }
}

// Function to get random movies by genre
async function getRandomMoviesByGenre(genreId) {
    try {
        const randomPage = Math.floor(Math.random() * 10) + 1;
        const response = await fetch(`${TMDB_API_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=100&page=${randomPage}&language=en-US`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Get 3 random movies
            const selectedMovies = shuffleArray([...data.results]).slice(0, 3);
            
            // Get additional details including trailers for each movie
            const moviesWithDetails = await Promise.all(
                selectedMovies.map(async (movie) => {
                    const detailsResponse = await fetch(`${TMDB_API_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=videos`);
                    const details = await detailsResponse.json();
                    
                    // Get trailer
                    let trailer = null;
                    if (details.videos && details.videos.results) {
                        const trailers = details.videos.results.filter(v => 
                            v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
                        );
                        if (trailers.length > 0) {
                            trailer = trailers[Math.floor(Math.random() * trailers.length)];
                        }
                    }
                    
                    return {
                        ...movie,
                        trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
                    };
                })
            );
            
            return moviesWithDetails;
        }
        return [];
    } catch (error) {
        console.error('Error fetching random movies:', error);
        return [];
    }
}

// Function to display random movies
function displayRandomMovies(movies) {
    const container = document.getElementById('randomMovies');
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
            <h2>Random Movies</h2>
            <div class="movie-grid"></div>
        `;
        container.parentNode.insertBefore(contentRow, container);
    }
    
    const movieGrid = contentRow.querySelector('.movie-grid');
    movieGrid.innerHTML = movies.map(movie => `
        <div class="movie-card" data-movie-id="${movie.id}">
            <img src="${movie.poster_path ? TMDB_IMG_URL + movie.poster_path : 'placeholder.jpg'}" 
                 alt="${movie.title}" 
                 loading="lazy">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p class="rating">⭐ ${movie.vote_average}/10</p>
                ${movie.trailer ? `
                    <a href="${movie.trailer}" target="_blank" class="trailer-link" onclick="event.stopPropagation();">
                        <i class="fab fa-youtube"></i> Watch Trailer
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Setup navigation for this section
    setupSectionNavigation(contentRow);
    
    // Add click event for movie details
    movieGrid.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
    });
}

// Update the genre selection handler
function handleGenreSelection(genreId) {
    const genreModal = document.getElementById('genreModal');
    if (genreModal) {
        genreModal.style.display = 'none';
    }
    
    // Show loading state
    const randomMoviesContainer = document.getElementById('randomMovies');
    if (randomMoviesContainer) {
        randomMoviesContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading random movies...</p>
            </div>
        `;
    }
    
    // Get and display random movies
    getRandomMoviesByGenre(genreId).then(movies => {
        displayRandomMovies(movies);
    });
}

// Add styles for trailer link
const style = document.createElement('style');
style.textContent = `
    .trailer-link {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #ff0000;
        text-decoration: none;
        font-size: 0.9rem;
        margin-top: 5px;
        transition: color 0.3s ease;
    }
    
    .trailer-link:hover {
        color: #cc0000;
    }
    
    .trailer-link i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(style);

// Navigation functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-right a');
    const sections = {
        'Home': loadHomeContent,
        'Movies': loadMoviesContent,
        'TV Series': loadTVSeriesContent,
        'New & Popular': loadNewAndPopularContent,
        'My List': loadMyListContent
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get the section name from the link text
            const section = link.textContent.trim();
            
            // Hide all content rows
            document.querySelectorAll('.content-row').forEach(row => {
                row.style.display = 'none';
            });
            
            // Show loading indicator
            elements.loadingIndicator.style.display = 'flex';
            
            // Load the corresponding content
            if (sections[section]) {
                sections[section]();
            }
        });
    });
}

// Home content
async function loadHomeContent() {
    try {
        const [trendingMovies, popularMovies, newReleases, recommendedMovies] = await Promise.all([
            fetchMovies('/trending/movie/week'),
            fetchMovies('/movie/popular'),
            fetchMovies('/movie/now_playing'),
            fetchMovies('/movie/top_rated')
        ]);

        // Show all sections
        document.querySelectorAll('.content-row').forEach(row => {
            row.style.display = 'block';
        });

        // Update content
        const sections = document.querySelectorAll('.content-row');
        sections[0].querySelector('.movie-grid').innerHTML = trendingMovies.slice(0, 6).map(createMovieCard).join('');
        sections[1].querySelector('.movie-grid').innerHTML = popularMovies.slice(0, 6).map(createMovieCard).join('');
        sections[2].querySelector('.movie-grid').innerHTML = newReleases.slice(0, 6).map(createMovieCard).join('');
        sections[3].querySelector('.movie-grid').innerHTML = recommendedMovies.slice(0, 6).map(createMovieCard).join('');

        // Add click events to movie cards
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
        });

        // Setup navigation for each section
        sections.forEach(section => setupSectionNavigation(section));
    } catch (error) {
        console.error('Error loading home content:', error);
        showError('Error loading content. Please try again.');
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// Movies content
async function loadMoviesContent() {
    try {
        const [actionMovies, dramaMovies, comedyMovies, thrillerMovies] = await Promise.all([
            fetchMovies('/discover/movie', { with_genres: 28 }), // Action
            fetchMovies('/discover/movie', { with_genres: 18 }), // Drama
            fetchMovies('/discover/movie', { with_genres: 35 }), // Comedy
            fetchMovies('/discover/movie', { with_genres: 53 })  // Thriller
        ]);

        // Create sections for different genres
        const mainContent = document.querySelector('main');
        mainContent.innerHTML = `
            <section class="content-row">
                <h2>Action Movies</h2>
                <div class="movie-grid">${actionMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Drama Movies</h2>
                <div class="movie-grid">${dramaMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Comedy Movies</h2>
                <div class="movie-grid">${comedyMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Thriller Movies</h2>
                <div class="movie-grid">${thrillerMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
        `;

        // Add click events and navigation
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
        });
        document.querySelectorAll('.content-row').forEach(section => setupSectionNavigation(section));
    } catch (error) {
        console.error('Error loading movies content:', error);
        showError('Error loading movies. Please try again.');
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// TV Series content
async function loadTVSeriesContent() {
    try {
        const [trendingTV, popularTV, topRatedTV, onTheAirTV] = await Promise.all([
            fetchMovies('/trending/tv/week'),
            fetchMovies('/tv/popular'),
            fetchMovies('/tv/top_rated'),
            fetchMovies('/tv/on_the_air')
        ]);

        // Create sections for TV shows
        const mainContent = document.querySelector('main');
        mainContent.innerHTML = `
            <section class="content-row">
                <h2>Trending TV Shows</h2>
                <div class="movie-grid">${trendingTV.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Popular TV Shows</h2>
                <div class="movie-grid">${popularTV.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Top Rated TV Shows</h2>
                <div class="movie-grid">${topRatedTV.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>On The Air</h2>
                <div class="movie-grid">${onTheAirTV.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
        `;

        // Add click events and navigation
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
        });
        document.querySelectorAll('.content-row').forEach(section => setupSectionNavigation(section));
    } catch (error) {
        console.error('Error loading TV series content:', error);
        showError('Error loading TV shows. Please try again.');
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// New & Popular content
async function loadNewAndPopularContent() {
    try {
        const [newMovies, popularMovies, upcomingMovies, topRatedMovies] = await Promise.all([
            fetchMovies('/movie/now_playing'),
            fetchMovies('/movie/popular'),
            fetchMovies('/movie/upcoming'),
            fetchMovies('/movie/top_rated')
        ]);

        // Create sections for new and popular content
        const mainContent = document.querySelector('main');
        mainContent.innerHTML = `
            <section class="content-row">
                <h2>New Releases</h2>
                <div class="movie-grid">${newMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Popular Now</h2>
                <div class="movie-grid">${popularMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Coming Soon</h2>
                <div class="movie-grid">${upcomingMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
            <section class="content-row">
                <h2>Top Rated</h2>
                <div class="movie-grid">${topRatedMovies.slice(0, 6).map(createMovieCard).join('')}</div>
            </section>
        `;

        // Add click events and navigation
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
        });
        document.querySelectorAll('.content-row').forEach(section => setupSectionNavigation(section));
    } catch (error) {
        console.error('Error loading new and popular content:', error);
        showError('Error loading content. Please try again.');
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// My List content
async function loadMyListContent() {
    try {
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        
        if (watchlist.length === 0) {
            const mainContent = document.querySelector('main');
            mainContent.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-list"></i>
                    <h2>Your List is Empty</h2>
                    <p>Add movies to your list to watch them later</p>
                    <button class="btn-play" onclick="loadHomeContent()">Browse Movies</button>
                </div>
            `;
            return;
        }

        // Fetch details for all movies in the watchlist
        const watchlistMovies = await Promise.all(
            watchlist.map(id => 
                fetch(`${config.BASE_URL}/movie/${id}?api_key=${config.API_KEY}`)
                    .then(res => res.json())
            )
        );

        // Create section for watchlist
        const mainContent = document.querySelector('main');
        mainContent.innerHTML = `
            <section class="content-row">
                <h2>My List</h2>
                <div class="movie-grid">${watchlistMovies.map(createMovieCard).join('')}</div>
            </section>
        `;

        // Add click events and navigation
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => showMovieDetails(card.dataset.movieId));
        });
        document.querySelectorAll('.content-row').forEach(section => setupSectionNavigation(section));
    } catch (error) {
        console.error('Error loading watchlist:', error);
        showError('Error loading your list. Please try again.');
    } finally {
        elements.loadingIndicator.style.display = 'none';
    }
}

// Error display function
function showError(message) {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadHomeContent(); // Load home content by default
}); 