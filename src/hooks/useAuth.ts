// import { authService } from "@/api/services/authService";
// import { supabase } from "@/api/services/supabaseClient";
// import { useAppDispatch, useAppSelector } from "@/hooks/store";
// import { logout, setCredentials } from "@/store/slices/auth";
// import type { LoginParams } from "@/types/user";
// // src/hooks/useAuth.ts
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// export const useAuth = () => {
// 	const navigate = useNavigate();
// 	const dispatch = useAppDispatch();
// 	const { user, token, isLoggedIn } = useAppSelector((state) => state.auth);

// 	const login = async (params: LoginParams) => {
// 		try {
// 			const response = await authService.login(params);
// 			dispatch(
// 				setCredentials({
// 					user: response.user,
// 					token: response.token,
// 				}),
// 			);
// 			return response;
// 		} catch (error) {
// 			console.error("Error en login:", error);
// 			throw error;
// 		}
// 	};

// 	const handleLogout = async () => {
// 		await supabase.auth.signOut();
// 		dispatch(logout());
// 		navigate("/login");
// 	};

// 	// Verificar sesión actual al cargar
// 	useEffect(() => {
// 		const checkSession = async () => {
// 			const { data } = await supabase.auth.getSession();

// 			if (data?.session) {
// 				// Existe una sesión activa
// 				try {
// 					const { data: userData } = await supabase.auth.getUser();
// 					if (userData?.user) {
// 						const { data: userDetails } = await supabase
// 							.from("usuarios")
// 							.select("*")
// 							.eq("id", userData.user.id)
// 							.single();

// 						dispatch(
// 							setCredentials({
// 								user: {
// 									id: userDetails.id,
// 									username: userDetails.username,
// 									email: userData.user.email || "",
// 									nombre: userDetails.nombre,
// 								},
// 								token: data.session.access_token,
// 							}),
// 						);
// 					}
// 				} catch (error) {
// 					console.error("Error obteniendo datos del usuario", error);
// 				}
// 			}
// 		};

// 		checkSession();

// 		// Suscribirse a cambios de autenticación
// 		const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
// 			if (event === "SIGNED_IN" && session) {
// 				// Manejar inicio de sesión
// 				const { data: userData } = await supabase.auth.getUser();

// 				if (userData?.user) {
// 					const { data: userDetails } = await supabase.from("usuarios").select("*").eq("id", userData.user.id).single();

// 					dispatch(
// 						setCredentials({
// 							user: {
// 								id: userDetails.id,
// 								username: userDetails.username,
// 								email: userData.user.email || "",
// 								nombre: userDetails.nombre,
// 							},
// 							token: session.access_token,
// 						}),
// 					);
// 				}
// 			} else if (event === "SIGNED_OUT") {
// 				// Manejar cierre de sesión
// 				dispatch(logout());
// 			}
// 		});

// 		return () => {
// 			authListener?.subscription.unsubscribe();
// 		};
// 	}, [dispatch]);

// 	return {
// 		user,
// 		token,
// 		isLoggedIn,
// 		login,
// 		logout: handleLogout,
// 	};
// };
