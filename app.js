// TMDb API Configuration
const API_KEY = 'your-api-key-here';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// DOM Elements
const navbar = document.querySelector('.navbar');
const searchContainer = document.querySelector('.search-container');
const searchInput = document.getElementById('searchInput');
const movieModal = document.getElementById('movieModal');
const modalClose = document.querySelector('.close');
const modalBody = document.querySelector('.modal-body');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Search functionality
searchContainer.addEventListener('click', () => {
    searchContainer.classList.add('active');
    searchInput.focus();
});

document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
        searchContainer.classList.remove('active');
    }
});

// Fetch and display content for different rows
async function fetchContent(endpoint, containerId) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
        const data = await response.json();
        displayContent(data.results, containerId);
    } catch (error) {
        console.error('Error fetching content:', error);
    }
}

// Display content in a row
function displayContent(movies, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = movies.map(movie => `
        <div class="movie-card" data-id="${movie.id}">
            <img src="${IMAGE_BASE_URL}/w500${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p>${movie.release_date.split('-')[0]}</p>
            </div>
        </div>
    `).join('');

    // Add click event to movie cards
    container.querySelectorAll('.movie-card').forEach(card => {
        card.addEventListener('click', () => showMovieDetails(card.dataset.id));
    });
}

// Show movie details in modal
async function showMovieDetails(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        const movie = await response.json();
        
        modalBody.innerHTML = `
            <div class="movie-details">
                <div class="movie-header">
                    <img src="${IMAGE_BASE_URL}/w500${movie.poster_path}" alt="${movie.title}">
                    <div class="movie-info">
                        <h2>${movie.title}</h2>
                        <p class="release-date">${movie.release_date.split('-')[0]}</p>
                        <p class="overview">${movie.overview}</p>
                        <div class="movie-stats">
                            <span>Rating: ${movie.vote_average}/10</span>
                            <span>Runtime: ${movie.runtime} min</span>
                        </div>
                        <div class="movie-actions">
                            <button class="btn-primary"><i class="fas fa-play"></i> Play</button>
                            <button class="btn-secondary"><i class="fas fa-plus"></i> Add to List</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        movieModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching movie details:', error);
    }
}

// Close modal
modalClose.addEventListener('click', () => {
    movieModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === movieModal) {
        movieModal.style.display = 'none';
    }
});

// Initialize content
document.addEventListener('DOMContentLoaded', () => {
    // Fetch content for different rows
    fetchContent('/movie/now_playing', 'featuredContent');
    fetchContent('/movie/trending', 'trendingContent');
    fetchContent('/movie/popular', 'popularContent');
    fetchContent('/movie/upcoming', 'newReleases');
    
    // Fetch continue watching from localStorage
    const continueWatching = JSON.parse(localStorage.getItem('continueWatching') || '[]');
    if (continueWatching.length > 0) {
        displayContent(continueWatching, 'continueWatching');
    }
});

// Search functionality
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length > 2) {
        searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
                const data = await response.json();
                displayContent(data.results, 'searchResults');
            } catch (error) {
                console.error('Error searching movies:', error);
            }
        }, 500);
    }
}); 