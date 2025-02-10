const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();
const PORT = 8000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("dev")); // Logging HTTP requests

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/temp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Product Schema
const productSchema = new mongoose.Schema({
  category: { type: String, required: true }, // Item category: 'hardware' or 'software'
  name: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  warrantyPeriod: { type: String, required: true },
  price: { type: Number, required: true },
  serialNumber: { type: String, unique: true, required: true }, // Serial number field with unique constraint
  itemType: { type: String, required: true } // Added itemType field (e.g., 'New', 'Refurbished', etc.)
});

// Define TotalAssets Schema
const totalAssetsSchema = new mongoose.Schema({
  totalPrice: { type: Number, required: true, default: 0 },
});

// Define Employee Schema
const employeeSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  employeeAge: { type: Number, required: true },
  department: { type: String, required: true },
  workingStatus: { type: String, required: true, enum: ["Full-Time", "Part-Time", "On Leave", "Contract"] },
});

// Define assign schema
const assignedSchema = new mongoose.Schema({
  category: String,
  employeeName: String,
  serialNumber: String,
  assignDate: Date,
  returnDate: Date,
});

const AssignedProduct = mongoose.model("AssignedProduct", assignedSchema, "assigned");

// Schema for Damage Items
const damageSchema = new mongoose.Schema({
  damageName: { type: String, required: true },
  damageDate: { type: String, required: true },
  damageSerialNo: { type: String, required: true },
  damageType: { type: String, required: true },
  warrantyStatus: { type: String, required: true },
});

const Damage = mongoose.model("Damage", damageSchema);


const returnHistorySchema = new mongoose.Schema({
  serialNumber: { type: String, required: true },
  employeeName: { type: String, required: true },
  returnDate: { type: Date, required: true },
});

// Create the ReturnHistory model
const ReturnHistory = mongoose.model("ReturnHistory", returnHistorySchema, "returnhistory");

// Define the ItemHistory schema
const itemHistorySchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  warrantyPeriod: { type: String, required: true },
  price: { type: Number, required: true },
  serialNumber: { type: String, required: true },
  itemType: { type: String, required: true },
  archivedAt: { type: Date, default: Date.now }, // Timestamp for archival
});

const ItemHistory = mongoose.model("ItemHistory", itemHistorySchema);

// Define the DamageHistory schema
const damageHistorySchema = new mongoose.Schema({
  damageName: { type: String, required: true },
  damageDate: { type: String, required: true },
  damageSerialNo: { type: String, required: true },
  damageType: { type: String, required: true },
  warrantyStatus: { type: String, required: true },
  archivedAt: { type: Date, default: Date.now }, // To track when the record was archived
});

const DamageHistory = mongoose.model("DamageHistory", damageHistorySchema);


// Create Models
const Product = mongoose.model("Product", productSchema);
const TotalAssets = mongoose.model("TotalAssets", totalAssetsSchema);
const Employee = mongoose.model("Employee", employeeSchema);

// Middleware for logging IP traffic
app.use((req, res, next) => {
  const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(`[Traffic Log] IP: ${clientIp} - Method: ${req.method} - URL: ${req.url}`);
  next();
});

// Express Static Middleware for public folder
app.use(express.static("public"));

// Initialize TotalAssets Collection
const initializeTotalAssets = async () => {
  const totalAssets = await TotalAssets.findOne();
  if (!totalAssets) {
    await new TotalAssets({ totalPrice: 0 }).save();
    console.log("TotalAssets table initialized.");
  }
};
initializeTotalAssets();

// Helper Function to Update TotalAssets
const updateTotalAssets = async () => {
  try {
    const total = await Product.aggregate([
      { $group: { _id: null, totalPrice: { $sum: "$price" } } },
    ]);

    const totalPrice = total.length > 0 ? total[0].totalPrice : 0;
    await TotalAssets.findOneAndUpdate({}, { totalPrice }, { upsert: true });
    console.log(`Total assets updated: ${totalPrice}`);
  } catch (err) {
    console.error("Error updating total assets:", err);
  }
};

// Route to serve HTML form (Optional for testing)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html"); // Ensure `index.html` contains your form.
});

