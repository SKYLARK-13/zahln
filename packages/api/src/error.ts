import type { Problem } from "./types";

export class ApiError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  detail?: string | null;

  constructor(problem: Problem) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.code = problem.code;
    this.status = problem.status;
    this.retryable = problem.retryable;
    this.detail = problem.detail;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
