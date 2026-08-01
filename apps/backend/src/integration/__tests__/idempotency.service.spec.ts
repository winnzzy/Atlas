import { IdempotencyService } from '../idempotency.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  beforeEach(() => {
    service = new IdempotencyService();
  });

  it('replays the cached response for duplicate requests', async () => {
    const handler = jest.fn().mockResolvedValue({ statusCode: 200, body: { ok: true } });

    const first = await service.execute({
      key: 'key-1',
      fingerprint: 'fingerprint-1',
      handler,
    });
    const second = await service.execute({
      key: 'key-1',
      fingerprint: 'fingerprint-1',
      handler,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.response.body).toEqual({ ok: true });
  });

  it('rejects reuse of the same key with a different fingerprint', async () => {
    await service.execute({
      key: 'key-2',
      fingerprint: 'fingerprint-a',
      handler: async () => ({ statusCode: 200, body: { ok: true } }),
    });

    await expect(
      service.execute({
        key: 'key-2',
        fingerprint: 'fingerprint-b',
        handler: async () => ({ statusCode: 200, body: { ok: true } }),
      }),
    ).rejects.toThrow('Idempotency key was reused with a different request fingerprint');
  });
});