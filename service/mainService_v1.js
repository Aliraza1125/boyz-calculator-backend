const db = require("../config/database");

const mainService = async () => {
  const input = {
    age: [21, 30],
    state_id: ["331734ad-8a31-49a6-ae55-e39356dc4120"],
    state_name: ["Punjab"],
    religion: ["Hindu", "Sikh"],
    minimum_height: "5'6",
    minimum_income: 950000,
    exclude_obese: true,
    exclude_married: true,
  };
  const stateId = input.state_id[0];
  const startAge = input.age[0];
  const endAge = input.age[1];
  const excludeObese = input.exclude_obese;
  const excludeMarried = input.exclude_married;

  const basePopulation = await calculateBase(stateId, startAge, endAge);
  const religionPercentage = await calculateReligion(stateId, input.religion);
  const heightPercentage = await calculateHeight(stateId, input.minimum_height);
  const incomePercentage = await calculateIncome(
    stateId,
    input.minimum_income,
    startAge,
    endAge
  );

  const maritialPercentage = await calculateMaritialPercentage(stateId, endAge);

  const fitnessPercentage = await calculteFitnessPercntage(
    stateId,
    startAge,
    endAge
  );

  const religion = (basePopulation * religionPercentage) / 100;

  const height = (religion * heightPercentage) / 100;

  let standardResult = (height * incomePercentage) / 100;

  if (excludeObese) {
    standardResult = (standardResult * fitnessPercentage) / 100;
  }

  if (excludeMarried) {
    standardResult = (standardResult * maritialPercentage) / 100;
  }

  const finalResult = (standardResult / basePopulation) * 100;

  return `${finalResult.toFixed(2)}%`;
};

