const db = require("../config/database");

exports.calculateBase = async (stateId, startAge, endAge) => {
  const columns = Array.from(
    { length: endAge - startAge + 1 },
    (_, i) => `\`${startAge + i}\``  // Use backticks instead of double quotes
  );
  console.log("state id:", stateId);  // Log the columns for debugging

  const query = `
    SELECT (${columns.join(" + ")}) AS total_sum
    FROM age
    WHERE state_id = ?
  `;
  console.log("Query:", query);  // Log the query for debugging

  const result = await db.query(query, [stateId]);
  console.log("Result:", result);  // Log the full result for debugging

  if (result[0] && result[0][0] && result[0][0].total_sum !== null) {
    console.log("Total sum:", result[0][0].total_sum);
    return result[0][0].total_sum;
  } else {
    console.error("Unexpected result structure:", result);
    throw new Error("Failed to calculate base population");
  }
};
