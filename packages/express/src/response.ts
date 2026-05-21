import type { ResponseData } from '@fossyl/core';

type ApiResponse<T extends ResponseData> = {
  success: 'true';
  type: T['typeName'];
  data: T;
};

export function wrapResponse<T extends ResponseData>(data: T): ApiResponse<T> {
  return {
    success: 'true',
    type: data.typeName,
    data,
  };
}
