const db = require("../config/database");

exports.calculateFitnessPercentage = async (startAge, endAge) => {
  const query = `
    SELECT age, fit
    FROM fitness
    WHERE age BETWEEN ? AND ?
  `;

  try {
    const result = await db.query(query, [startAge, endAge]);
    console.log("Query result:", result);

    if (result[0].length === 0) {
      throw new Error("No data found for the given age range");
    }

    let totalFitPercentage = 0;
    let count = 0;

    console.log(`Calculating fitness percentage for age range: ${startAge}-${endAge}`);
    console.log("Age | Fit %");
    console.log("------------");

    result[0].forEach(row => {
      totalFitPercentage += parseFloat(row.fit);
      count++;
      console.log(`${row.age.toString().padEnd(3)} | ${row.fit.toFixed(2).padStart(6)}%`);
    });

    const averageFitPercentage = count > 0 ? totalFitPercentage / count : 0;

    console.log("------------");
    console.log(`Total fit percentage: ${totalFitPercentage.toFixed(2)}%`);
    console.log(`Number of ages considered: ${count}`);
    console.log(`Average fit percentage: ${averageFitPercentage.toFixed(2)}%`);

    return averageFitPercentage;
  } catch (error) {
    console.error(`Error calculating fitness percentage: ${error.message}`);
    throw error;
  }
};