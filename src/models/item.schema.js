module.exports = {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 30 },
      status: { type: "string", enum: ["SOLVED", "USOLVED"], default: "USOLVED" },
    },
    required: ["name"],
    additionalProperties: false,
  };