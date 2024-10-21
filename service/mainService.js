const basePopulationService = require("./basePopulationService");
const religionService = require("./religionService");
const heightService = require("./heightService");
const incomeService = require("./incomeService");
const maritalStatusService = require("./maritalStatusService");
const fitnessService = require("./fitnessService");
const { stateService } = require("./stateService");

exports.mainService = async (input) => {
  try {
    let {
      state_id: stateIds,
      age: [startAge, endAge],
      religion,
      minimum_height,
      minimum_income,
      exclude_obese,
      exclude_married,
    } = input;

    if (stateIds[0] === "any") {
      stateIds = await stateService();
    }

    let totalResult = 0;
    let totalPopulation = 0;
    let states = [];

    for (const stateId of stateIds) {
      const promises = [
        basePopulationService.calculateBase(stateId, startAge, endAge),
        religionService.calculateReligion(stateId, religion),
        heightService.calculateHeight(stateId, minimum_height),
        incomeService.calculateIncome(stateId, minimum_income, startAge, endAge),
      ];

      if (exclude_married) {
        promises.push(maritalStatusService.calculateMaritalPercentage(stateId, startAge, endAge));
      }
      if (exclude_obese) {
        promises.push(fitnessService.calculateFitnessPercentage(startAge, endAge));
      }

      const results = await Promise.all(promises);

      const [basePopulation, religionPercentage, heightPercentage, incomePercentage, ...optionalResults] = results;

      console.log("base population", basePopulation);

      let result =
        basePopulation *
        (religionPercentage / 100) *
        (heightPercentage / 100) *
        (incomePercentage / 100);

      console.log("exclude_married:", exclude_married, "exclude_obese:", exclude_obese);

      if (exclude_obese && optionalResults.length > 0) {
        const fitnessPercentage = exclude_married ? optionalResults[1] : optionalResults[0];
        result *= fitnessPercentage / 100;
      }

      if (exclude_married && optionalResults.length > 0) {
        const maritalPercentage = optionalResults[0];
        result *= maritalPercentage / 100;
      }

      const stateResult = { base: basePopulation, result: result };
      states.push(stateResult);
      console.log("result for state", stateId, result);

      totalResult += result;
      totalPopulation += basePopulation;
    }

    console.log("states", states);

    const finalPercentage = (totalResult / totalPopulation) * 100;
    const finalResult = {
      totalPopulation: totalPopulation,
      finalPercentage: `${finalPercentage.toFixed(4)}`,
    };

    console.log(finalResult);
    return finalResult;
  } catch (error) {
    console.error(error);
    return "Error";
  }
};