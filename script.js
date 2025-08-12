    // API Key untuk TMDb API
    const apiKey = '6e230618e2508a2c144e4750c97a8809';
    const resultsDiv = document.getElementById('results');
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('modal');
    const modalContent = document.querySelector('#modalContent .p-6');
    const modalClose = document.getElementById('modalClose');
    const toast = document.getElementById('toast');
    const loading = document.getElementById('loading');
    const pagination = document.getElementById('pagination');
    const darkToggle = document.getElementById('darkToggle');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const searchInfo = document.getElementById('searchInfo');
    const queryText = document.getElementById('queryText');

    let currentPage = 1;
    let currentQuery = '';
    let totalResults = 0;
    let totalPages = 1;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Toast notification
    function showToast(message) {
      toast.innerHTML = message;
      toast.classList.remove('hidden');
      toast.classList.add('flex', 'items-center', 'gap-2');
      
      setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('flex', 'items-center', 'gap-2');
      }, 3000);
    }

    // Dark mode toggle
    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    }

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }

    darkToggle.addEventListener('click', toggleDarkMode);

    // Loading states
    function showLoading() {
      loading.classList.remove('hidden');
      loading.classList.add('flex');
      emptyState.classList.add('hidden');
      errorState.classList.add('hidden');
    }

    function hideLoading() {
      loading.classList.add('hidden');
      loading.classList.remove('flex');
    }

    // Pagination
    function renderPagination() {
      pagination.innerHTML = '';
      if (totalPages <= 1) return;

      // Previous button
      if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.className = 'px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200';
        prevBtn.addEventListener('click', () => {
          currentPage--;
          searchMovies(currentQuery, currentPage);
          window.scrollTo({top: 0, behavior: 'smooth'});
        });
        pagination.appendChild(prevBtn);
      }

      // Page buttons
      const maxVisiblePages = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `px-4 py-2 rounded-full mx-1 ${i === currentPage ? 
          'bg-primary-500 text-white shadow-md' : 
          'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`;
        
        btn.addEventListener('click', () => {
          if (i !== currentPage) {
            currentPage = i;
            searchMovies(currentQuery, currentPage);
            window.scrollTo({top: 0, behavior: 'smooth'});
          }
        });
        pagination.appendChild(btn);
      }

      // Next button
      if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.className = 'px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200';
        nextBtn.addEventListener('click', () => {
          currentPage++;
          searchMovies(currentQuery, currentPage);
          window.scrollTo({top: 0, behavior: 'smooth'});
        });
        pagination.appendChild(nextBtn);
      }
    }

    // Check if movie is favorite
    function isFavorite(id) {
      return favorites.some(fav => fav.id === id);
    }

    // Toggle favorite
    function toggleFavorite(movie) {
      if (isFavorite(movie.id)) {
        favorites = favorites.filter(fav => fav.id !== movie.id);
        showToast('<i class="fas fa-check-circle mr-2 text-green-400"></i> Film dihapus dari favorit');
      } else {
        favorites.push(movie);
        showToast('<i class="fas fa-check-circle mr-2 text-green-400"></i> Film ditambahkan ke favorit');
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
      renderModal(movie);
    }

    // Format durasi
    function formatRuntime(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }

    // Format tanggal rilis
    function formatReleaseDate(dateString) {
      if (!dateString) return 'Tidak diketahui';
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Render movie cards
    function renderResults(movies) {
      resultsDiv.innerHTML = '';
      
      if (!movies || movies.length === 0) {
        emptyState.classList.remove('hidden');
        pagination.classList.add('hidden');
        return;
      }
      
      emptyState.classList.add('hidden');
      pagination.classList.remove('hidden');
      
      movies.forEach(movie => {
        const posterPath = movie.poster_path ? 
          `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
          'https://via.placeholder.com/300x450?text=No+Image';
          
        const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : 'Tahun tidak diketahui';
        
        const card = document.createElement('div');
        card.className = 'movie-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300';
        card.innerHTML = `
          <div class="relative pb-[150%] overflow-hidden">
            <img 
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
              src="${posterPath}" 
              alt="${movie.title}"
              loading="lazy"
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <div>
                <h3 class="text-white font-semibold text-lg line-clamp-1">${movie.title}</h3>
                <p class="text-gray-300 text-sm">${releaseYear}</p>
                <div class="flex items-center mt-1">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <span class="text-yellow-400">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                  <span class="text-gray-300 mx-1">|</span>
                  <span class="text-gray-300">${releaseYear}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-3">
            <div class="flex justify-between items-center">
              <h3 class="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">${movie.title}</h3>
              <span class="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full">${releaseYear}</span>
            </div>
            <button class="mt-2 w-full py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              Detail
            </button>
          </div>
        `;
        
        card.addEventListener('click', () => showModal(movie.id));
        resultsDiv.appendChild(card);
      });
    }

    // Search movies
    async function searchMovies(query, page = 1) {
      showLoading();
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}&language=id-ID`);
        const data = await res.json();
        hideLoading();

        if (data.results && data.results.length > 0) {
          currentQuery = query;
          totalResults = data.total_results;
          totalPages = data.total_pages;
          
          // Update search info
          queryText.textContent = query;
          searchInfo.classList.remove('hidden');
          
          renderResults(data.results);
          renderPagination();
        } else {
          resultsDiv.innerHTML = `
            <div class="col-span-full text-center py-12">
              <div class="mx-auto w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-search text-3xl text-gray-400"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">Film tidak ditemukan</h3>
              <p class="text-gray-500 dark:text-gray-400 mt-2">Coba kata kunci lain</p>
            </div>
          `;
          pagination.innerHTML = '';
          searchInfo.classList.add('hidden');
        }
      } catch (err) {
        hideLoading();
        errorState.classList.remove('hidden');
        document.getElementById('errorTitle').textContent = 'Terjadi Kesalahan';
        document.getElementById('errorMessage').textContent = 'Gagal mengambil data dari server. Silakan coba lagi nanti.';
        pagination.innerHTML = '';
        searchInfo.classList.add('hidden');
      }
    }

    // Fetch movie details
    async function fetchMovieDetail(movieId) {
      showLoading();
      try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits&language=id-ID`);
        const data = await res.json();
        hideLoading();
        return data;
      } catch (err) {
        hideLoading();
        showToast('<i class="fas fa-exclamation-circle mr-2 text-red-400"></i> Gagal mengambil detail film');
        return null;
      }
    }

    // Render modal with movie details
    async function renderModal(movieId) {
      const movie = await fetchMovieDetail(movieId);
      if (!movie) return;

      const favBtnText = isFavorite(movie.id) ? 
        '<i class="fas fa-heart mr-2"></i> Hapus dari Favorit' : 
        '<i class="far fa-heart mr-2"></i> Tambah ke Favorit';
        
      // Format genres
      const genresHTML = movie.genres ? 
        movie.genres.map(genre => `
          <span class="px-3 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">${genre.name}</span>
        `).join('') : 
        '<span class="text-gray-500">Genre tidak tersedia</span>';
        
      // Get director
      const director = movie.credits && movie.credits.crew ? 
        movie.credits.crew.find(person => person.job === 'Director')?.name : 
        'Tidak diketahui';
        
      // Get top 5 cast members
      const cast = movie.credits && movie.credits.cast ? 
        movie.credits.cast.slice(0, 5).map(person => person.name).join(', ') : 
        'Tidak diketahui';
        
      const posterPath = movie.poster_path ? 
        `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
        'https://via.placeholder.com/300x450?text=No+Image';

      modalContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1">
            <img 
              src="${posterPath}" 
              alt="${movie.title}" 
              class="w-full rounded-xl shadow-md"
            >
          </div>
          
          <div class="lg:col-span-2">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">${movie.title} <span class="text-gray-600 dark:text-gray-400 font-normal">(${movie.release_date ? movie.release_date.substring(0, 4) : 'Tahun tidak diketahui'})</span></h2>
                <div class="flex items-center mb-3">
                  <i class="fas fa-star text-yellow-400 mr-1"></i>
                  <span class="text-xl font-bold">${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                  <span class="text-gray-500 mx-2">•</span>
                  <span class="text-gray-600 dark:text-gray-400">${movie.vote_count ? movie.vote_count.toLocaleString() : '0'} votes</span>
                </div>
                <div class="flex flex-wrap gap-2 mt-2">
                  ${genresHTML}
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Tanggal Rilis</p>
                <p class="font-medium text-gray-800 dark:text-gray-200">${formatReleaseDate(movie.release_date)}</p>
              </div>
              <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Durasi</p>
                <p class="font-medium text-gray-800 dark:text-gray-200">${movie.runtime ? formatRuntime(movie.runtime) : 'Tidak diketahui'}</p>
              </div>
              <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Sutradara</p>
                <p class="font-medium text-gray-800 dark:text-gray-200">${director}</p>
              </div>
              <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <p class="text-sm text-gray-500 dark:text-gray-400">Pemeran</p>
                <p class="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">${cast}</p>
              </div>
            </div>
            
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Sinopsis</h3>
              <p class="text-gray-600 dark:text-gray-300">${movie.overview || 'Sinopsis tidak tersedia'}</p>
            </div>
            
            <button 
              id="favBtn"
              class="w-full py-3 px-6 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              ${favBtnText}
            </button>
          </div>
        </div>
      `;

      // Modal close button
      modalClose.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      });

      // Favorite button
      document.getElementById('favBtn').addEventListener('click', () => {
        toggleFavorite({
          id: movie.id,
          title: movie.title,
          release_date: movie.release_date,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average
        });
      });

      // Show modal
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }

    // Show modal
    function showModal(movieId) {
      renderModal(movieId);
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    });

    // Search form submission
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length < 2) {
        showToast('<i class="fas fa-exclamation-circle mr-2 text-yellow-400"></i> Masukkan minimal 2 karakter');
        return;
      }
      currentPage = 1;
      searchMovies(query, currentPage);
    });

    // Initial load
    window.addEventListener('load', () => {
      if (favorites.length > 0) {
        emptyState.innerHTML = `
          <div class="mx-auto w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <i class="fas fa-star text-5xl text-yellow-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Selamat datang kembali!</h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">Anda memiliki ${favorites.length} film favorit</p>
          <button id="showFavorites" class="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors duration-200">
            Lihat Favorit
          </button>
        `;
        
        document.getElementById('showFavorites').addEventListener('click', () => {
          renderResults(favorites);
          showToast('<i class="fas fa-star mr-2 text-yellow-400"></i> Menampilkan film favorit');
          searchInfo.classList.remove('hidden');
          queryText.textContent = 'Film Favorit';
        });
      }
    });