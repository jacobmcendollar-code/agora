import { mapSitePath } from "@/lib/routes";

export function redirectSystemPath({ path }: { path: string }) {
  try {
    return mapSitePath(path);
  } catch {
    return "/";
  }
}
