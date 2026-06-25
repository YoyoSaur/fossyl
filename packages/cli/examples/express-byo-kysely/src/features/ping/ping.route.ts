import { createRouter } from '@fossyl/core';
import * as pingService from './ping.service';
import { authenticator } from '../../auth';
import {
  createPingValidator,
  updatePingValidator,
  listPingQueryValidator,
} from './ping.validators';

// The router path is a compile-time constraint (not a runtime prefix).
// Endpoint paths are always full paths.
const router = createRouter('/api');

export const listPings = router
  .createEndpoint('/api/ping')
  .query(listPingQueryValidator)
  .paginate({ defaultPageSize: 20, maxPageSize: 100 })
  .get((params) => async () => {
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
  });

export const getPing = router
  .createEndpoint('/api/ping/:id')
  .get((params) => async () => {
    const ping = await pingService.getPing(params.url.id);
    return { typeName: 'Ping' as const, ...ping };
  });

export const getPingOrError = router
  .createEndpoint('/api/ping/:id/error-demo')
  .get((params) => async () => {
    const maybePing = await pingService.getPingOrError(params.url.id);
    return { typeName: 'Ping' as const, ...maybePing };
  });

export const createPing = router
  .createEndpoint('/api/ping')
  .authenticator(authenticator)
  .validator(createPingValidator)
  .post((auth) => (body) => async () => {
    const ping = await pingService.createPing(body.message, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const createPingBatch = router
  .createEndpoint('/api/ping/batch')
  .authenticator(authenticator)
  .validator(createPingValidator)
  .post((auth) => (body) => async () => {
    const ping = await pingService.createPing(body.message, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const renamePing = router
  .createEndpoint('/api/ping/:id/rename')
  .validator(updatePingValidator)
  .put((params) => (body) => async () => {
    const ping = await pingService.renamePing(params.url.id, body);
    return { typeName: 'Ping' as const, ...ping };
  });

export const updatePing = router
  .createEndpoint('/api/ping/:id')
  .authenticator(authenticator)
  .validator(updatePingValidator)
  .put((params) => (auth) => (body) => async () => {
    const ping = await pingService.updatePing(params.url.id, body, auth.userId);
    return { typeName: 'Ping' as const, ...ping };
  });

export const deletePing = router
  .createEndpoint('/api/ping/:id')
  .authenticator(authenticator)
  .delete((params) => (auth) => async () => {
    await pingService.deletePing(params.url.id, auth.userId);
    return { typeName: 'DeleteResult' as const, id: params.url.id, deleted: true };
  });

export const pingStats = router
  .createEndpoint('/api/ping/stats')
  .authenticator(authenticator)
  .get((auth) => async () => {
    const stats = await pingService.getPingStats(auth.userId);
    return { typeName: 'PingStats' as const, ...stats };
  });

export default [
  listPings,
  getPing,
  getPingOrError,
  createPing,
  createPingBatch,
  renamePing,
  updatePing,
  deletePing,
  pingStats,
];
