// Constants
const API_KEY = 'af767ffb2843b0a2bbb887d1af1a162d';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// State management
let likedMovies = JSON.parse(localStorage.getItem('likedMovies')) || [];
let movieFeatures = {};
let isLoading = false;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const genreSelect = document.getElementById('genre');
const getRandomMoviesBtn = document.getElementById('getRandomMovies');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const getRecommendationsBtn = document.getElementById('getRecommendations');
const statusBar = document.getElementById('status');

// Tab switching functionality with animation
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab button with animation
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.style.transform = 'scale(1)';
        });
        button.classList.add('active');
        button.style.transform = 'scale(1.05)';
        
        // Update active tab content with animation
        tabContents.forEach(content => {
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px)';
            content.classList.remove('active');
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
                setTimeout(() => {
                    content.style.opacity = '1';
                    content.style.transform = 'translateY(0)';
                }, 50);
            }
        });
        
        // Update liked movies display when switching to recommendations tab
        if (tabName === 'recommendations') {
            updateLikedMoviesDisplay();
        }
    });
});

// Random Movies functionality with loading state
getRandomMoviesBtn.addEventListener('click', async () => {
    const genreId = genreSelect.value;
    if (!genreId) {
        showStatus('Please select a genre first!', 'error');
        return;
    }

    try {
        setLoading(true);
        showStatus('Loading random movies...');
        const movies = await getRandomMovies(genreId);
        displayMovies(movies, 'randomMoviesDisplay');
        showStatus(`Found ${movies.length} random movies`);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
});

// Search functionality with debounce
let searchTimeout;
searchButton.addEventListener('click', () => searchMovies());
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (e.target.value.trim()) {
            searchMovies();
        }
    }, 500);
});

