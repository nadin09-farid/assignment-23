/**
 * Every cache key in the app goes through here. Centralizing this means:
 * (1) no two features accidentally collide on the same key shape, and
 * (2) the wildcard patterns used for invalidation are guaranteed to match
 *     the exact keys that were written, since they come from the same code.
 */
export const CacheKeys = {
  productList: (querySignature: string) =>
    `cache::product::list::${querySignature}`,
  productListPattern: () => 'cache::product::list::*',
  productById: (id: string) => `cache::product::${id}`,

  categoryList: () => 'cache::category::list',
  categoryById: (id: string) => `cache::category::${id}`,

  brandList: () => 'cache::brand::list',
  brandById: (id: string) => `cache::brand::${id}`,
};
