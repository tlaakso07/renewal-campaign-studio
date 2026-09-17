import { useEffect, useState } from "react";
import { useApp } from "./ui";

// Keep filter state in the URL so reload, detail links and browser Back retain it.
export function useRouteFilters(defaults: Record<string, string>) {
  const { path } = useApp();
  function read() {
    const query = new URLSearchParams(path.split("?")[1]);
    return Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [
        key,
        query.get(key) ?? value,
      ]),
    );
  }
  const [filters, update] = useState(read);
  useEffect(() => update(read()), [path]);
  function setFilters(value: Record<string, string>) {
    const next = Object.fromEntries(
      Object.entries(defaults).map(([key, fallback]) => [
        key,
        value[key] ?? fallback,
      ]),
    );
    update(next);
    const query = new URLSearchParams(
      Object.entries(next).filter(([, value]) => value),
    );
    history.replaceState(
      null,
      "",
      `#/${path.split("?")[0]}${query.size ? `?${query}` : ""}`,
    );
  }
  return [filters, setFilters] as const;
}

export const reportFilters = {
  start: "",
  end: "",
  currency: "",
  account: "",
  attribution: "",
};