async function searchMovies() {
    const query = searchInput.value.trim();
    if (!query) {
        showStatus('Please enter a movie title!', 'error');
        return;
    }

    try {
        setLoading(true);
        showStatus('Searching for movies...');
        const movies = await searchMoviesAPI(query);
        displayMovies(movies, 'searchResults');
        showStatus(`Found ${movies.length} results for "${query}"`);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// Recommendations functionality with loading state
getRecommendationsBtn.addEventListener('click', async () => {
    if (likedMovies.length === 0) {
        showStatus('Please like at least one movie to get recommendations!', 'error');
        return;
    }

    try {
        setLoading(true);
        showStatus('Getting recommendations...');
        const recommendations = await getRecommendations();
        displayMovies(recommendations, 'recommendationsDisplay');
        showStatus(`Found ${recommendations.length} recommendations`);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
});

// API Functions
async function getRandomMovies(genreId) {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${randomPage}&sort_by=popularity.desc&vote_count.gte=100`);
    
    if (!response.ok) throw new Error('Failed to fetch random movies');
    
    const data = await response.json();
    return data.results.slice(0, 3);
}

async function searchMoviesAPI(query) {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    
    if (!response.ok) throw new Error('Failed to search movies');
    
    const data = await response.json();
    return data.results.slice(0, 5);
}

async function getMovieDetails(movieId) {
    const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,keywords,videos`);
    
    if (!response.ok) throw new Error('Failed to fetch movie details');
    
    return await response.json();
}

async function getRecommendations() {
    // Get genres from liked movies
    const likedGenres = new Set();
    likedMovies.forEach(movie => {
        movie.genres.forEach(genre => likedGenres.add(genre));
    });

    // Get movies from liked genres
    const genrePromises = Array.from(likedGenres).slice(0, 3).map(genreId =>
        fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&vote_count.gte=200`)
            .then(res => res.json())
    );

    const genreResults = await Promise.all(genrePromises);
    let candidateMovies = genreResults.flatMap(result => result.results);

    // Filter out already liked movies
    const likedIds = new Set(likedMovies.map(m => m.id));
    candidateMovies = candidateMovies.filter(movie => !likedIds.has(movie.id));

    // Score movies based on genre match
    candidateMovies.forEach(movie => {
        const movieGenres = new Set(movie.genre_ids);
        const matchScore = Array.from(likedGenres).filter(genre => movieGenres.has(genre)).length;
        movie.matchScore = matchScore;
    });

    // Sort by match score and popularity
    candidateMovies.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }
        return b.popularity - a.popularity;
    });

    // Return top 5 unique movies
    return candidateMovies.slice(0, 5);
}

// UI Functions with animations
function displayMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    movies.forEach((movie, index) => {
        const card = createMovieCard(movie, containerId === 'searchResults' || containerId === 'randomMoviesDisplay');
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);
        
        // Animate each card with a delay
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function createMovieCard(movie, showLikeButton = false) {
    const card = document.createElement('div');
    card.className = 'movie-card';

    const releaseDate = movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'Unknown';
    const posterPath = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';

    card.innerHTML = `
        <img src="${posterPath}" alt="${movie.title}" style="width: 100%; height: auto; border-radius: 15px; margin-bottom: 15px;">
        <h3>${movie.title}</h3>
        <p class="rating">⭐ ${movie.vote_average}/10</p>
        <p>📅 ${releaseDate}</p>
        <p>${movie.overview || 'No overview available.'}</p>
        <div class="actions">
            ${showLikeButton ? `<button class="like-btn" onclick="likeMovie(${movie.id})">❤️ Like</button>` : ''}
            <button class="trailer-btn" onclick="watchTrailer(${movie.id})">🎥 Trailer</button>
        </div>
    `;

    return card;
}

function updateLikedMoviesDisplay() {
    const container = document.getElementById('likedMoviesDisplay');
    container.innerHTML = '';

    if (likedMovies.length === 0) {
        container.innerHTML = '<p>You haven\'t liked any movies yet. Search for movies to like them.</p>';
        return;
    }

    likedMovies.forEach((movie, index) => {
        const card = createMovieCard(movie);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        container.appendChild(card);
        
        // Animate each card with a delay
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Movie interaction functions with animations
async function likeMovie(movieId) {
    try {
        const movieDetails = await getMovieDetails(movieId);
        
        // Check if already liked
        if (likedMovies.some(m => m.id === movieId)) {
            showStatus('You\'ve already liked this movie!', 'info');
            return;
        }

        const movieToAdd = {
            id: movieId,
            title: movieDetails.title,
            genres: movieDetails.genres.map(g => g.id),
            vote_average: movieDetails.vote_average,
            overview: movieDetails.overview,
            release_date: movieDetails.release_date,
            poster_path: movieDetails.poster_path
        };

        likedMovies.push(movieToAdd);
        localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
        updateLikedMoviesDisplay();
        
        // Animate the like button
        const likeBtn = document.querySelector(`.like-btn[onclick="likeMovie(${movieId})"]`);
        if (likeBtn) {
            likeBtn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                likeBtn.style.transform = 'scale(1)';
            }, 200);
        }
        
        showStatus(`Added "${movieDetails.title}" to your liked movies!`);
    } catch (error) {
        showStatus(`Error liking movie: ${error.message}`, 'error');
    }
}

async function watchTrailer(movieId) {
    try {
        const movieDetails = await getMovieDetails(movieId);
        const trailers = movieDetails.videos.results.filter(video => 
            video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
        );

        if (trailers.length > 0) {
            const trailer = trailers[0];
            window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
        } else {
            showStatus('No trailer available for this movie.', 'info');
        }
    } catch (error) {
        showStatus(`Error loading trailer: ${error.message}`, 'error');
    }
}

// Utility functions
function showStatus(message, type = 'info') {
    statusBar.textContent = message;
    statusBar.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2c3e50';
    statusBar.classList.add('show');
    
    // Hide status after 3 seconds
    setTimeout(() => {
        statusBar.classList.remove('show');
    }, 3000);
}

function setLoading(isLoading) {
    const buttons = [getRandomMoviesBtn, searchButton, getRecommendationsBtn];
    buttons.forEach(button => {
        if (button) {
            button.disabled = isLoading;
            if (isLoading) {
                const originalText = button.textContent;
                button.innerHTML = `<span class="loading"></span> Loading...`;
                button.dataset.originalText = originalText;
            } else {
                button.textContent = button.dataset.originalText || button.textContent;
            }
        }
    });
}

// Initialize with animation
document.addEventListener('DOMContentLoaded', () => {
    showStatus('Ready to recommend movies!');
    
    // Add initial animations
    document.querySelector('h1').style.opacity = '1';
    document.querySelector('h1').style.transform = 'translateY(0)';
    
    // Add hover effect to genre select
    genreSelect.addEventListener('mouseenter', () => {
        genreSelect.style.transform = 'scale(1.02)';
    });
    
    genreSelect.addEventListener('mouseleave', () => {
        genreSelect.style.transform = 'scale(1)';
    });
}); 