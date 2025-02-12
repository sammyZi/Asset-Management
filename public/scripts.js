document.getElementById('searchIcon').addEventListener('click', function() {
    var searchInput = document.getElementById('searchInput');
    
    // Toggle visibility of the search input box
    if (searchInput.style.display === 'none' || searchInput.style.display === '') {
      searchInput.style.display = 'block'; // Show the search input field
    } else {
      searchInput.style.display = 'none'; // Hide the search input field
    }
  });
  