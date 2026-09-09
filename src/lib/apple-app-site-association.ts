const APP_ID = "4SAZ3T22NT.com.agor4.app";

const PATHS = [
  "/c/*/posts/*",
  "/c/*",
  "/u/*",
  "/settings",
  "/about",
  "/notifications",
  "/submit",
  "/communities",
  "/search",
  "/login",
  "/register",
  "/forgot-password",
  "/account",
  "/edit-profile",
] as const;

export const APPLE_APP_SITE_ASSOCIATION = {
  applinks: {
    apps: [] as string[],
    details: [
      {
        appID: APP_ID,
        appIDs: [APP_ID],
        paths: [...PATHS],
        components: PATHS.map((path) => ({ "/": path })),
      },
    ],
  },
};
