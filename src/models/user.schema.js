module.exports = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 3, maxLength: 30 },
    userName: {
      type: "string",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    },
    password: { type: "string", minLength: 6, maxLength: 50 },
    isAdmin: { type: "boolean", default: false },
  },
  required: ["name", "userName", "password"],
  additionalProperties: false,
};