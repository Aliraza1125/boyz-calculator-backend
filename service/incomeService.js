const db = require("../config/database");

exports.calculateIncome = async (stateId, minimumIncome, startAge, endAge) => {
  console.log(`Starting income calculation for state ID: ${stateId}, minimum income: ${minimumIncome}, age range: ${startAge}-${endAge}`);
  
  try {
    const ageCategories = [
      { range: '18-21', start: 18, end: 21 },
      { range: '22-25', start: 22, end: 25 },
      { range: '26-29', start: 26, end: 29 },
      { range: '30-34', start: 30, end: 34 },
      { range: '35-44', start: 35, end: 44 },
      { range: '45-59', start: 45, end: 59 },
      { range: '60+', start: 60, end: Infinity }
    ];

    const relevantCategories = ageCategories.filter(cat => 
      (startAge <= cat.end && endAge >= cat.start)
    );

    console.log(`Relevant age categories: ${relevantCategories.map(cat => cat.range).join(', ')}`);

    if (relevantCategories.length === 1) {
      // Case 1: Single age category
      return await calculateSingleCategory(stateId, minimumIncome, relevantCategories[0].range);
    } else {
      // Case 2: Multiple age categories
      return await calculateMultipleCategories(stateId, minimumIncome, startAge, endAge, relevantCategories);
    }
    
  } catch (error) {
    console.error(`Error calculating income percentage: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    throw error;
  }
};

async function calculateSingleCategory(stateId, minimumIncome, ageRangeColumn) {
  const query = `
    SELECT percentage, \`${ageRangeColumn}\` as income
    FROM income
    WHERE state_id = ?
    ORDER BY CAST(REPLACE(REPLACE(income, '<', ''), '>', '') AS UNSIGNED) ASC
  `;

  console.log(`Executing SQL query: ${query}`);
  console.log(`Query parameters: [${stateId}]`);

  const [rows] = await db.query(query, [stateId]);

  console.log(`Query result: ${JSON.stringify(rows, null, 2)}`);

  if (rows.length === 0) {
    throw new Error(`No income data found for state ID: ${stateId}`);
  }

  let selectedPercentage = null;
  let previousIncome = null;
  let previousPercentage = null;

  for (const row of rows) {
    let income = row.income;
    console.log("income", income);
    
    const isLessThan = income.startsWith('<');
    const isGreaterThan = income.endsWith('<');
    
    income = income.replace(/[<>]/g, '');
    const numericIncome = parseFloat(income);

    if (isLessThan) {
      if (minimumIncome < numericIncome) {
        console.log(`Match found: ${row.percentage}% earn less than ${numericIncome}`);
        selectedPercentage = 100;
        break;
      }
    } else if (isGreaterThan) {
      if (minimumIncome > numericIncome) {
        console.log(`Match found: ${row.percentage}% earn ${numericIncome} or more`);
        selectedPercentage = parseFloat(row.percentage);
        break;
      }
    } else {
      if (previousIncome !== null && minimumIncome >= previousIncome && minimumIncome < numericIncome) {
        console.log(`Match found: ${previousPercentage}% for income between ${previousIncome} and ${numericIncome}`);
        selectedPercentage = parseFloat(previousPercentage);
        break;
      }
      previousIncome = numericIncome;
      previousPercentage = row.percentage;
    }
  }

  if (!selectedPercentage) {
    selectedPercentage = parseFloat(rows[rows.length - 1].percentage);
    console.log(`No exact match found. Using highest bracket: ${selectedPercentage}%`);
  }

  return selectedPercentage;
}

async function calculateMultipleCategories(stateId, minimumIncome, startAge, endAge, relevantCategories) {
  let totalYears = 0;
  let totalPercentage = 0;

  for (const category of relevantCategories) {
    const categoryStartAge = Math.max(startAge, category.start);
    const categoryEndAge = Math.min(endAge, category.end);
    const yearsInCategory = categoryEndAge - categoryStartAge + 1;

    const categoryPercentage = await calculateSingleCategory(stateId, minimumIncome, category.range);
    console.log("category percentage",categoryPercentage)

    console.log(`Category ${category.range}: ${categoryPercentage}% for ${yearsInCategory} years`);

    totalPercentage += categoryPercentage * yearsInCategory;
    totalYears += yearsInCategory;
  }

  const finalPercentage = totalPercentage / totalYears;
  console.log(`Final average percentage: ${finalPercentage.toFixed(2)}%`);

  return finalPercentage;
}