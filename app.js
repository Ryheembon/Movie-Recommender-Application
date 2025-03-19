// Constants
const API_KEY = config.API_KEY;
const BASE_URL = config.BASE_URL;
const IMAGE_BASE_URL = config.IMAGE_BASE_URL;

// DOM Elements
const navbar = document.querySelector('.navbar');
const heroSection = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');
const movieGrids = document.querySelectorAll('.movie-grid');
const modal = document.getElementById('movieModal');
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');

// State
let currentPage = 1;
let isLoading = false;
let hasMorePages = true;

// Setup Infinite Scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', handleScroll);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadHeroContent();
    loadMovieContent();
    handleResize();
    setupInfiniteScroll();

    // Search functionality
    searchButton.addEventListener('click', () => {
        console.log('Search button clicked');
        handleSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            handleSearch();
        }
    });

    // Modal close functionality
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
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
            
            // Set background image
            if (featuredMovie.backdrop_path) {
                heroSection.style.backgroundImage = `linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.8)), url(${IMAGE_BASE_URL}/original${featuredMovie.backdrop_path})`;
            }
            
            // Update hero content
            const heroContent = document.querySelector('.hero-content');
            heroContent.innerHTML = `
                <h1>${featuredMovie.title}</h1>
                <p>${featuredMovie.overview}</p>
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
        // Trending Movies
        const trendingResponse = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=en-US&page=1`);
        const trendingData = await trendingResponse.json();
        displayMovies(trendingData.results, 'trending');

        // Popular Movies
        const popularResponse = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
        const popularData = await popularResponse.json();
        displayMovies(popularData.results, 'popular');

        // New Releases
        const newResponse = await fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`);
        const newData = await newResponse.json();
        displayMovies(newData.results, 'new');

        // Recommended Movies (using top rated as a placeholder)
        const recommendedResponse = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`);
        const recommendedData = await recommendedResponse.json();
        displayMovies(recommendedData.results, 'recommended');

    } catch (error) {
        console.error('Error loading movie content:', error);
    }
}

// Display Movies
function displayMovies(movies, category) {
    const movieGrid = document.querySelector(`.content-row[data-category="${category}"] .movie-grid`);
    if (!movieGrid) {
        console.error(`Movie grid not found for category: ${category}`);
        return;
    }

    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        movieGrid.appendChild(movieCard);
    });

    // Add fade-in animation
    document.querySelector(`.content-row[data-category="${category}"]`).classList.add('visible');
}

// Create Movie Card
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <img src="${IMAGE_BASE_URL}/w500${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
            <p>${movie.release_date.split('-')[0]}</p>
            <div class="movie-buttons">
                <button onclick="playMovie(${movie.id})">
                    <i class="fas fa-play"></i>
                </button>
                <button onclick="showMovieDetails(${movie.id})">
                    <i class="fas fa-info-circle"></i>
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

        modal.innerHTML = `
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-content">
                <div class="movie-details">
                    <div class="movie-header">
                        <img src="${IMAGE_BASE_URL}/w500${movie.poster_path}" alt="${movie.title}">
                        <div class="movie-info">
                            <h2>${movie.title}</h2>
                            <p class="overview">${movie.overview}</p>
                            <div class="movie-stats">
                                <span><i class="fas fa-star"></i> ${movie.vote_average.toFixed(1)}</span>
                                <span><i class="fas fa-calendar"></i> ${movie.release_date}</span>
                                <span><i class="fas fa-clock"></i> ${movie.runtime} min</span>
                            </div>
                            <div class="hero-buttons">
                                <button class="btn-play" onclick="playMovie(${movie.id})">
                                    <i class="fas fa-play"></i> Watch Now
                                </button>
                                <button class="btn-more" onclick="addToWatchlist(${movie.id})">
                                    <i class="fas fa-plus"></i> Add to List
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

// Add to Watchlist
function addToWatchlist(movieId) {
    // Implement watchlist functionality
    console.log('Adding to watchlist:', movieId);
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