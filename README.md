# Bonavista - Movie Recommendation App

A Netflix-style movie browser built with HTML, CSS, and JavaScript using the TMDb API. Created by Ryheem Bonaparte.

## Features

- Browse trending, popular, new, and recommended movies
- Search movies by title
- View trailers, ratings, and streaming info
- Save movies to **My Favorites** (stored in your browser with localStorage)
- Responsive layout with Home + Favorites on mobile

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- TMDb API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Movies_recommendations.git
cd Movies_recommendations
```

2. Get a TMDb API key:
   - Go to [TMDb API Settings](https://www.themoviedb.org/settings/api)
   - Create an account and request an API key
   - Copy `config.example.js` to `config.js`
   - Paste your API key into `config.js`

```bash
cp config.example.js config.js
```

3. Open `index.html` in your browser, or use a local server:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`

## Project Structure

```
Movies_recommendations/
├── index.html           # Main page
├── styles.css           # Styles
├── app.js               # App logic (browse, search, favorites)
├── config.example.js    # Example API config (safe to commit)
├── config.js            # Your real API key (not committed)
├── movie_app.py         # Optional desktop Tkinter version
└── README.md
```

## Favorites

Favorites are saved in the browser with `localStorage` under the key `movieFavorites`. Click the heart on a movie card or use **My Favorites** in the nav to view them.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [TMDb](https://www.themoviedb.org/) for the movie data API
- [Font Awesome](https://fontawesome.com/) for icons
