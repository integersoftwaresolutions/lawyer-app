import { ApiError } from "../helpers/apiError.js";

export function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(
      { body: req.body, query: req.query, params: req.params },
      { abortEarly: false, allowUnknown: true }
    );

    if (error) {
      throw new ApiError(400, "Validation error", error.details.map((d) => d.message));
    }

    req.validated = value;
    next();
  };
}
