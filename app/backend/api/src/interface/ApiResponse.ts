import type { Response } from "express";

export interface ApiResponse<T = unknown> {
    statusCode: number;
    status: string;
    message: string;
    data: T;
    error?:string
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    statusCode,
    status:"success",
    message,
    data,
  });
};

export const sendError = <T>(
  res: Response,
  statusCode: number,
  message: string,
  error?: any,
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    statusCode,
    status:"failed",
    message,
    error,
  });
};