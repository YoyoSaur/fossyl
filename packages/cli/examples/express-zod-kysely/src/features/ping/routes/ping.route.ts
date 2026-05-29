import { createRouter } from '@fossyl/core';
import type { PaginatedResponse } from '@fossyl/core';
import * as pingService from '../services/ping.service';
import { authenticator } from '../../../auth';
import {
  createPingValidator,
  updatePingValidator,
  listPingQueryValidator,
} from '../validators/ping.validators';

const router = createRouter('/ping');

export const listPings = router
  .createEndpoint('/ping')
  .query(listPingQueryValidator)
  .paginate({ defaultPageSize: 20, maxPageSize: 100 })
  .get(
    (params) => async () => {
      const result = await pingService.listPings(params.pagination, params.query);
      return {
        data: result.data.map((ping) => ({ typeName: 'Ping' as const, ...ping })),
          pagination: {
            page: params.pagination.page,
            pageSize: params.pagination.pageSize,
            hasMore: result.hasMore,
            total: result.total,
          },
        };
      }
  );

export const getPing = router
  .createEndpoint('/ping/:id')
  .get((params) => async () => {
    const ping = await pingService.getPing(params.url.id);
    return { typeName: 'Ping' as const, ...ping };
  });

export const createPing = router
  .createEndpoint('/ping')
  .authenticator(authenticator)
  .validator(createPingValidator)
  .post((auth) => (body) => async () => {
    const ping = await pingService.createPing(body.message, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const updatePing = router
  .createEndpoint('/ping/:id')
  .authenticator(authenticator)
  .validator(updatePingValidator)
  .put((params) => (auth) => (body) => async () => {
    const ping = await pingService.updatePing(params.url.id, body, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const deletePing = router
  .createEndpoint('/ping/:id')
  .authenticator(authenticator)
  .delete((params) => (auth) => async () => {
    await pingService.deletePing(params.url.id, auth.userId);
    return { typeName: 'DeleteResult' as const, id: params.url.id, deleted: true };
  });

export default [listPings, getPing, createPing, updatePing, deletePing];
