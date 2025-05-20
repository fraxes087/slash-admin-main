import PageError from "@/pages/sys/error/PageError";
import { useUserInfo, useUserToken } from "@/store/userStore";
// src/router/components/protected-route.tsx
import { /*useCallback,*/ useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useRouter } from "../hooks";

type Props = {
	children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
	const router = useRouter();
	const userToken = useUserToken();
	const userInfo = useUserInfo();
	const isAuthenticated = !!userToken?.accessToken;

	const currentPath = window.location.hash.replace("#", "") || "/";

	useEffect(() => {
		console.log("ProtectedRoute - Current path:", currentPath);
		console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
		console.log("ProtectedRoute - userInfo:", userInfo);

		if (!isAuthenticated && !currentPath.startsWith("/login")) {
			console.log("Not authenticated, redirecting to login");
			router.replace("/login");
		}
	}, [isAuthenticated, currentPath, router, userInfo]);

	// Solo renderizar los children si está autenticado o es una ruta pública
	if (
		!isAuthenticated &&
		!currentPath.startsWith("/login") &&
		!currentPath.startsWith("/404") &&
		!currentPath.startsWith("/403") &&
		!currentPath.startsWith("/500")
	) {
		console.log("Not rendering protected content because user is not authenticated");
		return null;
	}

	return (
		<ErrorBoundary
			FallbackComponent={PageError}
			onError={(error) => {
				console.error("Protected route error:", error);
			}}
		>
			{children}
		</ErrorBoundary>
	);
}
