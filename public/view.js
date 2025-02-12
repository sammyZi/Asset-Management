let currentPage = 1;
const rowsPerPage = 9;
let items = []; // Store fetched items globally
let sortedItems = []; // Temporary variable for storing sorted data

// Function to fetch items from the server
async function fetchItems() {
  try {
    const response = await fetch('/api/items');
    const data = await response.json();
    items = data; // Save the fetched items globally

    // Separate valid items based on status
    const inUseItems = items.filter(item => item.status === "In Use");
    const availableItems = items.filter(item => item.status !== "In Use");

    // Sort In Use items (first) and Available items (later)
    sortedItems = [...inUseItems, ...availableItems];

    // Optionally, you can sort each group by other criteria, like name
    sortedItems.sort((itemA, itemB) => itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase()));

    renderTableData(); // Render table for the first page
  } catch (error) {
    console.error('Error fetching items:', error);
  }
}

// Function to render table data
function renderTableData() {
  const tableBody = document.getElementById("item-table").getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Clear the existing table rows

  // Paginate items
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(currentPage * rowsPerPage, sortedItems.length);
  const currentItems = sortedItems.slice(startIndex, endIndex);

  // Create rows dynamically
  currentItems.forEach((item, index) => {
    const row = tableBody.insertRow();

    // Determine status (use 'Available' as fallback if status is not defined)
    const status = item.status || "Available";

    row.innerHTML = `
      <td>${item.serialNumber}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.purchaseDate || "-"}</td>
      <td>${item.price.toLocaleString()}</td>
      <td>${item.itemType}</td>
      <td>${item.assignedTo || "-"}</td>
      <td style="color: ${status === "Available" ? "green" : "red"};">${status}</td>
      <td class="info-column">
        <i class="fas fa-info-circle" title="More information" data-index="${startIndex + index}"></i>
      </td>
    `;
  });

  // Add click event listeners for info buttons
  const infoButtons = document.querySelectorAll(".info-column .fa-info-circle");
  infoButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      const index = event.target.getAttribute("data-index");
      showInfoPopup(sortedItems[index]);
    });
  });

  initializePagination();
}

// Sort function
function sortTable() {
  const sortBy = document.getElementById("sort-by").value;

  // Sort items based on selected criteria
  if (sortBy === 'sr') {
    // Sort by Serial Number (Numeric part only)
    sortedItems.sort((itemA, itemB) => extractNumber(itemA.serialNumber) - extractNumber(itemB.serialNumber));
  } else if (sortBy === 'name') {
    // Sort by Name
    sortedItems.sort((itemA, itemB) => itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase()));
  } else if (sortBy === 'price') {
    // Sort by Price
    sortedItems.sort((itemA, itemB) => itemA.price - itemB.price);
  } else if (sortBy === 'category') {
    // Sort by Category
    sortedItems.sort((itemA, itemB) => itemA.category.toLowerCase().localeCompare(itemB.category.toLowerCase()));
  } else if (sortBy === 'status') {
    // Sort by Status (Apply "In Use First" logic here)
    const inUseItems = sortedItems.filter(item => item.status === "In Use");
    const availableItems = sortedItems.filter(item => item.status !== "In Use");

    sortedItems = [...inUseItems, ...availableItems];
  } else if (sortBy === 'date') {
    // Sort by Date Assigned
    sortedItems.sort((itemA, itemB) => new Date(itemA.assignDate) - new Date(itemB.assignDate));
  }

  renderTableData(); // Re-render the table after sorting
}

// Pagination logic
function initializePagination() {
  const totalPages = Math.ceil(sortedItems.length / rowsPerPage);

  const pageInfo = document.getElementById("page-info");

  function updatePaginationControls() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prev-btn").disabled = currentPage === 1;
    document.getElementById("next-btn").disabled = currentPage === totalPages;
  }

  updatePaginationControls();
}

// Event listeners for pagination buttons
document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTableData(); // Re-render the table for the new page
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  if (currentPage < Math.ceil(sortedItems.length / rowsPerPage)) {
    currentPage++;
    renderTableData(); // Re-render the table for the new page
  }
});

// Initialize table rendering on page load
fetchItems();

// Event listener for sorting
document.getElementById("sort-by").addEventListener("change", sortTable);

let itemToDelete = null; // Holds the item to be deleted

// Function to close the info popup and show the pagination again
function closeInfoPopup() {
  const popup = document.getElementById('infoPopup');
  const pagination = document.querySelector('.pagination'); // Get the pagination element

  popup.classList.add('hidden'); // Hide the popup
  pagination.classList.remove('hide-pagination'); // Show pagination again
}

