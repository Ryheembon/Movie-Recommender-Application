import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import requests
import random
from datetime import datetime
import json
import os
import webbrowser  # Add this for opening trailer links

class MovieRecommenderApp:
    def __init__(self, master):
        self.master = master  
        master.title("Movie Recommender")
        master.geometry("600x800")
        
        # Initialize TMDb API
        self.api_key = "af767ffb2843b0a2bbb887d1af1a162d"  # Replace with your API key
        self.base_url = "https://api.themoviedb.org/3"
        
        # Status indicator
        self.status_var = tk.StringVar()
        self.status_var.set("Ready")
        
        # Genres dictionary
        self.genres = {
            "Action": 28,
            "Adventure": 12,
            "Animation": 16,
            "Comedy": 35,
            "Crime": 80,
            "Drama": 18,
            "Fantasy": 14,
            "Horror": 27,
            "Romance": 10749,
            "Sci-Fi": 878
        }
        
        # User preferences
        self.user_data_file = "user_preferences.json"
        self.liked_movies = self.load_user_data()
        self.movie_features = {}
        
        self.setup_ui()
        
        # Test API connection
        self.test_api_connection()
        
    def test_api_connection(self):
        """Test the API connection and show a message if it fails"""
        try:
            self.status_var.set("Testing API connection...")
            self.master.update()
            
            # Simple API request to test connection
            test_url = f"{self.base_url}/genre/movie/list"
            params = {"api_key": self.api_key, "language": "en-US"}
            
            response = requests.get(test_url, params=params, timeout=5)
            
            if response.status_code == 200:
                self.status_var.set("API connection successful")
            else:
                self.status_var.set(f"API connection issue: Status {response.status_code}")
                messagebox.showwarning("API Connection", 
                                      f"There might be an issue with the API connection (Status: {response.status_code}).\n"
                                      "Some features may not work correctly.")
        except Exception as e:
            self.status_var.set(f"API connection error: {str(e)}")
            messagebox.showwarning("API Connection Error", 
                                  f"Failed to connect to the movie database API.\n"
                                  f"Error: {str(e)}\n"
                                  "Some features may not work correctly.")
        
    def load_user_data(self):
        if os.path.exists(self.user_data_file):
            try:
                with open(self.user_data_file, 'r') as f:
                    return json.load(f)
            except:
                return []
        else:
            return []
            
    def save_user_data(self):
        try:
            with open(self.user_data_file, 'w') as f:
                json.dump(self.liked_movies, f)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save user data: {str(e)}")
            
    def setup_ui(self):
        # Main container
        main_container = tk.Frame(self.master)
        main_container.pack(fill="both", expand=True)
        
        # Title
        title_label = tk.Label(
            main_container,
            text="Movie Recommender",
            font=("Arial", 24, "bold"),
            pady=20
        )
        title_label.pack()
        
        # Tab control
        self.tab_control = ttk.Notebook(main_container)
        
        # Random tab
        random_tab = ttk.Frame(self.tab_control)
        self.tab_control.add(random_tab, text="Random Movies")
        
        # Recommendations tab
        recommend_tab = ttk.Frame(self.tab_control)
        self.tab_control.add(recommend_tab, text="Movie Recommendations")
        
        self.tab_control.pack(expand=1, fill="both")
        
        # === Random Movies Tab ===
        # Genre Selection
        genre_frame = tk.Frame(random_tab)
        genre_frame.pack(pady=10)
        
        tk.Label(
            genre_frame,
            text="Select Genre:",
            font=("Arial", 12)
        ).pack()
        
        self.genre_var = tk.StringVar()
        genre_dropdown = ttk.Combobox(
            genre_frame,
            textvariable=self.genre_var,
            values=list(self.genres.keys()),
            state="readonly",
            width=30
        )
        genre_dropdown.pack(pady=5)
        
        # Random Movies Button
        random_button = tk.Button(
            random_tab,
            text="Get Random Movies",
            command=self.get_random_movies,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 12, "bold"),
            pady=10
        )
        random_button.pack(pady=10)
        
        # Movie Display Area for Random Tab
        self.random_movie_display = scrolledtext.ScrolledText(
            random_tab,
            wrap=tk.WORD,
            width=60,
            height=30,
            font=("Arial", 11)
        )
        self.random_movie_display.pack(padx=20, pady=10, fill="both", expand=True)
        
        # === Recommendations Tab ===
        recommend_frame = tk.Frame(recommend_tab)
        recommend_frame.pack(pady=10, fill="both", expand=True)
        
        # Liked movies section
        liked_section = tk.LabelFrame(recommend_frame, text="Movies You've Liked", font=("Arial", 12, "bold"))
        liked_section.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Liked movies display
        self.liked_movies_display = scrolledtext.ScrolledText(
            liked_section,
            wrap=tk.WORD,
            width=58,
            height=8,
            font=("Arial", 11)
        )
        self.liked_movies_display.pack(padx=10, pady=5, fill="both", expand=True)
        
        # Search section
        search_section = tk.LabelFrame(recommend_frame, text="Search for Movies to Like", font=("Arial", 12, "bold"))
        search_section.pack(fill="both", expand=False, padx=10, pady=5)
        
        # Search for movies to like
        search_frame = tk.Frame(search_section)
        search_frame.pack(pady=10, fill="x")
        
        self.search_var = tk.StringVar()
        search_entry = tk.Entry(
            search_frame,
            textvariable=self.search_var,
            width=40
        )
        search_entry.pack(side=tk.LEFT, padx=5, fill="x", expand=True)
        
        search_button = tk.Button(
            search_frame,
            text="Search",
            command=self.search_movies,
            bg="#2196F3",
            fg="white",
            font=("Arial", 10, "bold")
        )
        search_button.pack(side=tk.LEFT, padx=5)
        
        # Bind Enter key to search
        search_entry.bind("<Return>", lambda event: self.search_movies())
        
        # Recommendations section
        recommendations_section = tk.LabelFrame(recommend_frame, text="Your Recommendations", font=("Arial", 12, "bold"))
        recommendations_section.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Recommendation Button
        recommend_button = tk.Button(
            recommendations_section,
            text="Get Recommendations",
            command=self.get_recommendations,
            bg="#FF5722",
            fg="white",
            font=("Arial", 12, "bold"),
            pady=5
        )
        recommend_button.pack(pady=5)
        
        # Recommendation Display Area
        self.recommend_display = scrolledtext.ScrolledText(
            recommendations_section,
            wrap=tk.WORD,
            width=58,
            height=12,
            font=("Arial", 11)
        )
        self.recommend_display.pack(padx=10, pady=5, fill="both", expand=True)
        
        # Status bar at the bottom
        status_bar = tk.Frame(main_container, bd=1, relief=tk.SUNKEN)
        status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        status_label = tk.Label(
            status_bar, 
            textvariable=self.status_var,
            anchor=tk.W,
            padx=5,
            pady=2
        )
        status_label.pack(side=tk.LEFT, fill=tk.X)
        
        # Update displays
        self.update_liked_movies_display()
        
        # Set the movie_display to be the random tab's display by default
        self.movie_display = self.random_movie_display
        
        # Tab change event
        self.tab_control.bind("<<NotebookTabChanged>>", self.on_tab_change)
        
        # Info label
        info_label = tk.Label(
            main_container,
            text="Use the tabs above to switch between Random Movies and Recommendations",
            font=("Arial", 10, "italic"),
            fg="blue"
        )
        info_label.pack(before=self.tab_control, pady=2)
            
    def on_tab_change(self, event):
        """Update tab content when switching tabs"""
        current_tab = self.tab_control.index(self.tab_control.select())
        if current_tab == 1:  # Recommendations tab
            self.update_liked_movies_display()
    
    def search_movies(self):
        query = self.search_var.get().strip()
        if not query:
            messagebox.showwarning("Warning", "Please enter a movie title!")
            return
        
        try:
            self.status_var.set(f"Searching for: {query}...")
            self.master.update()
            
            params = {
                "api_key": self.api_key,
                "query": query,
                "language": "en-US"
            }
            
            response = requests.get(f"{self.base_url}/search/movie", params=params, timeout=10)
            
            if response.status_code == 200:
                movies = response.json()["results"]
                if movies:
                    self.status_var.set(f"Found {len(movies)} results for: {query}")
                    self.display_search_results(movies[:5])
                else:
                    self.status_var.set(f"No movies found for: {query}")
                    messagebox.showinfo("Info", "No movies found matching your search.")
            else:
                self.status_var.set(f"API error: {response.status_code}")
                raise Exception(f"API request failed: {response.status_code}")
                
        except Exception as e:
            self.status_var.set(f"Search error: {str(e)}")
            messagebox.showerror("Error", f"An error occurred while searching: {str(e)}")
    
    def display_search_results(self, movies):
        search_result_window = tk.Toplevel(self.master)
        search_result_window.title("Search Results")
        search_result_window.geometry("500x600")
        search_result_window.transient(self.master)  # Make it modal
        search_result_window.grab_set()  # Make it modal
        
        tk.Label(
            search_result_window,
            text="Search Results",
            font=("Arial", 16, "bold")
        ).pack(pady=10)
        
        # Scrollable frame
        canvas = tk.Canvas(search_result_window)
        scrollbar = ttk.Scrollbar(search_result_window, orient="vertical", command=canvas.yview)
        results_frame = tk.Frame(canvas)
        
        # Configure canvas
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True, padx=10, pady=10)
        scrollbar.pack(side="right", fill="y")
        
        # Create window in canvas
        canvas_frame = canvas.create_window((0, 0), window=results_frame, anchor="nw")
        
        # Update scrollregion when frame size changes
        def configure_scroll_region(event):
            canvas.configure(scrollregion=canvas.bbox("all"))
        
        results_frame.bind("<Configure>", configure_scroll_region)
        
        # Make canvas resize with window
        def resize_canvas(event):
            canvas.itemconfig(canvas_frame, width=event.width)
        
        canvas.bind("<Configure>", resize_canvas)
        
        # Display movie results
        for movie in movies:
            movie_frame = tk.Frame(results_frame, bd=1, relief=tk.SOLID)
            movie_frame.pack(fill="x", padx=5, pady=5)
            
            # Movie title and release year
            release_year = movie.get("release_date", "")[:4] if movie.get("release_date") else "Unknown"
            title_label = tk.Label(
                movie_frame,
                text=f"{movie['title']} ({release_year})",
                font=("Arial", 12, "bold"),
                anchor="w",
                justify=tk.LEFT
            )
            title_label.pack(fill="x", padx=5, pady=5)
            
            # Movie overview (truncated)
            overview = movie.get("overview", "No overview available.")
            if len(overview) > 150:
                overview = overview[:150] + "..."
                
            overview_label = tk.Label(
                movie_frame,
                text=overview,
                wraplength=450,
                justify=tk.LEFT,
                anchor="w"
            )
            overview_label.pack(fill="x", padx=5, pady=5)
            
            # Like button
            button_frame = tk.Frame(movie_frame)
            button_frame.pack(fill="x", padx=5, pady=5)
            
            like_button = tk.Button(
                button_frame,
                text="Like This Movie",
                command=lambda m=movie: [self.like_movie(m), search_result_window.destroy()],
                bg="#4CAF50",
                fg="white"
            )
            like_button.pack(side=tk.RIGHT)
    
    def like_movie(self, movie):
        # Check if movie is already liked
        movie_id = movie["id"]
        existing_ids = [m["id"] for m in self.liked_movies]
        
        if movie_id in existing_ids:
            messagebox.showinfo("Info", f"You've already liked '{movie['title']}'!")
            return
            
        # Fetch detailed movie info to get more features
        try:
            self.status_var.set(f"Getting details for {movie['title']}...")
            self.master.update()
            
            params = {"api_key": self.api_key, "append_to_response": "credits,keywords"}
            response = requests.get(f"{self.base_url}/movie/{movie_id}", params=params, timeout=10)
            
            if response.status_code == 200:
                movie_details = response.json()
                
                # Extract necessary details
                movie_to_add = {
                    "id": movie_id,
                    "title": movie["title"],
                    "genres": [genre["name"] for genre in movie_details.get("genres", [])],
                    "vote_average": movie_details.get("vote_average", 0),
                    "overview": movie_details.get("overview", ""),
                    "release_date": movie_details.get("release_date", ""),
                    "keywords": [keyword["name"] for keyword in movie_details.get("keywords", {}).get("keywords", [])],
                    "directors": [crew["name"] for crew in movie_details.get("credits", {}).get("crew", []) 
                                 if crew["job"] == "Director"],
                    "cast": [cast["name"] for cast in movie_details.get("credits", {}).get("cast", [])[:5]]
                }
                
                # Create feature text for content-based filtering
                feature_text = " ".join(
                    movie_to_add["genres"] + 
                    movie_to_add["keywords"] + 
                    movie_to_add["directors"] + 
                    movie_to_add["cast"] +
                    [movie_to_add["overview"]]
                ).lower()
                
                self.movie_features[movie_id] = feature_text
                
                # Add to liked movies
                self.liked_movies.append(movie_to_add)
                self.save_user_data()
                self.update_liked_movies_display()
                
                self.status_var.set(f"Added {movie['title']} to liked movies")
                messagebox.showinfo("Success", f"Added '{movie['title']}' to your liked movies!")
                
                # Switch to recommendations tab
                self.tab_control.select(1)
            else:
                self.status_var.set(f"API error: {response.status_code}")
                raise Exception(f"API request failed: {response.status_code}")
                
        except Exception as e:
            self.status_var.set(f"Error liking movie: {str(e)}")
            messagebox.showerror("Error", f"An error occurred while liking the movie: {str(e)}")
    
    def update_liked_movies_display(self):
        self.liked_movies_display.delete(1.0, tk.END)
        
        if not self.liked_movies:
            self.liked_movies_display.insert(tk.END, "You haven't liked any movies yet. Search for movies to like them.")
            return
            
        for movie in self.liked_movies:
            title = movie["title"]
            genres = ", ".join(movie["genres"]) if movie["genres"] else "N/A"
            release_year = movie.get("release_date", "")[:4] if movie.get("release_date") else "N/A"
            
            self.liked_movies_display.insert(tk.END, f"• {title} ({release_year}) - {genres}\n")
    
    def get_recommendations(self):
        if len(self.liked_movies) < 1:
            messagebox.showwarning("Warning", "Please like at least one movie to get recommendations!")
            return
            
        self.recommend_display.delete(1.0, tk.END)
        self.recommend_display.insert(tk.END, "Finding recommendations based on your taste...\n")
        self.status_var.set("Getting recommendations...")
        self.master.update()
        
        try:
            # Simple recommendations based on genres
            recommendations = self.simple_recommendations()
            self.display_recommendations(recommendations)
            self.status_var.set(f"Found {len(recommendations)} recommendations")
        except Exception as e:
            self.status_var.set(f"Recommendation error: {str(e)}")
            messagebox.showerror("Error", f"An error occurred while getting recommendations: {str(e)}")
    
    def simple_recommendations(self):
        # Get movie IDs that user has already liked
        liked_ids = [movie["id"] for movie in self.liked_movies]
        
        # Collect genres user has liked
        liked_genres = set()
        for movie in self.liked_movies:
            for genre in movie["genres"]:
                liked_genres.add(genre)
                
        # Debug information
        print(f"Liked genres: {liked_genres}")
        
        # Get genre IDs for API calls
        api_genre_ids = []
        for genre in liked_genres:
            # Find the genre ID by name
            for name, gid in self.genres.items():
                if name.lower() == genre.lower():
                    api_genre_ids.append(gid)
                    break
        
        # Debug information            
        print(f"API genre IDs: {api_genre_ids}")
        
        # If no matching genres, use general popular movies
        if not api_genre_ids:
            print("No matching genres, using popular movies")
            params = {
                "api_key": self.api_key,
                "sort_by": "popularity.desc",
                "vote_count.gte": 200,
                "page": 1,
                "language": "en-US"
            }
            
            response = requests.get(f"{self.base_url}/discover/movie", params=params, timeout=10)
            if response.status_code != 200:
                print(f"API error: {response.status_code}")
                return []
                
            candidate_movies = response.json().get("results", [])
        else:
            # Get movies from user's preferred genres
            candidate_movies = []
            for genre_id in api_genre_ids[:3]:  # Limit to 3 genres to avoid too many API calls
                print(f"Getting movies for genre ID: {genre_id}")
                params = {
                    "api_key": self.api_key,
                    "with_genres": genre_id,
                    "sort_by": "popularity.desc",
                    "vote_count.gte": 200,
                    "page": 1,
                    "language": "en-US"
                }
                
                response = requests.get(f"{self.base_url}/discover/movie", params=params, timeout=10)
                if response.status_code == 200:
                    results = response.json().get("results", [])
                    print(f"Found {len(results)} movies for genre ID {genre_id}")
                    candidate_movies.extend(results)
                else:
                    print(f"API error for genre {genre_id}: {response.status_code}")
        
        print(f"Total candidate movies before filtering: {len(candidate_movies)}")
        
        # Filter out movies user has already liked
        candidate_movies = [movie for movie in candidate_movies if movie["id"] not in liked_ids]
        print(f"Candidates after filtering liked movies: {len(candidate_movies)}")
        
        # Handle empty case
        if not candidate_movies:
            print("No candidate movies found")
            return []
            
        # Score movies based on genre match
        for movie in candidate_movies:
            movie_genre_ids = movie.get("genre_ids", [])
            # Count how many genres match with liked genres
            genre_matches = sum(1 for g_id in movie_genre_ids if g_id in api_genre_ids)
            movie["match_score"] = genre_matches
        
        # Sort by match score and then by popularity
        candidate_movies.sort(key=lambda x: (x.get("match_score", 0), x.get("popularity", 0)), reverse=True)
        
        # Return top 5 unique movies
        seen_ids = set()
        unique_candidates = []
        
        for movie in candidate_movies:
            if movie["id"] not in seen_ids:
                seen_ids.add(movie["id"])
                unique_candidates.append(movie)
                if len(unique_candidates) >= 5:
                    break
                    
        print(f"Final recommendation count: {len(unique_candidates)}")
        return unique_candidates
    
    def display_recommendations(self, movies):
        self.recommend_display.delete(1.0, tk.END)
        
        if not movies:
            self.recommend_display.insert(tk.END, "Couldn't find any recommendations. Try liking more movies with different genres!")
            return
            
        self.recommend_display.insert(tk.END, "Recommended for you:\n\n")
        
        for movie in movies:
            # Format release date
            release_date = "Unknown"
            if movie.get("release_date"):
                try:
                    release_date = datetime.strptime(movie["release_date"], "%Y-%m-%d").strftime("%B %d, %Y")
                except ValueError:
                    release_date = movie.get("release_date", "Unknown")
                
            # Get genres
            genre_ids = movie.get("genre_ids", [])
            genres = []
            for genre_id in genre_ids:
                for name, gid in self.genres.items():
                    if gid == genre_id:
                        genres.append(name)
            genre_str = ", ".join(genres) if genres else "Unknown"
            
            # Show match info if available
            match_score = movie.get("match_score", None)
            score_text = f"Match: {match_score} genre(s)" if match_score is not None and match_score > 0 else ""
            
            self.recommend_display.insert(tk.END, f"🎬 {movie['title']} {score_text}\n")
            self.recommend_display.insert(tk.END, f"📅 Release Date: {release_date}\n")
            self.recommend_display.insert(tk.END, f"🎭 Genres: {genre_str}\n")
            self.recommend_display.insert(tk.END, f"⭐ Rating: {movie['vote_average']}/10\n")
            self.recommend_display.insert(tk.END, f"📝 Overview: {movie.get('overview', 'No overview available.')}\n")
            
            # Add clickable trailer link if available
            movie_id = movie["id"]
            try:
                trailer_info = self.get_trailer_link(movie_id)
                if trailer_info:
                    trailer_text = f"🎥 Trailer: {trailer_info['url']}"
                    start_idx = self.recommend_display.index(tk.END) + "-1c"
                    self.recommend_display.insert(tk.END, f"{trailer_text}\n")
                    end_idx = self.recommend_display.index(tk.END) + "-1c"
                    
                    self.recommend_display.tag_add(f"link_{movie_id}", start_idx, end_idx)
                    self.recommend_display.tag_config(f"link_{movie_id}", foreground="blue", underline=1)
                    self.recommend_display.tag_bind(f"link_{movie_id}", "<Button-1>", 
                                                   lambda e, url=trailer_info['url']: webbrowser.open_new(url))
            except:
                pass
                
            self.recommend_display.insert(tk.END, "\n" + "="*50 + "\n\n")
            
    def get_trailer_link(self, movie_id):
        """Get trailer link for a movie"""
        try:
            params = {"api_key": self.api_key, "append_to_response": "videos"}
            response = requests.get(f"{self.base_url}/movie/{movie_id}", params=params, timeout=5)
            
            if response.status_code == 200:
                details = response.json()
                
                if "videos" in details and details["videos"].get("results"):
                    trailers = [v for v in details["videos"]["results"] 
                              if v.get("site") == "YouTube" and v.get("type") in ["Trailer", "Teaser"]]
                    if trailers:
                        trailer = random.choice(trailers)
                        return {
                            "url": f"https://www.youtube.com/watch?v={trailer.get('key')}",
                            "name": trailer.get("name", "Trailer")
                        }
            return None
        except:
            return None
            
    def get_random_movies(self):
        if not self.genre_var.get():
            messagebox.showwarning("Warning", "Please select a genre!")
            return
            
        try:
            self.random_movie_display.delete(1.0, tk.END)
            self.random_movie_display.insert(tk.END, "Loading movies...\n")
            self.status_var.set(f"Getting random {self.genre_var.get()} movies...")
            self.master.update()
            
            genre_id = self.genres[self.genre_var.get()]
            random_page = random.randint(1, 5)  # Reduced to 5 to avoid potential 404 errors
            
            params = {
                "api_key": self.api_key,
                "with_genres": genre_id,
                "sort_by": "popularity.desc",
                "vote_count.gte": 100,
                "page": random_page,
                "language": "en-US"
            }
            
            response = requests.get(f"{self.base_url}/discover/movie", params=params, timeout=10)
            
            if response.status_code == 200:
                movies = response.json().get("results", [])
                if movies:
                    selected_movies = random.sample(movies, min(3, len(movies)))
                    self.display_movies(selected_movies, display=self.random_movie_display)
                    self.status_var.set(f"Found {len(selected_movies)} random {self.genre_var.get()} movies")
                else:
                    self.random_movie_display.delete(1.0, tk.END)
                    self.random_movie_display.insert(tk.END, "No movies found!")
                    self.status_var.set(f"No {self.genre_var.get()} movies found")
            else:
                self.status_var.set(f"API error: {response.status_code}")
                raise Exception(f"API request failed: {response.status_code}")
                
        except Exception as e:
            self.status_var.set(f"Error getting random movies: {str(e)}")
            messagebox.showerror("Error", f"An error occurred: {str(e)}")
            
    def display_movies(self, movies, display=None):
        if display is None:
            display = self.movie_display
            
        display.delete(1.0, tk.END)
        
        for movie in movies:
            # Get additional movie details including trailers
            movie_id = movie["id"]
            try:
                details_response = requests.get(
                    f"{self.base_url}/movie/{movie_id}",
                    params={"api_key": self.api_key, "append_to_response": "videos"},
                    timeout=10
                )
                
                if details_response.status_code == 200:
                    details = details_response.json()
                    
                    # Format release date
                    release_date = "Unknown"
                    if movie.get("release_date"):
                        try:
                            release_date = datetime.strptime(movie["release_date"], "%Y-%m-%d").strftime("%B %d, %Y")
                        except ValueError:
                            release_date = movie.get("release_date", "Unknown")
                    
                    # Get trailer
                    trailer = None
                    if "videos" in details and details["videos"].get("results"):
                        trailers = [v for v in details["videos"]["results"] 
                                  if v.get("site") == "YouTube" and v.get("type") in ["Trailer", "Teaser"]]
                        if trailers:
                            trailer = random.choice(trailers)
                    
                    # Display movie information
                    display.insert(tk.END, f"🎬 {movie['title']}\n")
                    display.insert(tk.END, f"📅 Release Date: {release_date}\n")
                    display.insert(tk.END, f"⭐ Rating: {movie.get('vote_average', 'N/A')}/10\n")
                    
                    # Add like button text for random movies
                    if display == self.random_movie_display:
                        display.insert(tk.END, "💖 ")
                        like_pos_start = display.index(tk.END) + "-1c"
                        display.insert(tk.END, "Like this movie")
                        like_pos_end = display.index(tk.END)
                        
                        # Make it clickable
                        tag_name = f"like_{movie_id}"
                        display.tag_add(tag_name, like_pos_start, like_pos_end)
                        display.tag_config(tag_name, foreground="red", underline=1)
                        display.tag_bind(tag_name, "<Button-1>", lambda e, m=movie: self.like_movie(m))
                        display.insert(tk.END, "\n")
                    
                    # Add clickable trailer link
                    if trailer:
                        display.insert(tk.END, "🎥 ")
                        trailer_pos_start = display.index(tk.END) + "-1c"
                        trailer_url = f"https://www.youtube.com/watch?v={trailer.get('key')}"
                        display.insert(tk.END, f"Watch Trailer")
                        trailer_pos_end = display.index(tk.END)
                        
                        # Make it clickable
                        tag_name = f"trailer_{movie_id}"
                        display.tag_add(tag_name, trailer_pos_start, trailer_pos_end)
                        display.tag_config(tag_name, foreground="blue", underline=1)
                        display.tag_bind(tag_name, "<Button-1>", lambda e, url=trailer_url: webbrowser.open_new(url))
                        display.insert(tk.END, "\n")
                        
                    display.insert(tk.END, f"📝 Overview: {movie.get('overview', 'No overview available.')}\n")
                    display.insert(tk.END, "\n" + "="*50 + "\n\n")
                else:
                    display.insert(tk.END, f"🎬 {movie['title']}\n")
                    display.insert(tk.END, "Could not load detailed information.\n")
                    display.insert(tk.END, "\n" + "="*50 + "\n\n")
            except Exception as e:
                # Fallback to basic info if details fetch fails
                display.insert(tk.END, f"🎬 {movie['title']}\n")
                display.insert(tk.END, f"⭐ Rating: {movie.get('vote_average', 'N/A')}/10\n")
                display.insert(tk.END, f"📝 Overview: {movie.get('overview', 'No overview available.')}\n")
                display.insert(tk.END, f"(Error loading full details: {str(e)})\n")
                display.insert(tk.END, "\n" + "="*50 + "\n\n")

def main():
    root = tk.Tk()
    app = MovieRecommenderApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()