let currentPage = 1;
const rowsPerPage = 9;

async function renderTableData() {
  const tableBody = document.getElementById('item-table').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = ''; // Clear the existing table rows

  try {
    // Fetch data from the server
    const response = await fetch('/api/assigned-items');
    const assignedItems = await response.json();

    // Filter only assigned items
    const filteredItems = assignedItems.filter(
      item => item.employeeName && item.employeeName.trim() !== ''
    );

    // Populate the table with filtered data
    filteredItems.forEach((item, index) => {
      const row = tableBody.insertRow();
      row.innerHTML = `
      <td>${item.serialNumber}</td>
      <td>${item.productName}</td>
      <td>${item.category}</td>
      <td>${item.employeeName}</td>
      <td>${item.assignDate || 'N/A'}</td>
      <td>${item.returnDate || 'N/A'}</td>
      <td><button class="return-btn" data-serial-number="${item.serialNumber}">Return</button></td>
    `;
    });

    // Reinitialize pagination with filtered items
    initializePagination(filteredItems);
  } catch (error) {
    console.error('Error fetching data:', error);
  }

  // Add event listeners to "Return" buttons
  const returnButtons = document.querySelectorAll('.return-btn');
  returnButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const serialNumber = e.target.getAttribute('data-serial-number');
      openReturnPopup(serialNumber);
    });
  });
}

// Function to open the return popup
function openReturnPopup(serialNumber) {
  const popup = document.getElementById('return-popup');
  const closeButton = document.getElementById('close-popup-btn');
  const confirmButton = document.getElementById('confirm-return-btn');
  const returnDateInput = document.getElementById('return-date');

  // Show the popup
  popup.classList.add('visible');

  // Close popup when close button is clicked
  closeButton.addEventListener('click', () => {
    popup.classList.remove('visible');
  });

  // Confirm return action
  confirmButton.addEventListener('click', () => {
    const returnDate = returnDateInput.value;
    if (returnDate) {
      // Call the API to update the return date and remove the item from the collection
      confirmReturn(serialNumber, returnDate);
      popup.classList.remove('visible'); // Close the popup
    } else {
      alert('Please select a return date.');
    }
  });
}

// Function to confirm return and remove from the collection
async function confirmReturn(serialNumber, returnDate) {
  try {
    const response = await fetch('/api/return-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serialNumber, returnDate }),
    });

    const data = await response.json();
    if (data.success) {
      // Update the table after confirming the return
      renderTableData();
      alert('Item returned successfully.');
    } else {
      alert('Failed to return the item.');
    }
  } catch (error) {
    console.error('Error confirming return:', error);
    alert('An error occurred while returning the item.');
  }
}

// Pagination Logic
function initializePagination(assignedItems) {
  const tableBody = document.querySelector("#item-table tbody");
  const rows = Array.from(tableBody.querySelectorAll("tr")); // Get rows after sorting
  const totalPages = Math.ceil(assignedItems.length / rowsPerPage);

  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const pageInfo = document.getElementById("page-info");

  function updateTable() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(currentPage * rowsPerPage, rows.length);

    rows.forEach((row, index) => {
      row.style.display = index >= startIndex && index < endIndex ? "" : "none";
    });

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      updateTable();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      updateTable();
    }
  });

  // Initialize table display
  updateTable();
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
  } 
  else if (sortBy === 'category') {
    // Sort by Category
    sortedItems.sort((itemA, itemB) => itemA.category.toLowerCase().localeCompare(itemB.category.toLowerCase()));
  } 
   else if (sortBy === 'date') {
    // Sort by Date Assigned
    sortedItems.sort((itemA, itemB) => new Date(itemA.assignDate) - new Date(itemB.assignDate));
  }

  renderTableData(); // Re-render the table after sorting
}

// Initialize table rendering on page load
renderTableData();
