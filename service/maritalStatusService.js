const db = require("../config/database");

const ageRanges = [
  "18-19", "20", "21", "22-23", "24-25", "26-27", "28-29", "30-31", "32-33",
  "34-35", "36-37", "38-39", "40-41", "42-43", "44-45", "45+"
];

exports.calculateMaritalPercentage = async (stateId, startAge, endAge) => {
  const query = `
    SELECT ${ageRanges.map(range => `\`${range}\``).join(', ')}
    FROM marital_status
    WHERE state_id = ?
  `;

  try {
    const result = await db.query(query, [stateId]);
    console.log("Query result:", result);

    if (result[0].length === 0) {
      throw new Error("No data found for the given state ID");
    }

    const data = result[0][0];
    console.log("Marital status data:", data);

    let totalUnmarried = 0;
    let count = 0;

    console.log(`Calculating for age range: ${startAge}-${endAge}`);
    console.log("Age | Married % | Unmarried %");
    console.log("------------------------------");

    for (let age = startAge; age <= endAge; age++) {
      let marriedPercentage;
      let range;

      if (age <= 19) range = "18-19";
      else if (age <= 21) range = age.toString();
      else if (age <= 45) {
        const rangeStart = Math.floor(age / 2) * 2;
        range = `${rangeStart}-${rangeStart + 1}`;
      }
      else range = "45+";

      marriedPercentage = parseFloat(data[range]);
      const unmarriedPercentage = 100 - marriedPercentage;

      totalUnmarried += unmarriedPercentage;
      count++;

      console.log(`${age.toString().padEnd(3)} | ${marriedPercentage.toFixed(2).padStart(8)}% | ${unmarriedPercentage.toFixed(2).padStart(10)}%`);
    }

    console.log("------------------------------");
    console.log(`Total unmarried percentage: ${totalUnmarried.toFixed(2)}%`);
    console.log(`Number of ages considered: ${count}`);

    const averageUnmarried = count > 0 ? totalUnmarried / count : 0;
    console.log(`Average percentage of unmarried men: ${averageUnmarried.toFixed(2)}%`);

    return averageUnmarried;
  } catch (error) {
    console.error(`Error calculating marital percentage: ${error.message}`);
    throw error;
  }
};