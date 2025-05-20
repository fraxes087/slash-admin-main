// src/router/index.tsx
import DashboardLayout from "@/layouts/dashboard";
import PageError from "@/pages/sys/error/PageError";
import Login from "@/pages/sys/login/Login";
import ProtectedRoute from "@/router/components/protected-route";
import { usePermissionRoutes } from "@/router/hooks";
import { ERROR_ROUTE } from "@/router/routes/error-routes";
import { useUserInfo, useUserToken } from "@/store/userStore";
import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, type RouteObject, createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { AppRouteObject } from "#/router";

const { VITE_APP_HOMEPAGE: HOMEPAGE = "/dashboard/workbench" } = import.meta.env;

export default function Router() {
	const userToken = useUserToken();
	const userInfo = useUserInfo();
	const isAuthenticated = !!userToken?.accessToken;
	const [isLoading, setIsLoading] = useState(true);

	// Obtenemos las rutas basadas en permisos
	const permissionRoutes = usePermissionRoutes() || [];

	// Logs para depuración
	useEffect(() => {
		console.log("Router - Current path:", window.location.hash);
		console.log("Router - isAuthenticated:", isAuthenticated);
		console.log("Router - userInfo:", userInfo);
		console.log("Router - permissionRoutes count:", permissionRoutes.length);
		console.log("Router - permissionRoutes:", permissionRoutes);

		setIsLoading(false);
	}, [isAuthenticated, userInfo, permissionRoutes]);

	// Mientras se carga, mostrar un indicador
	if (isLoading) {
		return <div>Loading application...</div>;
	}

	// Ruta pública (login)
	const PUBLIC_ROUTE: AppRouteObject = {
		path: "/login",
		element: (
			<ErrorBoundary FallbackComponent={PageError}>
				<Login />
			</ErrorBoundary>
		),
	};

	// Ruta protegida para el dashboard
	const PROTECTED_ROUTE: AppRouteObject = {
		path: "/",
		element: (
			<ErrorBoundary FallbackComponent={PageError}>
				<Suspense fallback={<div>Loading dashboard...</div>}>
					<ProtectedRoute>
						<DashboardLayout />
					</ProtectedRoute>
				</Suspense>
			</ErrorBoundary>
		),
		children: [
			{
				index: true,
				element: <Navigate to={HOMEPAGE} replace />,
			},
			// Ruta de prueba estática que siempre debería funcionar
			{
				path: "test-dashboard",
				element: (
					<div>
						<h1>Test Dashboard</h1>
						<p>This is a static route for testing purposes.</p>
						<p>User is authenticated: {isAuthenticated ? "Yes" : "No"}</p>
						<p>User info: {JSON.stringify(userInfo)}</p>
						{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
						{/* biome-ignore lint/suspicious/noAssignInExpressions: <explanation> */}
						<button onClick={() => (window.location.href = "/#/dashboard/workbench")}>Go to Workbench</button>
					</div>
				),
			},
			// Asegurarnos de que siempre hay una ruta para workbench
			{
				path: "dashboard/workbench",
				element: <div>Dashboard Workbench (Default)</div>,
			},
			// Agregar el resto de las rutas basadas en permisos
			...permissionRoutes,
		],
	};

	// Ruta para errores 404
	const NO_MATCHED_ROUTE: AppRouteObject = {
		path: "*",
		element: <Navigate to="/404" replace />,
	};

	// Combinar todas las rutas
	const routes = [PUBLIC_ROUTE, PROTECTED_ROUTE, ...ERROR_ROUTE, NO_MATCHED_ROUTE] as RouteObject[];

	// Crear el router
	const router = createHashRouter(routes);

	return (
		<ErrorBoundary
			FallbackComponent={PageError}
			onError={(error) => {
				console.error("Router error:", error);
			}}
		>
			<RouterProvider router={router} />
		</ErrorBoundary>
	);
}
