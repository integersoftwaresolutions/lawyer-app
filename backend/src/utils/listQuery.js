import { getPagination } from "./pagination.js";

/**
 * Lightweight declarative list query parser for Mongoose.
 *
 * FilterSpec:
 *  - { key, path?, type: 'eq'|'in'|'bool'|'regex'|'gte'|'lte'|'gt'|'lt' }
 *  - regex: { key: 'q', paths: ['name','email'], type: 'regex' }
 *
 * SortSpec:
 *  - { key: 'sort', map: { newest: { createdAt: -1 }, name: { name: 1 } }, default: 'newest' }
 *  - or { default: { createdAt: -1 } }
 */

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyFilter(filter, spec, raw) {
  if (raw === undefined || raw === null || raw === "") return;

  const path = spec.path || spec.key;
  const type = spec.type || "eq";

  switch (type) {
    case "eq":
      filter[path] = raw;
      break;
    case "bool": {
      if (raw === true || raw === "true" || raw === "1") filter[path] = true;
      else if (raw === false || raw === "false" || raw === "0") filter[path] = false;
      break;
    }
    case "in": {
      const values = Array.isArray(raw)
        ? raw
        : String(raw)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      if (values.length) filter[path] = { $in: values };
      break;
    }
    case "regex": {
      const paths = spec.paths || [path];
      const rx = new RegExp(escapeRegex(raw), "i");
      if (paths.length === 1) filter[paths[0]] = rx;
      else filter.$or = paths.map((p) => ({ [p]: rx }));
      break;
    }
    case "gte":
    case "lte":
    case "gt":
    case "lt": {
      const op = `$${type}`;
      const num = Number(raw);
      const value = Number.isFinite(num) && String(raw).trim() !== "" ? num : raw;
      filter[path] = { ...(filter[path] || {}), [op]: value };
      break;
    }
    default:
      filter[path] = raw;
  }
}

function buildSort(query, sortSpec) {
  if (!sortSpec) return { createdAt: -1 };
  if (sortSpec.default && !sortSpec.map && typeof sortSpec.default === "object") {
    return sortSpec.default;
  }
  const key = sortSpec.key || "sort";
  const chosen = query[key] || sortSpec.default || "newest";
  const map = sortSpec.map || {};
  return map[chosen] || map[sortSpec.default] || { createdAt: -1 };
}

/**
 * @param {Record<string, any>} query - req.query
 * @param {{ filters?: object[], sort?: object, defaults?: object, baseFilter?: object }} spec
 * @returns {{ filter: object, sort: object, pagination: { page, limit, skip } }}
 */
export function parseListQuery(query = {}, spec = {}) {
  const pagination = getPagination(query, spec.defaults || {});
  const filter = { ...(spec.baseFilter || {}) };

  for (const f of spec.filters || []) {
    applyFilter(filter, f, query[f.key]);
  }

  const sort = buildSort(query, spec.sort);

  return { filter, sort, pagination };
}