// Route to handle form submission
app.post("/add-product", async (req, res) => {
  const { category, name, purchaseDate, warrantyPeriod, quantity, price, itemType } = req.body;

  try {
    // Prepare an array to hold all the items to be saved
    const itemsToSave = [];

    // Generate a unique serial number for each item in the quantity
    for (let i = 0; i < quantity; i++) {
      let serialNumber = "";
      if (category.toLowerCase() === "hardware") {
        serialNumber = "H" + Math.floor(10000 + Math.random() * 90000).toString();
      } else if (category.toLowerCase() === "software") {
        serialNumber = "S" + Math.floor(10000 + Math.random() * 90000).toString();
      }

      // Ensure serial number is unique
      let existingProduct = await Product.findOne({ serialNumber });
      while (existingProduct) {
        serialNumber =
          category.toLowerCase() === "hardware"
            ? "H" + Math.floor(10000 + Math.random() * 90000).toString()
            : "S" + Math.floor(10000 + Math.random() * 90000).toString();

        existingProduct = await Product.findOne({ serialNumber });
      }

      // Create an item object and push it to the array
      itemsToSave.push({
        category,
        name,
        purchaseDate,
        warrantyPeriod,
        price,
        serialNumber, // Unique serial number for each item
        itemType, // Save the itemType
      });
    }

    // Insert all items into the database at once
    const savedItems = await Product.insertMany(itemsToSave);

    // Update total assets
    await updateTotalAssets();

    // Respond with a success message
    res.status(201).json({ message: "Products added successfully!", success: true, savedItems });
  } catch (err) {
    console.error("Error saving products:", err);
    res.status(500).json({ message: "Error saving product.", success: false });
  }
});

// Route to get total assets
app.get("/total-assets", async (req, res) => {
  try {
    const totalAssets = await TotalAssets.findOne();
    res.status(200).json(totalAssets);
  } catch (err) {
    console.error("Error fetching total assets:", err);
    res.status(500).json({ message: "Error fetching total assets." });
  }
});

// Route to add employee
app.post("/add-employee", async (req, res) => {
  const { employeeName, joiningDate, employeeAge, department, workingStatus } = req.body;

  // Function to capitalize the first letter of each word
  const capitalizeWords = (string) => {
    return string
      .split(' ')  // Split the string into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Capitalize first letter of each word
      .join(' ');  // Join the words back together
  };

  // Function to format department based on input
  const formatDepartment = (department) => {
    // Check if the department is all uppercase
    if (department === department.toUpperCase()) {
      return department;  // Keep it as is if it's uppercase
    }
    // Otherwise, capitalize the first letter of each word
    return capitalizeWords(department);
  };

  try {
    const newEmployee = new Employee({
      employeeName: capitalizeWords(employeeName),  // Capitalize the first letter of each word in employeeName
      joiningDate,
      employeeAge,
      department: formatDepartment(department),  // Apply the department formatting function
      workingStatus,
    });

    await newEmployee.save();
    res.status(201).json({ success: true, message: "Employee added successfully!" });
  } catch (error) {
    console.error("Error saving employee:", error);
    res.status(500).json({ success: false, message: "Error saving employee." });
  }
});


// Route to get all employees
app.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find();

    // Function to format the date as dd/mm/yyyy
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0'); // Get day and pad with 0 if necessary
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Get month and pad with 0 if necessary
      const year = d.getFullYear();
      return `${day}/${month}/${year}`; // Return formatted date
    };

    // Format the joiningDate to show as dd/mm/yyyy
    const formattedEmployees = employees.map((employee) => {
      const formattedDate = formatDate(employee.joiningDate);
      return {
        ...employee.toObject(),
        joiningDate: formattedDate, // Replace joiningDate with formatted date
      };
    });

    res.status(200).json(formattedEmployees);
  } catch (error) {
    console.error("Error fetching employees data:", error);
    res.status(500).send("Error fetching employees data");
  }
});

// Route to handle employee deletion
app.delete("/delete-employee/:id", async (req, res) => {
  try {
    const employeeId = req.params.id;
    const result = await Employee.findByIdAndDelete(employeeId);

    if (result) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Employee not found." });
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ success: false, message: "An error occurred while deleting the employee." });
  }
});


app.post("/assign-product", async (req, res) => {
  const { category, employeeName, serialNumber, assignDate, returnDate } = req.body;

  try {
    // Check if the serial number exists in the 'products' collection
    const productExists = await Product.findOne({ serialNumber });

    // If the serial number is not found in the products collection, return an error
    if (!productExists) {
      return res.status(400).json({ success: false, message: "Serial number not found in the products collection." });
    }

    // If the serial number exists, create a new assignment record in the 'assigned' collection
    const newAssignment = new AssignedProduct({
      category,
      employeeName,
      serialNumber,
      assignDate,
      returnDate,
    });

    // Save the assignment to the 'assigned' collection
    await newAssignment.save();

    res.status(200).json({ success: true, message: "Product assigned successfully!" });
  } catch (error) {
    console.error("Error assigning product:", error);
    res.status(500).json({ success: false, message: "Error assigning product." });
  }
});


