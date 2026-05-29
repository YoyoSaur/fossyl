export interface CreatePingBody { message: string; }
export interface UpdatePingBody { message?: string; }
export interface ListPingQuery { search?: string; }

export const createPingValidator = (data: unknown): CreatePingBody => {
  return data as CreatePingBody;
};

export const updatePingValidator = (data: unknown): UpdatePingBody => {
  return data as UpdatePingBody;
};

export const listPingQueryValidator = (data: unknown): ListPingQuery => {
  const parsed = data as Record<string, unknown>;
  return {
    search: typeof parsed.search === 'string' ? parsed.search : undefined,
  };
};
