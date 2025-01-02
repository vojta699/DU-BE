module.exports = {
    type: "object",
    properties: {
      status: { type: "string", enum: ["SOLVED", "UNSOLVED"] },
    },
    required: ["status"],
    additionalProperties: false,
  };