// Route to search employees by name dynamically
app.get("/search-employees", async (req, res) => {
  try {
    const searchQuery = req.query.search || ''; // Get the search term from the query string
    console.log('Search query:', searchQuery); // Log the search query

    const employees = await Employee.find({
      employeeName: { $regex: searchQuery, $options: 'i' } // Case-insensitive search on employeeName
    }).select('employeeName'); // Only select the 'employeeName' field

    console.log('Matching employees:', employees); // Log the matching employees
    res.status(200).json(employees); // Send matching employees as the response
  } catch (error) {
    console.error("Error fetching employee data:", error);
    res.status(500).send("Error fetching employee data");
  }
});


//send view
app.get('/api/items', async (req, res) => {
  try {
    // Fetch all products from the "products" collection
    const items = await Product.find();

    // Log the fetched items to debug
    console.log('Fetched items:', items);

    // Use Promise.all to fetch the assignment data for each product in parallel
    const processedItems = await Promise.all(items.map(async (item) => {
      // Fetch the assignment for each product based on its serial number
      const assignment = await AssignedProduct.findOne({ serialNumber: item.serialNumber });

      // Log the assignment data to debug
      console.log(`Assignment for serialNumber ${item.serialNumber}:`, assignment);

      // Function to format date as DD/MM/YYYY
      const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Determine the status based on whether assignment exists
      const status = assignment ? 'In Use' : 'Available'; // If assigned, status is 'In Use', otherwise 'Available'

      // Return the product data along with assignment details and status
      return {
        ...item.toObject(), // Include all product fields
        assignedTo: assignment && assignment.employeeName ? assignment.employeeName : 'N/A', // Add employee name (or 'N/A' if not assigned)
        assignDate: assignment && assignment.assignDate ? formatDate(assignment.assignDate) : 'N/A', // Format assign date as DD/MM/YYYY
        returnDate: assignment && assignment.returnDate ? formatDate(assignment.returnDate) : 'N/A', // Format return date as DD/MM/YYYY
        purchaseDate: formatDate(item.purchaseDate), // Format purchase date as DD/MM/YYYY
        status: status, // Include the status field
      };
    }));

    // Respond with the combined product and assignment data
    res.status(200).json(processedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal Server Error' }); // Send a 500 error if there is an issue
  }
});

// Route to fetch all damage records
app.get('/damages', async (req, res) => {
  try {
    // Fetch all damage records from the "damages" collection
    const damages = await Damage.find();

    // Log the fetched damages for debugging
    console.log('Fetched damages:', damages);

    // Send the fetched damages as a response
    res.json(damages);
  } catch (error) {
    console.error('Error fetching damages:', error);
    res.status(500).json({ message: 'Error fetching damage data' });
  }
});



app.post('/add-damage', async (req, res) => {
  const { damageName, damageDate, damageSerialNo, damageType, warrantyStatus } = req.body;

  if (!damageName || !damageDate || !damageSerialNo || !damageType || !warrantyStatus) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    // Check if the serial number exists in the Product schema
    const product = await Product.findOne({ serialNumber: damageSerialNo });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Serial number does not exist in the Product database.',
      });
    }

    // Create a new damage record
    const newDamage = new Damage({
      damageName,
      damageDate,
      damageSerialNo,
      damageType,
      warrantyStatus,
    });

    // Save the record to MongoDB
    await newDamage.save();
    console.log('Damage record saved to DB:', newDamage);

    res.json({ success: true, message: 'Damage item added successfully!' });
  } catch (err) {
    console.error('Error adding damage record:', err);
    res.status(500).json({ success: false, message: 'Error processing the request' });
  }
});




