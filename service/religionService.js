const db = require("../config/database");

exports.calculateReligion = async (stateId, religions) => {
  let columns;

  if (religions[0] === "any") {
    // Using a predefined list of religions instead of fetching from INFORMATION_SCHEMA
    // This is more efficient and avoids potential security issues
    columns = ["hindu", "muslim", "christian", "sikh", "buddh", "others"];
  } else {
    // Validate that all provided religions are in the allowed list
    const allowedReligions = ["hindu", "muslim", "christian", "sikh", "buddh", "others"];
    columns = religions.filter(religion => allowedReligions.includes(religion.toLowerCase()));
    
    if (columns.length === 0) {
      throw new Error("No valid religions provided");
    }
  }

  // Construct the sum query
  const query = `
    SELECT (${columns.map(c => `\`${c}\``).join(" + ")}) AS total_sum
    FROM religion
    WHERE state_id = ?
  `;

  console.log("Executing query:", query);
  console.log("State ID:", stateId);

  try {
    const result = await db.query(query, [stateId]);
    console.log("Query result:", result);

    if (result[0] && result[0][0] && typeof result[0][0].total_sum === 'number') {
      return result[0][0].total_sum;
    } else {
      console.error("Unexpected result structure:", result);
      throw new Error("Failed to calculate religion percentage");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};