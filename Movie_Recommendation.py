import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import requests
import random
from datetime import datetime

class MovieRecommenderApp:
    def __init__(self, master):
        self.master = master
        master.title("Movie Recommender")
        master.geometry("600x800")
        
        # Initialize TMDb API
        self.api_key = "Your api key"  # Replace with your API key
        self.base_url = "https://api.themoviedb.org/3"
        
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
        
        self.setup_ui()
        
    def setup_ui(self):
        # Title
        title_label = tk.Label(
            self.master,
            text="Movie Recommender",
            font=("Arial", 24, "bold"),
            pady=20
        )
        title_label.pack()
        
        # Genre Selection
        genre_frame = tk.Frame(self.master)
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
            self.master,
            text="Get Random Movies",
            command=self.get_random_movies,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 12, "bold"),
            pady=10
        )
        random_button.pack(pady=10)
        
        # Movie Display Area
        self.movie_display = scrolledtext.ScrolledText(
            self.master,
            wrap=tk.WORD,
            width=60,
            height=30,
            font=("Arial", 11)
        )
        self.movie_display.pack(padx=20, pady=10)
        
    def get_random_movies(self):
        if not self.genre_var.get():
            messagebox.showwarning("Warning", "Please select a genre!")
            return
            
        try:
            self.movie_display.delete(1.0, tk.END)
            self.movie_display.insert(tk.END, "Loading movies...\n")
            self.master.update()
            
            genre_id = self.genres[self.genre_var.get()]
            random_page = random.randint(1, 10)
            
            params = {
                "api_key": self.api_key,
                "with_genres": genre_id,
                "sort_by": "popularity.desc",
                "vote_count.gte": 100,
                "page": random_page,
                "language": "en-US"
            }
            
            response = requests.get(f"{self.base_url}/discover/movie", params=params)
            
            if response.status_code == 200:
                movies = response.json()["results"]
                if movies:
                    selected_movies = random.sample(movies, min(3, len(movies)))
                    self.display_movies(selected_movies)
                else:
                    self.movie_display.delete(1.0, tk.END)
                    self.movie_display.insert(tk.END, "No movies found!")
            else:
                raise Exception(f"API request failed: {response.status_code}")
                
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {str(e)}")
            
    def display_movies(self, movies):
        self.movie_display.delete(1.0, tk.END)
        
        for movie in movies:
            # Get additional movie details including trailers
            movie_id = movie["id"]
            details_response = requests.get(
                f"{self.base_url}/movie/{movie_id}",
                params={"api_key": self.api_key, "append_to_response": "videos"}
            )
            
            if details_response.status_code == 200:
                details = details_response.json()
                
                # Format release date
                release_date = datetime.strptime(movie["release_date"], "%Y-%m-%d").strftime("%B %d, %Y")
                
                # Get trailer
                trailer = None
                if "videos" in details and details["videos"]["results"]:
                    trailers = [v for v in details["videos"]["results"] 
                              if v["site"] == "YouTube" and v["type"] in ["Trailer", "Teaser"]]
                    if trailers:
                        trailer = random.choice(trailers)
                
                # Display movie information
                self.movie_display.insert(tk.END, f"🎬 {movie['title']}\n")
                self.movie_display.insert(tk.END, f"📅 Release Date: {release_date}\n")
                self.movie_display.insert(tk.END, f"⭐ Rating: {movie['vote_average']}/10\n")
                if trailer:
                    self.movie_display.insert(tk.END, f"🎥 Trailer: https://www.youtube.com/watch?v={trailer['key']}\n")
                self.movie_display.insert(tk.END, f"📝 Overview: {movie['overview']}\n")
                self.movie_display.insert(tk.END, "\n" + "="*50 + "\n\n")

def main():
    root = tk.Tk()
    app = MovieRecommenderApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
