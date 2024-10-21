const db = require("../config/database");

exports.stateService = async () => {
  const query = `
    SELECT id
    FROM state
    ORDER BY name ASC;
  `;
  const result = await db.query(query);
  return result[0].map((row) => row.id);
};
