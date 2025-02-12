// Employee name search functionality
const employeeInput = document.getElementById('employeeInput');
const employeeDropdown = document.getElementById('employeeDropdown');

employeeInput.addEventListener('input', function () {
  const inputValue = employeeInput.value.toLowerCase();

  // Clear previous suggestions
  employeeDropdown.innerHTML = '';

  if (inputValue) {
    // Make an API request to fetch employee names based on the user's input
    fetch(`/search-employees?search=${inputValue}`)
      .then(response => response.json())
      .then(data => {
        console.log('Fetched employee data:', data); // Log the fetched data

        // Populate the dropdown with matching employee names
        if (data.length > 0) {
          data.forEach(employee => {
            const item = document.createElement('div');
            item.classList.add('dropdown-item');
            item.textContent = employee.employeeName; // Use employeeName here
            employeeDropdown.appendChild(item);

            // Optional: Add click event to select an item
            item.addEventListener('click', function () {
              employeeInput.value = employee.employeeName; // Set input to selected name
              employeeDropdown.innerHTML = ''; // Hide suggestions after selection
            });
          });

          // Show the dropdown if there are suggestions
          employeeDropdown.style.display = 'block';
        } else {
          employeeDropdown.style.display = 'none'; // Hide if no results
        }
      })
      .catch(error => {
        console.error('Error fetching employee data:', error);
        employeeDropdown.style.display = 'none'; // Hide dropdown if there's an error
      });
  } else {
    employeeDropdown.style.display = 'none'; // Hide dropdown if input is empty
  }
});

// Close the employee dropdown when clicking outside the input or dropdown
document.addEventListener('click', function (event) {
  if (!employeeDropdown.contains(event.target) && event.target !== employeeInput) {
    employeeDropdown.style.display = 'none';
  }
});

// Handle form submission for assigning a product
document.querySelector(".add-product-form").addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the default form submission

  // Get the values from the form fields
  const productData = {
    category: document.getElementById("category").value,
    employeeName: document.getElementById("employeeInput").value,
    serialNumber: document.getElementById("serialNumber").value,
    assignDate: document.getElementById("date").value,
    returnDate: document.getElementById("return").value,
  };

  try {
    // Send data to the server (Backend URL)
    const response = await fetch("/assign-product", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });

    const result = await response.json();
    if (result.success) {
      alert("Item assigned successfully!");
      document.querySelector(".add-product-form").reset(); // Reset the form
    } else {
      alert("Error assigning item: " + result.message);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("An error occurred. Please try again.");
  }
});