const calculateBase = async (stateId, startAge, endAge) => {
  try {
    const columns = [];
    for (let age = startAge; age <= endAge; age++) {
      columns.push(`"${age}"`);
    }

    const query = `
      SELECT (${columns.join(" + ")}) AS total_sum
      FROM age
      WHERE state_id = ?
    `;

    const result = await db.query(query, [stateId]);
    return result[0][0]["total_sum"];
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
};

const calculateReligion = async (stateId, religions) => {
  try {
    const query = `
      SELECT (${religions.join(" + ")}) AS total_sum
      FROM religion
      WHERE state_id = ?
    `;

    const result = await db.query(query, [stateId]);
    return result[0][0]["total_sum"];
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
};

// Function to convert height string to a numeric value
function parseHeight(height) {
  const [feet, inches] = height.split(/[\';]/).map(Number);
  return feet + inches / 12; // Convert to a decimal number
}

const calculateHeight = async (stateId, minimum_height) => {
  try {
    // Columns to consider
    const columns = [
      "4'11",
      "5'",
      "5'1",
      "5'2",
      "5'3",
      "5;4",
      "5'5",
      "5'6",
      "5'7",
      "5'8",
      "5'9",
      "5'10",
      "5'11",
      "6'0",
      "6'1",
      "6'2",
      "6'3",
    ];

    // Parse the minimum height
    const minParsedHeight = parseHeight(minimum_height);

    // Filter the columns that are greater than or equal to the specified height
    const sumColumns = columns
      .filter((col) => parseHeight(col.replace(";", "'")) >= minParsedHeight)
      .map((col) => `"${col}"`);

    const query = `
      SELECT total, (${sumColumns.join(" + ")}) AS total_sum
      FROM height
      WHERE state_id = ?
    `;

    const result = await db.query(query, [stateId]);

    const total_population = result[0][0]["total"];
    const total_sample = result[0][0]["total_sum"];
    return (total_sample / total_population) * 100;
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
};

const calculateIncome = async (stateId, minIncome, startAge, endAge) => {
  try {
    const ageColumns = [];

    if (startAge <= 21 && endAge >= 18) ageColumns.push('"18-21"');
    if (startAge <= 25 && endAge >= 22) ageColumns.push('"22-25"');
    if (startAge <= 29 && endAge >= 26) ageColumns.push('"26-29"');
    if (startAge <= 34 && endAge >= 30) ageColumns.push('"30-34"');
    if (startAge <= 44 && endAge >= 35) ageColumns.push('"35-44"');
    if (startAge <= 59 && endAge >= 45) ageColumns.push('"45-59"');
    if (endAge >= 60) ageColumns.push('"60(+)"');

    const selectedColumns = ageColumns.join(", ");

    const query = `
    SELECT 
      percentage, 
      ${selectedColumns}
    FROM income
    WHERE state_id = ?
  `;

    const result = await db.query(query, [stateId]);

    const data = result.rows;
    if (data.length === 0) {
      throw new Error("No data found for the given state ID");
    }

    const resul = getPercentageClasses(minIncome, data);

    return resul;
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
};

function getPercentageClass(minIncome, data) {
  const ageRanges = Object.keys(data[0]).filter((key) => key !== "percentage");
  const result = {};

  ageRanges.forEach((range) => {
    for (const entry of data) {
      const income = parseFloat(entry[range].replace("<", ""));
      if (minIncome >= income) {
        result[range] = entry.percentage;
        break;
      }
    }
  });

  return result;
}

function getPercentageClasses(minIncome, dataArr) {
  const result = {};

  const inputObj = getPercentageClass(minIncome, dataArr);

  for (const [ageRange, percentage] of Object.entries(inputObj)) {
    const percentageValue = parseFloat(percentage);
    const currentIndex = dataArr.findIndex(
      (item) => parseFloat(item.percentage) === percentageValue
    );

    if (currentIndex === -1) continue;

    const currentClass = dataArr[currentIndex];
    const aboveClass = dataArr[currentIndex - 1];

    result[ageRange] = {
      current: {
        percentage: currentClass.percentage,
        value: currentClass[ageRange],
      },
    };

    if (aboveClass && percentageValue !== 1) {
      result[ageRange].above = {
        percentage: aboveClass.percentage,
        value: aboveClass[ageRange],
      };
    }
  }

  const res = calculatePrecisePercentage(result, minIncome);

  return res;
}

function calculatePrecisePercentage(data, minIncome) {
  const result = {};

  for (const ageRange in data) {
    const currentPercentage = parseFloat(
      data[ageRange].current.percentage.replace("%", "")
    );
    const currentValue = parseFloat(data[ageRange].current.value);

    if (data[ageRange].above) {
      const abovePercentage = parseFloat(
        data[ageRange].above.percentage.replace("%", "")
      );
      const aboveValue = parseFloat(data[ageRange].above.value);

      const percentageGap = abovePercentage - currentPercentage;
      const valueGap = aboveValue - currentValue;

      // Calculate how much value corresponds to 0.1% of the percentage gap
      const stepValue = valueGap / (percentageGap / 0.1);

      // Determine the precise percentage for the minimum income
      if (minIncome >= currentValue && minIncome <= aboveValue) {
        const precisePercentage =
          currentPercentage + ((minIncome - currentValue) / stepValue) * 0.1;
        result[ageRange] = `${precisePercentage.toFixed(1)}%`;
      } else {
        result[ageRange] = `${currentPercentage}%`; // or handle it as per your logic
      }
    } else {
      result[ageRange] = `${currentPercentage}%`;
    }
  }

  const percentages = Object.values(result).map((value) =>
    parseFloat(value.replace("%", ""))
  );

  // Calculate the total of all percentages
  const total = percentages.reduce((sum, percentage) => sum + percentage, 0);

  // Calculate the average
  const average = total / percentages.length;

  return average;
}

const calculateMaritialPercentage = async (stateId, endAge) => {
  try {
    let ageRange = "";
    if (endAge > 45) {
      ageRange = "45+";
    } else if (endAge > 43) {
      ageRange = "44-45";
    } else if (endAge > 41) {
      ageRange = "42-43";
    } else if (endAge > 39) {
      ageRange = "40-41";
    } else if (endAge > 37) {
      ageRange = "38-39";
    } else if (endAge > 35) {
      ageRange = "36-37";
    } else if (endAge > 33) {
      ageRange = "34-35";
    } else if (endAge > 31) {
      ageRange = "32-33";
    } else if (endAge > 29) {
      ageRange = "30-31";
    } else if (endAge > 27) {
      ageRange = "28-29";
    } else if (endAge > 25) {
      ageRange = "26-27";
    } else if (endAge > 23) {
      ageRange = "24-25";
    } else if (endAge > 21) {
      ageRange = "22-23";
    } else if (endAge == 21) {
      ageRange = "21";
    } else if (endAge == 20) {
      ageRange = "20";
    } else if (endAge > 17) {
      ageRange = "18-19";
    } else {
      return "Invalid Age Range";
    }

    const query = `
    SELECT 
      "${ageRange}"
    FROM marital_status
    WHERE state_id = ?
  `;

    const result = await db.query(query, [stateId]);

    const data = result.rows;
    if (data.length === 0) {
      throw new Error("No data found for the given state ID");
    }

    return data[0][ageRange];
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
};

const calculteFitnessPercntage = async (stateId, startAge, endAge) => {
  try {
    const query = `
    SELECT AVG(fit) as averageFit
    FROM fitness
    WHERE age BETWEEN ${startAge} AND ${endAge}
  `;

    const result = await db.query(query);
    return result[0][0].averagefit;
  } catch (error) {
    console.error("Error executing query", error.stack);
    throw error;
  }
};

module.exports = mainService;
