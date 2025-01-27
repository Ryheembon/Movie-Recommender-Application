# Movie Recommender Application

The **Movie Recommender Application** is a Python-based GUI app that suggests random movies from various genres. It utilizes the TMDb API to fetch popular movies and display relevant details, including trailers, release dates, ratings, and overviews.

---

## Features

- **Genre Selection**: Choose from a list of popular movie genres like Action, Comedy, Drama, and more.
- **Random Movie Recommendations**: Fetches a random selection of movies from the chosen genre.
- **Detailed Movie Information**: Displays movie title, release date, rating, overview, and trailer links.
- **User-Friendly Interface**: Built with `Tkinter` for a clean and intuitive design.

---

## Prerequisites

### Required Libraries
Ensure you have the following Python libraries installed:
- `tkinter` (comes pre-installed with Python)
- `requests`

To install missing libraries, use:
```bash
pip install requests
```

### TMDb API Key
- You will need an API key from [The Movie Database (TMDb)](https://www.themoviedb.org/).
- Replace the placeholder `api_key` in the code with your own TMDb API key.

---

## How to Run the Application

1. Clone or download this repository.
2. Open the project folder in your terminal or code editor.
3. Run the following command:
   ```bash
   python movie_recommender.py
   ```
4. The application window will open. Select a genre and click **Get Random Movies** to get recommendations.

---

## Code Overview

### Main Components
- **Genres Dictionary**: Maps genre names to TMDb API genre IDs.
- **API Requests**: Fetches movie data and additional details (e.g., trailers) from the TMDb API.
- **UI Components**:
  - Dropdown menu for selecting genres.
  - Scrollable text area to display movie details.
  - Button to fetch random movie recommendations.

---

## Example Output
When you select a genre and request random movies, the application displays details like:

```
🎮 Avengers: Endgame
📅 Release Date: April 26, 2019
⭐ Rating: 8.4/10
🎥 Trailer: https://www.youtube.com/watch?v=TcMBFSGVi1c
🖍 Overview: After the devastating events of Avengers: Infinity War, the universe is in ruins...
```

---

## Notes
- The app fetches random results from up to 10 pages of TMDb's popular movies list for the selected genre.
- Error handling is included to display warnings or errors when API requests fail or when no genre is selected.

---

## Future Improvements
- Add support for multiple languages.
- Include additional filtering options, such as release year or minimum rating.
- Enhance the UI with more modern styling and responsiveness.

---

## License
This project is free to use and modify. Contributions are welcome!

