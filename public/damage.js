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

// Damage Form Submission
document.addEventListener("DOMContentLoaded", () => {
  const damageForm = document.getElementById("damageForm");

  if (damageForm) {
    damageForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      // Get form field values
      const damageData = {
        damageName: document.getElementById("itemName")?.value.trim(),  // Keep as damageName
        damageDate: document.getElementById("damageDate")?.value,      // Keep damageDate
        damageSerialNo: document.getElementById("serialNo")?.value.trim(),  // Keep serialNo
        damageType: document.getElementById("damageType")?.value.trim(),    // Keep damageType
        warrantyStatus: document.getElementById("warrantyStatus")?.value,    // Keep warrantyStatus
      };

      // Validate inputs (simple validation can be added here)
      if (!damageData.damageName || !damageData.damageDate || !damageData.damageSerialNo || !damageData.damageType || !damageData.warrantyStatus) {
        alert("Please fill all fields before submitting.");
        return;
      }

      try {
        // Send data to the server using fetch
        const response = await fetch("/add-damage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(damageData),
        });

        const result = await response.json();
        if (result.success) {
          alert("Damage item added successfully!");

          // Reset the form
          damageForm.reset();

          // Optionally refresh the damage list
          fetchDamages();
        } else {
          alert("Error adding damage item: " + result.message);
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("An error occurred. Please try again.");
      }
    });
  }
});

// Damage Search functionality
document.getElementById("damageSearch")?.addEventListener("input", function () {
  const query = this.value.toLowerCase();
  const cards = document.querySelectorAll(".damage-card");
  const searchResultsContainer = document.getElementById("search-results");

  // Clear previous results
  searchResultsContainer.innerHTML = "";

  // Variable to track if there are any results
  let hasResults = false;

  // Check if each damage card name includes the search query
  cards.forEach((card) => {
    const name = card.querySelector(".damage-name").textContent.toLowerCase();
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
    noResultsMessage.textContent = "No matching damage items found.";
    searchResultsContainer.appendChild(noResultsMessage);
  }
});

// Fetch and display damages from the database
const fetchDamages = async () => {
  try {
    const response = await fetch("/damages");
    const damages = await response.json();

    const damageCardsContainer = document.getElementById("damage-cards-container");

    // Clear any existing cards before appending new ones
    damageCardsContainer.innerHTML = "";

    damages.forEach((damage) => {
      const card = document.createElement("div");
      card.className = "damage-card";

      // Add damage details into the card
      card.innerHTML = `
        <button class="delete-btn" data-id="${damage._id}">&times;</button> <!-- Cross button -->
        <h3 class="damage-name">${damage.damageName}</h3>
        <p>Damage Date: <span class="damage-date">${damage.damageDate}</span></p>
        <p>Serial No.: <span class="damage-serialNo">${damage.damageSerialNo}</span></p>
        <p>Type: <span class="damage-item">${damage.damageType}</span></p>
        <p>Warranty Status: <span class="damage-warranty">${damage.warrantyStatus}</span></p>
      `;

      // Append the card to the damage cards container
      damageCardsContainer.appendChild(card);
    });

    // Add event listeners to delete buttons inside damage cards only
    const deleteButtons = document.querySelectorAll(".damage-card .delete-btn");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        const damageId = button.getAttribute("data-id");

        // Open the confirmation modal for deletion
        openConfirmationModal(damageId);
      });
    });
  } catch (error) {
    console.error("Error fetching damages:", error);
    alert("Error fetching damage data.");
  }
};

// Call the function to fetch damages when the page loads
document.addEventListener("DOMContentLoaded", fetchDamages);

// Modal elements for confirmation
const confirmModal = document.getElementById("confirmModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

let damageIdToDelete = null; // Store damage ID to delete

// Function to open the confirmation modal
function openConfirmationModal(damageId) {
  damageIdToDelete = damageId;
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
  if (damageIdToDelete) {
    try {
      // Send request to delete the damage item
      const response = await fetch(`/delete-damage/${damageIdToDelete}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        alert("Damage item deleted successfully!");
        fetchDamages(); // Refresh the damage list
      } else {
        alert("Error deleting damage item: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting damage item:", error);
      alert("An error occurred. Please try again.");
    }

    // Close the modal after deletion
    confirmModal.style.display = "none";
  }
});
