const options = ["Option 1", "Option 2", "Option 3", "Option 4","Option 5"]; // The options to be suggested

// Function to filter and show the dropdown items based on the search input
function showDropdown(input) {
  const dropdown = document.getElementById("dropdown");
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(input.toLowerCase())
  );
  dropdown.innerHTML = ""; // Clear previous dropdown items
  
  // Create and display new dropdown items based on the filtered options
  filteredOptions.forEach(option => {
    const item = document.createElement("div");
    item.classList.add("dropdown-item");
    item.textContent = option;
    item.setAttribute("data-value", option);
    dropdown.appendChild(item);
  });

  dropdown.style.display = filteredOptions.length > 0 ? "block" : "none";
}

// Handle clicking on a dropdown item to populate the input field
document.getElementById("dropdown").addEventListener("click", function (e) {
  if (e.target.classList.contains("dropdown-item")) {
    const selectedValue = e.target.getAttribute("data-value");
    document.getElementById("searchInput").value = selectedValue;
    this.style.display = "none"; // Hide the dropdown after selection
  }
});

// Handle typing in the input field
document.getElementById("searchInput").addEventListener("input", function () {
  showDropdown(this.value); // Filter and show dropdown as user types
});

// Close the dropdown if the user clicks outside
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("dropdown");
  if (!dropdown.contains(e.target) && e.target !== document.getElementById("searchInput")) {
    dropdown.style.display = "none";
  }
});

document.getElementById("productForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent form from submitting and reloading the page

  const formData = new FormData(this);
  const data = {};

  formData.forEach((value, key) => {
    data[key] = value;
  });

  // Send the data to the server using fetch
  fetch("/add-product", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data), // Send data as JSON
  })
    .then((response) => response.json()) // Parse the JSON response
    .then((data) => {
      if (data.success) {
        alert(data.message); // Show success message in alert
      } else {
        alert(data.message); // Show error message in alert
      }

      // Reset the form after submission
      document.getElementById("productForm").reset(); // This clears the form fields
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Something went wrong. Please try again."); // Generic error message
    });
});
