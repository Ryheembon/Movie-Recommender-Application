// Constants
const API_KEY = config.API_KEY;
const BASE_URL = config.BASE_URL;
const IMAGE_BASE_URL = config.IMAGE_BASE_URL;

// DOM Elements (will be set after DOM loads)
let navbar, heroSection, heroContent, movieGrids, modal, searchInput, searchButton;

// State
let currentPage = 1;
let isLoading = false;
let hasMorePages = true;
let displayedMovies = new Set(); // Track displayed movies to avoid duplicates
let favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];

// Setup Infinite Scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', handleScroll);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if config is loaded
    if (typeof config === 'undefined') {
        console.error('Config not loaded! Make sure config.js is included before app.js');
        return;
    }
    
    // Initialize favorites from localStorage
    try {
        const storedFavorites = localStorage.getItem('movieFavorites');
        if (storedFavorites) {
            favorites = JSON.parse(storedFavorites);
        }
    } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
        favorites = [];
    }

    // Set DOM elements
    navbar = document.querySelector('.navbar');
    heroSection = document.querySelector('.hero');
    heroContent = document.querySelector('.hero-content');
    movieGrids = document.querySelectorAll('.movie-grid');
    modal = document.getElementById('movieModal');
    searchInput = document.querySelector('.search-input');
    searchButton = document.querySelector('.search-button');

    loadHeroContent();
    loadMovieContent();
    handleResize();
    setupInfiniteScroll();

    // Search functionality
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            handleSearch();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Modal close functionality
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target === modal) {
                closeModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });
});

// Scroll Handler
function handleScroll() {
    // Navbar background on scroll
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Infinite scroll
    if (isNearBottom() && !isLoading && hasMorePages) {
        loadMoreContent();
    }
}

// Resize Handler
function handleResize() {
    // Update hero section height
    heroSection.style.height = `${window.innerHeight * 0.8}px`;
}

// Load Hero Content
async function loadHeroContent() {
    try {
        const response = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US&page=1`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const featuredMovie = data.results[0];
            const heroSection = document.querySelector('.hero');
            
            // Set background image with fallback
            if (featuredMovie.backdrop_path) {
                heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url(${IMAGE_BASE_URL}/original${featuredMovie.backdrop_path})`;
            } else if (featuredMovie.poster_path) {
                heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url(${IMAGE_BASE_URL}/original${featuredMovie.poster_path})`;
            } else {
                heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzUiIHZpZXdCb3g9IjAgMCAxMjAwIDY3NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjc1IiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik02MDAgMzM3LjVMMzUwIDQ1MEgzNTBMNjAwIDMzNy41TDg1MCA0NTBINzUwTDYwMCAzMzcuNVoiIGZpbGw9IiM2NjYiLz4KPC9zdmc+)`;
            }
            
            // Update hero content with safe data handling
            const heroContent = document.querySelector('.hero-content');
            const safeTitle = featuredMovie.title || 'Featured Movie';
            const safeOverview = featuredMovie.overview || 'Discover amazing movies and TV shows on CineStream.';
            
            heroContent.innerHTML = `
                <h1>${safeTitle}</h1>
                <p>${safeOverview}</p>
                <div class="hero-buttons">
                    <button class="btn-play" onclick="playMovie(${featuredMovie.id})">
                        <i class="fas fa-play"></i> Watch Now
                    </button>
                    <button class="btn-more" onclick="showMovieDetails(${featuredMovie.id})">
                        <i class="fas fa-info-circle"></i> More Info
                    </button>
                </div>
            `;
            
            // Add fade-in animation
            heroContent.classList.add('visible');
        }
    } catch (error) {
        console.error('Error loading hero content:', error);
    }
}

// Load Movie Content
async function loadMovieContent() {
    try {
        // Make API calls to fetch movie data
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

        // Display movies for each category
        if (trendingData.results) {
            displayMovies(trendingData.results, 'trending');
        }
        if (popularData.results) {
            displayMovies(popularData.results, 'popular');
        }
        if (newData.results) {
            displayMovies(newData.results, 'new');
        }
        if (recommendedData.results) {
            displayMovies(recommendedData.results, 'recommended');
        }

    } catch (error) {
        console.error('Error loading movie content:', error);
        showLoadingError();
    }
}