// Route to delete a damage record by ID
app.delete("/delete-damage/:id", async (req, res) => {
  const damageId = req.params.id;

  try {
    const result = await Damage.findByIdAndDelete(damageId);
    if (!result) {
      return res.status(404).json({ success: false, message: "Damage record not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting damage item:", error);
    res.status(500).json({ success: false, message: "Error deleting damage item" });
  }
});

// Modularized deletion route
app.delete('/delete-item', async (req, res) => {
  const { serialNumber } = req.body;

  if (!serialNumber) {
    return res.status(400).json({ error: 'Serial number is required.' });
  }

  try {
    // Archive item details to ItemHistory
    await archiveItemHistory(serialNumber);

    // Delete the item from Product collection
    await deleteFromProduct(serialNumber);

    // Archive and delete related damage records
    await handleDamageRecord(serialNumber);

    // Cleanup AssignedProduct collection
    await deleteAssignedItemsIfNotExistInProduct();

    res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    console.error('Error during item deletion:', error);
    res.status(500).json({ error: 'Failed to delete item. Please try again.' });
  }
});

// Function to archive item details in ItemHistory
const archiveItemHistory = async (serialNumber) => {
  try {
    const itemToArchive = await Product.findOne({ serialNumber });

    if (!itemToArchive) {
      throw new Error('Item not found in Product collection.');
    }

    const itemHistory = new ItemHistory({
      category: itemToArchive.category,
      name: itemToArchive.name,
      purchaseDate: itemToArchive.purchaseDate,
      warrantyPeriod: itemToArchive.warrantyPeriod,
      price: itemToArchive.price,
      serialNumber: itemToArchive.serialNumber,
      itemType: itemToArchive.itemType,
    });

    await itemHistory.save();
    console.log(`Item archived in ItemHistory: ${serialNumber}`);
  } catch (error) {
    console.error(`Error archiving item history: ${error.message}`);
    throw error;
  }
};

// Function to delete the item from Product collection
const deleteFromProduct = async (serialNumber) => {
  try {
    const deletedItem = await Product.findOneAndDelete({ serialNumber });

    if (!deletedItem) {
      throw new Error('Item not found in Product collection.');
    }

    console.log(`Item deleted from Product collection: ${serialNumber}`);
  } catch (error) {
    console.error(`Error deleting item from Product: ${error.message}`);
    throw error;
  }
};

// Function to handle Damage records
const handleDamageRecord = async (serialNumber) => {
  try {
    const damageRecord = await Damage.findOne({ damageSerialNo: serialNumber });

    if (damageRecord) {
      const damageHistory = new DamageHistory({
        damageName: damageRecord.damageName,
        damageDate: damageRecord.damageDate,
        damageSerialNo: damageRecord.damageSerialNo,
        damageType: damageRecord.damageType,
        warrantyStatus: damageRecord.warrantyStatus,
      });

      await damageHistory.save();
      console.log(`Damage record archived for serial number: ${serialNumber}`);

      await Damage.findOneAndDelete({ damageSerialNo: serialNumber });
      console.log(`Damage record deleted for serial number: ${serialNumber}`);
    }
  } catch (error) {
    console.error(`Error handling damage record: ${error.message}`);
    throw error;
  }
};

// Function to delete assigned items from the "assigned" collection if they don't exist in "products"
const deleteAssignedItemsIfNotExistInProduct = async () => {
  try {
    const assignedItems = await AssignedProduct.find();

    for (const assignedItem of assignedItems) {
      const { serialNumber } = assignedItem;

      const productExists = await Product.findOne({ serialNumber });

      if (!productExists) {
        const deletedAssignedItem = await AssignedProduct.findOneAndDelete({ serialNumber });

        if (deletedAssignedItem) {
          console.log(`Item with serial number ${serialNumber} deleted from AssignedProduct collection.`);
        } else {
          console.log(`No item found with serial number ${serialNumber} in AssignedProduct collection.`);
        }
      }
    }
  } catch (error) {
    console.error('Error during deletion of assigned items:', error);
    throw error;
  }
};


// API endpoint to fetch assigned items
app.get('/api/assigned-items', async (req, res) => {
  try {
    const assignedItems = await AssignedProduct.find();

    const result = await Promise.all(
      assignedItems.map(async (item) => {
        const product = await Product.findOne(
          { serialNumber: item.serialNumber }, 
          { name: 1, _id: 0 } // Fetch only the name field
        );

        // Format dates to dd/mm/yyyy
        const formatDate = (date) => {
          if (!date) return null; // Handle null or undefined dates
          const d = new Date(date);
          return d.toLocaleDateString('en-GB'); // 'en-GB' ensures dd/mm/yyyy format
        };

        return {
          category: item.category,
          employeeName: item.employeeName,
          serialNumber: item.serialNumber,
          assignDate: formatDate(item.assignDate),
          returnDate: formatDate(item.returnDate),
          productName: product ? product.name : 'Unknown', // Fallback for missing products
        };
      })
    );

    res.json(result); // Send the final result
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});



app.post('/api/return-item', async (req, res) => {
  const { serialNumber, returnDate } = req.body;

  if (!serialNumber || !returnDate) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  try {
    // Find and delete the item from the "assigned" collection
    const assignedProduct = await AssignedProduct.findOneAndDelete({ serialNumber });

    if (!assignedProduct) {
      return res.status(404).json({ success: false, message: 'Item not found in the assigned collection.' });
    }

    // Save the return details in the "returnhistory" collection
    const returnHistory = new ReturnHistory({
      serialNumber: assignedProduct.serialNumber,
      employeeName: assignedProduct.employeeName,
      returnDate,
    });

    await returnHistory.save();

    res.status(200).json({ success: true, message: 'Item successfully returned and recorded in return history.' });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
