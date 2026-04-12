import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Layout } from "./components/Layout";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { useSeed } from "./hooks/use-seed";

// Lazy page imports
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const TasksPage = lazy(() => import("./pages/Tasks"));
const AnalyticsPage = lazy(() => import("./pages/Analytics"));

// Page wrapper with suspense
function PageShell({ children }: { children: React.ReactNode }) {
  useSeed();
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        {children}
      </Suspense>
    </Layout>
  );
}

const rootRoute = createRootRoute();

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageShell>
      <DashboardPage />
    </PageShell>
  ),
});

const dashboardRoute2 = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <PageShell>
      <DashboardPage />
    </PageShell>
  ),
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks",
  component: () => (
    <PageShell>
      <TasksPage />
    </PageShell>
  ),
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: () => (
    <PageShell>
      <AnalyticsPage />
    </PageShell>
  ),
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dashboardRoute2,
  tasksRoute,
  analyticsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