// Show loading error message
function showLoadingError() {
    const mainContent = document.querySelector('main');
    mainContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>Unable to load movies</h2>
            <p>Please check your internet connection and try again.</p>
            <button class="btn-play" onclick="location.reload()">
                <i class="fas fa-refresh"></i> Retry
            </button>
        </div>
    `;
}

// Filter duplicate movies across categories
function filterDuplicates(movies) {
    return movies.filter(movie => {
        if (!displayedMovies.has(movie.id)) {
            displayedMovies.add(movie.id);
            return true;
        }
        return false;
    });
}

// Display Movies
function displayMovies(movies, category) {
    const movieGrid = document.querySelector(`.content-row[data-category="${category}"] .movie-grid`);
    
    if (!movieGrid) {
        console.error(`Movie grid not found for category: ${category}`);
        return;
    }

    // Clear existing movies
    movieGrid.innerHTML = '';

    // Limit to 10 movies per category for better performance
    const limitedMovies = movies.slice(0, 10);

    limitedMovies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        movieGrid.appendChild(movieCard);
    });

    // Add fade-in animation
    const contentRow = movieGrid.closest('.content-row');
    if (contentRow) {
        contentRow.classList.add('visible');
    }
}

// Create Movie Card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // Check if movie is in favorites
    const isFavorite = favorites.some(fav => fav.id === movie.id);
    
    // Handle missing poster images
    const posterUrl = movie.poster_path 
        ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';
    
    // Handle missing release date
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    
    // Clean data for onclick handlers (escape quotes and handle undefined values)
    const cleanTitle = (movie.title || 'Unknown Title').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const cleanOverview = (movie.overview || 'No description available').replace(/'/g, "\\'").replace(/"/g, '\\"');
    const cleanPosterPath = movie.poster_path || '';
    const cleanReleaseDate = movie.release_date || '';
    const cleanVoteAverage = movie.vote_average || 0;
    
    // Make the entire card clickable
    card.onclick = (e) => {
        // Only trigger if the click wasn't on a button
        if (!e.target.closest('button')) {
            showMovieDetails(movie.id);
        }
    };
    
    card.innerHTML = `
        <img src="${posterUrl}" alt="${cleanTitle}" onerror="this.src='https://via.placeholder.com/500x750/333/fff?text=No+Image';">
        <div class="movie-info">
            <h3>${cleanTitle}</h3>
            <p>${releaseYear}</p>
            <div class="movie-buttons">
                <button onclick="event.stopPropagation(); playMovie(${movie.id})" title="Play movie">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="event.stopPropagation(); showMovieDetails(${movie.id})" title="View details">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button onclick="event.stopPropagation(); toggleFavorite(${movie.id}, '${cleanTitle}', '${cleanPosterPath}', '${cleanReleaseDate}', '${cleanOverview}', ${cleanVoteAverage})" 
                        title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        class="favorite-btn ${isFavorite ? 'active' : ''}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Show Movie Details
async function showMovieDetails(movieId) {
    try {
        // Show loading state
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Fetch movie details, videos, and watch providers
        const [movieResponse, providersResponse] = await Promise.all([
            fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=videos`),
            fetch(`${BASE_URL}/movie/${movieId}/watch/providers?api_key=${API_KEY}`)
        ]);
        
        const movie = await movieResponse.json();
        const providers = await providersResponse.json();
        
        const trailer = movie.videos.results.find(video => video.type === 'Trailer');
        const trailerKey = trailer ? trailer.key : null;

        // Get US streaming providers
        const usProviders = providers.results.US || {};
        const streamingServices = usProviders.flatrate || [];
        const rentServices = usProviders.rent || [];
        const buyServices = usProviders.buy || [];

        // Create streaming info HTML
        const streamingInfo = `
            <div class="streaming-info">
                ${streamingServices.length > 0 ? `
                    <div class="streaming-section">
                        <h3><i class="fas fa-play-circle"></i> Stream Now</h3>
                        <div class="provider-list">
                            ${streamingServices.map(provider => `
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
                            ${rentServices.map(provider => `
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
                            ${buyServices.map(provider => `
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

        // Handle missing data safely
        const posterUrl = movie.poster_path 
            ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
            : 'https://via.placeholder.com/500x750/333/fff?text=No+Image';
        
        const cleanTitle = (movie.title || 'Unknown Title').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const cleanOverview = (movie.overview || 'No description available').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const cleanPosterPath = movie.poster_path || '';
        const cleanReleaseDate = movie.release_date || '';
        const cleanVoteAverage = movie.vote_average || 0;

        modal.innerHTML = `
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-content">
                <div class="movie-details">
                    <div class="movie-header">
                        <img src="${posterUrl}" alt="${cleanTitle}" onerror="this.src='https://via.placeholder.com/500x750/333/fff?text=No+Image';">
                        <div class="movie-info">
                            <h2>${cleanTitle}</h2>
                            <p class="overview">${cleanOverview}</p>
                            <div class="movie-stats">
                                <span><i class="fas fa-star"></i> ${cleanVoteAverage.toFixed(1)}</span>
                                <span><i class="fas fa-calendar"></i> ${cleanReleaseDate || 'N/A'}</span>
                                <span><i class="fas fa-clock"></i> ${movie.runtime || 'N/A'} min</span>
                            </div>
                            <div class="hero-buttons">
                                <button class="btn-play" onclick="playMovie(${movie.id})">
                                    <i class="fas fa-play"></i> Watch Now
                                </button>
                                <button class="btn-more" onclick="toggleFavorite(${movie.id}, '${cleanTitle}', '${cleanPosterPath}', '${cleanReleaseDate}', '${cleanOverview}', ${cleanVoteAverage})">
                                    <i class="fas fa-heart"></i> <span id="favorite-text-${movie.id}">${favorites.some(fav => fav.id === movie.id) ? 'Remove from Favorites' : 'Add to Favorites'}</span>
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

        // Add event listener for the close button
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }
    } catch (error) {
        console.error('Error loading movie details:', error);
        modal.innerHTML = `
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-content">
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading movie details. Please try again later.</p>
                </div>
            </div>
        `;
    }
}

// Close Modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    // Remove the iframe to stop video playback
    const iframe = modal.querySelector('iframe');
    if (iframe) {
        iframe.src = '';
    }
}

// Play Movie
async function playMovie(movieId) {
    try {
        // Fetch movie details to get the trailer
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US&append_to_response=videos`);
        const movie = await response.json();
        
        // Find the trailer
        const trailer = movie.videos.results.find(video => video.type === 'Trailer');
        
        if (trailer) {
            // Open trailer in a new window
            window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
        } else {
            // If no trailer is available, show movie details instead
            showMovieDetails(movieId);
        }
    } catch (error) {
        console.error('Error playing movie:', error);
        // If there's an error, show movie details instead
        showMovieDetails(movieId);
    }
}

// Add to Watchlist (Legacy function - now uses favorites)
function addToWatchlist(movieId) {
    // This will be handled by the favorites system
    console.log('Adding to watchlist:', movieId);
}

// Toggle Favorite
function toggleFavorite(movieId, title, posterPath, releaseDate, overview, voteAverage) {
    console.log('toggleFavorite called with:', { movieId, title, posterPath, releaseDate, overview, voteAverage });
    
    const movieData = {
        id: movieId,
        title: title,
        poster_path: posterPath,
        release_date: releaseDate,
        overview: overview,
        vote_average: voteAverage
    };
    
    const existingIndex = favorites.findIndex(fav => fav.id === movieId);
    
    if (existingIndex > -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        console.log('Removed from favorites:', title);
    } else {
        // Add to favorites
        favorites.push(movieData);
        console.log('Added to favorites:', title);
    }
    
    // Save to localStorage with error handling
    try {
        localStorage.setItem('movieFavorites', JSON.stringify(favorites));
        console.log('Favorites saved to localStorage. Total favorites:', favorites.length);
    } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
    }
    
    // Update UI
    updateFavoriteButtons();
    
    // Update modal button text if modal is open
    const modalFavoriteText = document.getElementById(`favorite-text-${movieId}`);
    if (modalFavoriteText) {
        const isFavorite = favorites.some(fav => fav.id === movieId);
        modalFavoriteText.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }
    
    // If we're currently viewing the favorites page, refresh it
    if (document.querySelector('.content-row[data-category="favorites"]')) {
        displayFavorites();
    }
}

// Update favorite buttons across all movie cards
function updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    console.log('Updating favorite buttons. Found', favoriteButtons.length, 'buttons');
    
    favoriteButtons.forEach(button => {
        try {
            const onclickAttr = button.getAttribute('onclick');
            const movieIdMatch = onclickAttr.match(/toggleFavorite\((\d+)/);
            if (movieIdMatch) {
                const movieId = parseInt(movieIdMatch[1]);
                const isFavorite = favorites.some(fav => fav.id === movieId);
                
                button.classList.toggle('active', isFavorite);
                button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
            }
        } catch (error) {
            console.error('Error updating favorite button:', error);
        }
    });
}

// Display Favorites
function displayFavorites() {
    // Remove existing search results and other temporary sections
    const searchResults = document.querySelector('.content-row[data-category="search"]');
    if (searchResults) {
        searchResults.remove();
    }
    
    // Remove existing favorites section
    const existingFavorites = document.querySelector('.content-row[data-category="favorites"]');
    if (existingFavorites) {
        existingFavorites.remove();
    }
    
    // Create favorites section
    const favoritesSection = document.createElement('section');
    favoritesSection.className = 'content-row';
    favoritesSection.setAttribute('data-category', 'favorites');
    
    if (favorites.length === 0) {
        favoritesSection.innerHTML = `
            <h2>My Favorites</h2>
            <div class="empty-favorites">
                <i class="fas fa-heart"></i>
                <h3>No favorites yet</h3>
                <p>Add movies to your favorites to see them here!</p>
            </div>
        `;
    } else {
        favoritesSection.innerHTML = `
            <h2>My Favorites (${favorites.length})</h2>
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
    
    // Add to main content
    document.querySelector('main').prepend(favoritesSection);
    
    // Display favorite movies
    if (favorites.length > 0) {
        displayMovies(favorites, 'favorites');
    }
    
    // Update active navigation
    updateActiveNavigation('favorites');
    
    // Scroll to favorites section
    favoritesSection.scrollIntoView({ behavior: 'smooth' });
}

// Show all movies (reset to main page)
function showAllMovies() {
    // Remove favorites and search sections
    const favoritesSection = document.querySelector('.content-row[data-category="favorites"]');
    const searchSection = document.querySelector('.content-row[data-category="search"]');
    
    if (favoritesSection) {
        favoritesSection.remove();
    }
    if (searchSection) {
        searchSection.remove();
    }
    
    // Update active navigation
    updateActiveNavigation('home');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update active navigation state
function updateActiveNavigation(section) {
    document.querySelectorAll('.nav-right a').forEach(link => {
        link.classList.remove('active');
    });
    
    if (section === 'home') {
        document.querySelector('.nav-right a[onclick="showAllMovies()"]').classList.add('active');
    } else if (section === 'favorites') {
        document.querySelector('.nav-right a[onclick="displayFavorites()"]').classList.add('active');
    }
}

// Handle Search
async function handleSearch() {
    const query = searchInput.value.trim();
    console.log('Search query:', query);
    
    if (!query) {
        console.log('Empty search query');
        return;
    }
    
    try {
        console.log('Starting search...');
        // Show loading state
        const searchResults = document.createElement('section');
        searchResults.className = 'content-row';
        searchResults.setAttribute('data-category', 'search');
        searchResults.innerHTML = `
            <h2>Search Results for "${query}"</h2>
            <div class="movie-grid"></div>
        `;

        // Remove previous search results if any
        const previousSearch = document.querySelector('.content-row[data-category="search"]');
        if (previousSearch) {
            previousSearch.remove();
        }

        // Add new search results section
        document.querySelector('main').prepend(searchResults);

        // Fetch search results
        console.log('Fetching results from API...');
        const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`);
        const data = await response.json();
        console.log('Search results:', data);
        
        if (data.results.length === 0) {
            searchResults.innerHTML = `
                <h2>No results found for "${query}"</h2>
                <p>Try searching for something else</p>
            `;
            return;
        }

        displayMovies(data.results, 'search');
    } catch (error) {
        console.error('Error searching movies:', error);
        // Show error message to user
        const searchResults = document.querySelector('.content-row[data-category="search"]');
        if (searchResults) {
            searchResults.innerHTML = `
                <h2>Error searching movies</h2>
                <p>Please try again later</p>
            `;
        }
    }
}

// Check if near bottom of page
function isNearBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;
}

// Load more content
async function loadMoreContent() {
    isLoading = true;
    currentPage++;

    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${currentPage}`);
        const data = await response.json();
        
        if (data.results.length === 0) {
            hasMorePages = false;
            return;
        }

        displayMovies(data.results, 'Popular Movies');
    } catch (error) {
        console.error('Error loading more content:', error);
    } finally {
        isLoading = false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadHeroContent();
    loadMovieContent();
    handleResize();
    setupInfiniteScroll();
});

// Close modal when clicking the close button
document.querySelector('.modal-close').addEventListener('click', () => {
    const modal = document.getElementById('movieModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
document.getElementById('movieModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        e.currentTarget.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Scroll Category
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