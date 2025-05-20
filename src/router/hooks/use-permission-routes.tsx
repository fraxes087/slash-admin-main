// src/router/hooks/use-permission-routes.tsx
import { Icon } from "@/components/icon";
import { CircleLoading } from "@/components/loading";
import { useUserInfo, useUserPermission } from "@/store/userStore";
import { flattenTrees } from "@/utils/tree";
import { Tag } from "antd";
import { isEmpty } from "ramda";
import { Suspense, lazy, useMemo } from "react";
import { Navigate, Outlet } from "react-router";
import type { Permission } from "#/entity";
import { BasicStatus, PermissionType } from "#/enum";
import type { AppRouteObject } from "#/router";
import { getRoutesFromModules } from "../utils";

// Definir un valor por defecto para ROUTE_MODE
const ROUTE_MODE = import.meta.env.VITE_APP_ROUTER_MODE || "permission";

const ENTRY_PATH = "/src/pages";
// Importar todos los archivos de las páginas
const PAGES = import.meta.glob("/src/pages/**/*.tsx");

// Función para cargar componentes dinámicamente desde la ruta
const loadComponentFromPath = (path: string) => {
	const fullPath = `${ENTRY_PATH}${path}`;
	if (!PAGES[fullPath]) {
		console.warn(`Path ${fullPath} not found in available pages`);
		return () => import("@/pages/sys/error/Page404");
	}
	return PAGES[fullPath];
};

/**
 * Construye la ruta completa atravesando desde el permiso actual hasta la raíz
 */
function buildCompleteRoute(
	permission: Permission,
	flattenedPermissions: Permission[],
	segments: string[] = [],
): string {
	// Añadir el segmento de ruta actual
	segments.unshift(permission.route);

	// Caso base: alcanzó el permiso raíz
	if (!permission.parentId) {
		return `/${segments.join("/")}`;
	}

	// Encontrar el padre y continuar la recursión
	const parent = flattenedPermissions.find((p) => p.id === permission.parentId);
	if (!parent) {
		console.warn(`Parent permission not found for ID: ${permission.parentId}`);
		return `/${segments.join("/")}`;
	}

	return buildCompleteRoute(parent, flattenedPermissions, segments);
}

// Componentes para rutas
function NewFeatureTag() {
	return (
		<Tag color="cyan" className="ml-2!">
			<div className="flex items-center gap-1">
				<Icon icon="solar:bell-bing-bold-duotone" size={12} />
				<span className="ms-1">NEW</span>
			</div>
		</Tag>
	);
}

// Componente de Fallback para rutas que fallan al cargar
function ComponentLoadError() {
	return (
		<div className="p-4">
			<h2 className="text-xl font-bold text-red-500 mb-2">Error al cargar el componente</h2>
			<p>El componente para esta ruta no pudo ser cargado. Por favor, verifica la configuración.</p>
		</div>
	);
}

// Transformadores de ruta
const createBaseRoute = (permission: Permission, completeRoute: string): AppRouteObject => {
	const { route, label, icon, order, hide, hideTab, status, frameSrc, newFeature } = permission;

	// Crear ruta base con metadatos
	const baseRoute: AppRouteObject = {
		path: route,
		meta: {
			label,
			key: completeRoute,
			hideMenu: !!hide,
			hideTab,
			disabled: status === BasicStatus.DISABLE,
		},
	};

	// Añadir propiedades adicionales
	if (order !== undefined) baseRoute.order = order;
	if (baseRoute.meta) {
		if (icon) baseRoute.meta.icon = icon;
		if (frameSrc) baseRoute.meta.frameSrc = frameSrc;
		if (newFeature) baseRoute.meta.suffix = <NewFeatureTag />;
	}

	return baseRoute;
};

// Crear ruta de tipo catálogo (con hijos)
const createCatalogueRoute = (permission: Permission, flattenedPermissions: Permission[]): AppRouteObject => {
	const baseRoute = createBaseRoute(permission, buildCompleteRoute(permission, flattenedPermissions));

	if (baseRoute.meta) {
		baseRoute.meta.hideTab = true;
	}

	const { parentId, children = [] } = permission;

	// Si es una ruta de nivel superior, añadir Outlet para renderizar hijos
	if (!parentId) {
		baseRoute.element = (
			<Suspense fallback={<CircleLoading />}>
				<Outlet />
			</Suspense>
		);
	}

	// Transformar hijos en rutas
	baseRoute.children = transformPermissionsToRoutes(children, flattenedPermissions);

	// Si tiene hijos, añadir redirección al primer hijo
	if (!isEmpty(children)) {
		baseRoute.children.unshift({
			index: true,
			element: <Navigate to={children[0].route} replace />,
		});
	}

	return baseRoute;
};

