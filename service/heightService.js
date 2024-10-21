const db = require("../config/database");

const parseHeight = (height) => {
  const [feet, inches] = height.split(/[\';]/).map(Number);
  return feet + (inches || 0) / 12; // Handle cases where inches might be undefined
};

exports.calculateHeight = async (stateId, minimum_height) => {
  if (minimum_height === "any") {
    return 100;
  }

  const columns = [
    "4'11", "5'", "5'1", "5'2", "5'3", "5'4", "5'5", "5'6", "5'7", "5'8", "5'9",
    "5'10", "5'11", "6'0", "6'1", "6'2", "6'3"
  ];

  const minParsedHeight = parseHeight(minimum_height);
  const sumColumns = columns
    .filter((col) => parseHeight(col) >= minParsedHeight)
    .map((col) => `\`${col}\``); // Use backticks for column names

  if (sumColumns.length === 0) {
    console.warn(`No columns found for minimum height: ${minimum_height}`);
    return 0; // Or handle this case as appropriate for your application
  }

  const query = `
    SELECT total, (${sumColumns.join(" + ")}) AS total_sum
    FROM height
    WHERE state_id = ?
  `;

  console.log("Executing query height:", query);
  console.log("State ID:", stateId);

  try {
    const result = await db.query(query, [stateId]);
    console.log("Query result height:", result);

    if (result[0] && result[0][0] && typeof result[0][0].total === 'number' && typeof result[0][0].total_sum === 'number') {
      const { total: total_population, total_sum } = result[0][0];

      if (total_population === 0) {
        console.warn(`Total population is zero for state ID: ${stateId}`);
        return 0;
      }

      const percentage = (total_sum / total_population) * 100;
      console.log(`Height percentage for state ${stateId}: ${percentage}%`);
      return percentage;
    } else {
      console.error("Unexpected result structure:", result);
      throw new Error("Failed to calculate height percentage");
    }
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
};