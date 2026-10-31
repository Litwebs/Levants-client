import { afterEach, expect, test, vi } from "vitest";
import api, { ApiError } from "@/api/client";
import { portalSubscriptionsApi } from "@/api/portalSubscriptions";

afterEach(() => vi.restoreAllMocks());

test("a transient subscription-list failure recovers without an empty result", async () => {
  const subscriptions = [{ _id: "sub_paid", status: "active" }];
  const get = vi.spyOn(api, "get")
    .mockRejectedValueOnce(new ApiError("Service temporarily unavailable", 503))
    .mockResolvedValueOnce({ success: true, data: { subscriptions, meta: { page: 1, pageSize: 100, total: 1 } } });

  const result = await portalSubscriptionsApi.list({ page: 1, pageSize: 100 });

  expect(get).toHaveBeenCalledTimes(2);
  expect(result.data?.subscriptions).toEqual(subscriptions);
});

test("an incomplete successful response is retried instead of shown as zero subscriptions", async () => {
  const get = vi.spyOn(api, "get")
    .mockResolvedValueOnce({ success: true, data: {} })
    .mockResolvedValueOnce({ success: true, data: { subscriptions: [], meta: { page: 1, pageSize: 100, total: 0 } } });

  const result = await portalSubscriptionsApi.list({ page: 1, pageSize: 100 });

  expect(get).toHaveBeenCalledTimes(2);
  expect(result.data?.subscriptions).toEqual([]);
});

test("an authorization failure is surfaced without repeated requests", async () => {
  const get = vi.spyOn(api, "get").mockRejectedValue(new ApiError("Please sign in", 401));

  await expect(portalSubscriptionsApi.list()).rejects.toMatchObject({ status: 401 });
  expect(get).toHaveBeenCalledTimes(1);
});
