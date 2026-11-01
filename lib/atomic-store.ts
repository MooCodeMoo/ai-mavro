import {
  get,
  put,
  del,
  BlobPreconditionFailedError,
  BlobPathnameMismatchError,
} from "@vercel/blob";
import { HttpError } from "./http";
export type Versioned<T> = { value: T; etag: string };
export type AtomicStore = {
  read<T>(path: string): Promise<Versioned<T> | null>;
  write<T>(path: string, value: T, etag?: string): Promise<void>;
  remove(path: string): Promise<void>;
};
export const privateBlobStore: AtomicStore = {
  async read<T>(path: string) {
    const result = await get(path, { access: "private", useCache: false });
    if (!result) return null;
    if (result.statusCode !== 200) throw new Error("Unexpected blob response");
    return {
      value: (await new Response(result.stream).json()) as T,
      etag: result.blob.etag,
    };
  },
  async write(path, value, etag) {
    await put(path, JSON.stringify(value), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: !!etag,
      ...(etag ? { ifMatch: etag } : {}),
      cacheControlMaxAge: 60,
    });
  },
  async remove(path) {
    await del(path);
  },
};
export async function mutate<T, R>(
  store: AtomicStore,
  path: string,
  initial: () => T,
  change: (value: T) => R,
): Promise<R> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const current = await store.read<T>(path),
      value = current?.value ?? initial();
    const result = change(value);
    try {
      await store.write(path, value, current?.etag);
      return result;
    } catch (error) {
      if (
        !(error instanceof BlobPreconditionFailedError) &&
        !(error instanceof BlobPathnameMismatchError) &&
        !(
          error instanceof Error &&
          /already exists|precondition|etag/i.test(error.message)
        )
      )
        throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, 10 + Math.random() * 40 * (attempt + 1)),
      );
    }
  }
  throw new HttpError(
    409,
    "Another colleague is updating this item. Please try again.",
  );
}