// Function to show the info popup
function showInfoPopup(item) {
  const popup = document.getElementById('infoPopup');
  const detailsList = document.getElementById('infoDetails');
  const pagination = document.querySelector('.pagination'); // Get the pagination element
  const popupContent = popup.querySelector('.popup-content');

  // Populate the details list with the item info
  detailsList.innerHTML = `
    <li><strong>Serial Number:</strong> ${item.serialNumber}</li>
    <li><strong>Name:</strong> ${item.name}</li>
    <li><strong>Category:</strong> ${item.category}</li>
    <li><strong>Purchase Date:</strong> ${item.purchaseDate || "-"}</li>
    <li><strong>Warranty Period:</strong> ${item.warrantyPeriod || "-"}</li>
    <li><strong>Price:</strong> ${item.price.toLocaleString()}</li>
    <li><strong>Item Type:</strong> ${item.itemType}</li>
    <li><strong>Assigned To:</strong> ${item.assignedTo || "-"}</li>
    <li><strong>Assign Date:</strong> ${item.assignDate || "-"}</li>
    <li><strong>Status:</strong> <span style="color: ${item.status === 'Available' ? 'green' : 'red'};">${item.status}</span></li>
  `;

  // Add the delete button
  let deleteButton = popupContent.querySelector('.delete-btn');
  if (!deleteButton) {
    deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-btn';
    deleteButton.onclick = function () {
      itemToDelete = item; // Store the item to be deleted
      showConfirmationModal(); // Show the confirmation modal
    };
    popupContent.appendChild(deleteButton);
  }

  pagination.classList.add('hide-pagination'); // Hide pagination
  popup.classList.remove('hidden'); // Show popup
}

// Function to show the confirmation modal
function showConfirmationModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('hidden');
}

// Function to close the confirmation modal
function closeConfirmationModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.add('hidden');
}

// Function to delete the item
async function deleteItem() {
  if (itemToDelete) {
    try {
      const response = await fetch('/delete-item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serialNumber: itemToDelete.serialNumber }),
      });

      const result = await response.json();

      if (response.ok) {
        sortedItems = sortedItems.filter(item => item.serialNumber !== itemToDelete.serialNumber);
        alert(result.message);
        renderTableData();
        closeConfirmationModal();
        closeInfoPopup();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting the item:', error);
      alert('Failed to delete the item. Please try again.');
    }
  }
}


// Ensure DOM is fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".search-input");

  if (!searchInput) {
    console.error("Search input not found in the DOM.");
    return;
  }

  // Add event listener for real-time search
  searchInput.addEventListener("input", handleSearch);
});

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".search-input");
  const pagination = document.getElementById("pagination");
  

  if (!searchInput) {
    console.error("Search input not found in the DOM.");
    return;
  }

  // Add event listener for real-time search
  searchInput.addEventListener("input", handleSearch);


  
  
});

// Function to handle search input
function handleSearch(event) {
  const searchQuery = event.target.value.trim().toLowerCase();
  const pagination = document.getElementById("pagination");

  // If search query is empty, show all items
  if (searchQuery === "") {
    renderTableData(); // Render all items
    pagination.style.display = "block"; // Show pagination again
    return;
  }

  // Hide pagination during search
  pagination.style.display = "none";

  // Filter items based on search query
  const filteredItems = sortedItems.filter(item =>
    item.serialNumber.toLowerCase().includes(searchQuery)
  );

  // Sort filtered items to bring the most relevant match on top
  filteredItems.sort((a, b) => {
    const aIndex = a.serialNumber.toLowerCase().indexOf(searchQuery);
    const bIndex = b.serialNumber.toLowerCase().indexOf(searchQuery);
    return aIndex - bIndex; // Sort by first occurrence of the match
  });

  // Render table with filtered and sorted items
  renderFilteredTable(filteredItems, searchQuery);
}

// Function to render filtered table data
function renderFilteredTable(filteredItems, searchQuery) {
  const tableBody = document.getElementById("item-table").getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Clear existing rows

  filteredItems.forEach((item, index) => {
    const row = tableBody.insertRow();

    // Determine status
    const status = item.status || "Available";

    // Highlight the matching part of the serial number
    const highlightedSerialNumber = item.serialNumber.replace(
      new RegExp(`(${searchQuery})`, "gi"),
      "<span class='highlight'>$1</span>"
    );

    row.innerHTML = `
      <td>${highlightedSerialNumber}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.purchaseDate || "-"}</td>
      <td>${item.price.toLocaleString()}</td>
      <td>${item.itemType}</td>
      <td>${item.assignedTo || "-"}</td>
      <td style="color: ${status === "Available" ? "green" : "red"};">${status}</td>
      <td class="info-column">
        <i class="fas fa-info-circle" title="More information" data-index="${index}"></i>
      </td>
    `;
  });

  // Add click event listeners for info buttons
  const infoButtons = document.querySelectorAll(".info-column .fa-info-circle");
  infoButtons.forEach(button => {
    button.addEventListener("click", (event) => {
      const index = event.target.getAttribute("data-index");
      showInfoPopup(filteredItems[index]);
    });
  });
}



// Event listeners for the confirmation modal buttons
document.getElementById('confirmDelete').addEventListener('click', deleteItem);
document.getElementById('cancelDelete').addEventListener('click', closeConfirmationModal);

// Add event listeners for the close buttons after the window loads
window.onload = function () {
  document.querySelectorAll(".close-btn").forEach(button => {
    button.addEventListener("click", closeInfoPopup);
  });
};