// Crear ruta de tipo menú (ruta final)
const createMenuRoute = (permission: Permission, flattenedPermissions: Permission[]): AppRouteObject => {
	const baseRoute = createBaseRoute(permission, buildCompleteRoute(permission, flattenedPermissions));

	if (permission.component) {
		try {
			// Cargar componente de forma perezosa
			const Element = lazy(loadComponentFromPath(permission.component) as any);

			// Si es un iframe, pasar el src como prop
			if (permission.frameSrc) {
				baseRoute.element = <Element src={permission.frameSrc} />;
			} else {
				baseRoute.element = (
					<Suspense fallback={<CircleLoading />}>
						<Element />
					</Suspense>
				);
			}
		} catch (error) {
			console.error(`Error loading component for route ${permission.route}:`, error);
			baseRoute.element = <ComponentLoadError />;
		}
	}

	return baseRoute;
};

// Función principal para transformar permisos en rutas
function transformPermissionsToRoutes(permissions: Permission[], flattenedPermissions: Permission[]): AppRouteObject[] {
	if (!permissions || permissions.length === 0) {
		console.log("No permissions to transform");
		return [];
	}

	try {
		return permissions.map((permission) => {
			// Mapear según el tipo de permiso
			if (permission.type === PermissionType.CATALOGUE) {
				return createCatalogueRoute(permission, flattenedPermissions);
			}
			return createMenuRoute(permission, flattenedPermissions);
		});
	} catch (error) {
		console.error("Error transforming permissions to routes:", error);
		return [];
	}
}

// Rutas por defecto para usar cuando no hay permisos
const DEFAULT_ROUTES: AppRouteObject[] = [
	{
		path: "dashboard/workbench",
		element: (
			<div className="p-4">
				<h1 className="text-2xl font-bold mb-4">Dashboard Workbench</h1>
				<p className="mb-2">Esta es una ruta por defecto cuando no hay permisos disponibles.</p>
				<div className="bg-blue-50 p-4 rounded border border-blue-200">
					<p className="text-blue-700">Si estás viendo esta página, podría ser por una de estas razones:</p>
					<ul className="list-disc ml-5 mt-2 text-blue-600">
						<li>El usuario no tiene permisos asignados</li>
						<li>Los permisos no se cargaron correctamente del backend</li>
						<li>Hay un problema al transformar los permisos en rutas</li>
					</ul>
				</div>
			</div>
		),
	},
	{
		path: "dashboard/analysis",
		element: (
			<div className="p-4">
				<h1 className="text-2xl font-bold mb-4">Dashboard Analysis</h1>
				<p>Esta es otra ruta por defecto para la sección de análisis.</p>
			</div>
		),
	},
];

// Hook principal para obtener rutas de permisos
export function usePermissionRoutes() {
	console.log("usePermissionRoutes - ROUTE_MODE:", ROUTE_MODE);

	// Si el modo es 'module', usar rutas basadas en módulos
	if (ROUTE_MODE === "module") {
		return getRoutesFromModules();
	}

	// Obtener permisos y info del usuario
	const permissions = useUserPermission();
	const userInfo = useUserInfo();

	return useMemo(() => {
		console.log("usePermissionRoutes - permissions:", permissions);
		console.log("usePermissionRoutes - userInfo:", userInfo);

		// Si no hay permisos, devolver rutas por defecto
		if (!permissions || permissions.length === 0) {
			console.log("No permissions found, returning default routes");
			return DEFAULT_ROUTES;
		}

		try {
			// Aplanar el árbol de permisos para facilitar la búsqueda de padres
			const flattenedPermissions = flattenTrees(permissions);

			// Transformar permisos en rutas
			const routes = transformPermissionsToRoutes(permissions, flattenedPermissions);
			console.log("Generated permission routes:", routes);

			// Verificar si ya existe una ruta de workbench
			const hasWorkbench = routes.some(
				(route) =>
					route.path === "dashboard/workbench" ||
					(route.path === "dashboard" && route.children && route.children.some((child) => child.path === "workbench")),
			);

			// Si no existe workbench, añadir ruta por defecto
			if (!hasWorkbench && routes.length > 0) {
				console.log("Adding default workbench route");
				routes.push(DEFAULT_ROUTES[0]);
			}

			return routes;
		} catch (error) {
			console.error("Error generating permission routes:", error);
			return DEFAULT_ROUTES;
		}
	}, [permissions, userInfo]);
}
