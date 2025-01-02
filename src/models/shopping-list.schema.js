const itemSchema = require("./item.schema");
const memberSchema = require("./member.schema");

module.exports = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 3, maxLength: 30 }
  },
  required: ["name"],
  additionalProperties: false,
};