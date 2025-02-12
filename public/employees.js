// Scroll To Top functionality
const scrollToTopBtn = document.getElementById("scrollToTopBtn");
if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

// Employee Form Submission
document.getElementById("employeeForm")?.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent default form submission

  const employeeData = {
    employeeName: document.getElementById("employeeName").value.trim(),
    joiningDate: document.getElementById("joiningDate").value,
    employeeAge: parseInt(document.getElementById("employeeAge").value, 10),
    department: document.getElementById("department").value.trim(),
    workingStatus: document.getElementById("workingStatus").value,
  };

  // Validate inputs
  if (!employeeData.employeeName || !employeeData.joiningDate || !employeeData.employeeAge || !employeeData.department || !employeeData.workingStatus) {
    alert("All fields are required. Please fill out the form completely.");
    return;
  }

  try {
    const response = await fetch("/add-employee", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(employeeData),
    });

    const result = await response.json();
    if (result.success) {
      alert("Employee added successfully!");

      // Reset the form
      document.getElementById("employeeForm").reset();

      // Refresh the employee list
      fetchEmployees();
    } else {
      alert("Error adding employee: " + result.message);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("An error occurred. Please try again.");
  }
});

// Employee Search functionality
document.getElementById("employeeSearch")?.addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const cards = document.querySelectorAll(".employee-card");
  const searchResultsContainer = document.getElementById("search-results"); // Container to display matching names

  // Clear previous results
  searchResultsContainer.innerHTML = "";

  // Variable to track if there are any results
  let hasResults = false;

  // Check if each employee card name includes the search query
  cards.forEach((card) => {
    const name = card.querySelector(".employee-name").textContent.toLowerCase();
    if (name.includes(query)) {
      card.style.display = ""; // Show matching card
      hasResults = true;
    } else {
      card.style.display = "none"; // Hide non-matching card
    }
  });

  // Show or hide the search results box based on whether there are results
  if (hasResults) {
    searchResultsContainer.style.display = "block";
  } else {
    searchResultsContainer.style.display = "none";
  }

  // If no results, display a message
  if (!hasResults && query.trim() !== "") {
    const noResultsMessage = document.createElement("p");
    noResultsMessage.textContent = "No matching employees found.";
    searchResultsContainer.appendChild(noResultsMessage);
  }
});

// Fetch and display employees from the database
const fetchEmployees = async () => {
  try {
    const response = await fetch("/employees");
    const employees = await response.json();

    const employeeCardsContainer = document.getElementById("employee-cards-container");

    // Clear any existing cards before appending new ones
    employeeCardsContainer.innerHTML = "";

    employees.forEach((employee) => {
      const card = document.createElement("div");
      card.className = "employee-card";

      // Add employee details into the card
      card.innerHTML = `
        <button class="delete-btn" data-id="${employee._id}">&times;</button> <!-- Cross button -->
        <h3 class="employee-name">${employee.employeeName}</h3>
        <p>Joining Date: <span class="joining-date">${employee.joiningDate}</span></p>
        <p>Age: <span class="employee-age">${employee.employeeAge}</span></p>
        <p>Department: <span class="employee-department">${employee.department}</span></p>
        <p>Status: <span class="employee-working">${employee.workingStatus}</span></p>
      `;

      // Append the card to the employee cards container
      employeeCardsContainer.appendChild(card);
    });

    // Add event listeners to delete buttons inside employee cards only
    const deleteButtons = document.querySelectorAll(".employee-card .delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const employeeId = button.getAttribute("data-id");

        // Open the confirmation modal for deletion
        openConfirmationModal(employeeId);
      });
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    alert("Error fetching employee data.");
  }
};

// Modal elements for confirmation
const confirmModal = document.getElementById("confirmModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

let employeeIdToDelete = null; // Store employee ID to delete

// Function to open the confirmation modal
function openConfirmationModal(employeeId) {
  employeeIdToDelete = employeeId;
  confirmModal.style.display = "flex"; // Show modal
}

// Close the modal
closeModalBtn.addEventListener("click", () => {
  confirmModal.style.display = "none";
});

cancelDeleteBtn.addEventListener("click", () => {
  confirmModal.style.display = "none"; // Close modal without deleting
});

// Confirm deletion
confirmDeleteBtn.addEventListener("click", async () => {
  if (employeeIdToDelete) {
    try {
      // Send request to delete the employee
      const response = await fetch(`/delete-employee/${employeeIdToDelete}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        alert("Employee deleted successfully!");
        fetchEmployees(); // Refresh the employee list
      } else {
        alert("Error deleting employee: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("An error occurred. Please try again.");
    }

    // Close the modal after deletion
    confirmModal.style.display = "none";
  }
});

// Call the function to fetch employees when the page loads
document.addEventListener("DOMContentLoaded", fetchEmployees);
