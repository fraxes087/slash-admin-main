// src/store/userStore.ts
import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import userService, { type SignInReq, type SignInRes } from "@/api/services/userService";

import { toast } from "sonner";
import type { UserInfo, UserToken } from "#/entity";
import { StorageEnum } from "#/enum";

const { VITE_APP_HOMEPAGE: HOMEPAGE } = import.meta.env;

type UserStore = {
	userInfo: Partial<UserInfo>;
	userToken: UserToken;
	// 使用 actions 命名空间来存放所有的 action
	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		setUserToken: (token: UserToken) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			userToken: {},
			actions: {
				setUserInfo: (userInfo) => {
					console.log("Setting user info:", userInfo);
					// Asegurarse de que el objeto userInfo tenga la propiedad permissions
					set({
						userInfo: {
							...userInfo,
							permissions: userInfo?.permissions || [], // Proporcionar un valor por defecto
						},
					});
				},
				setUserToken: (userToken) => {
					console.log("Setting user token:", userToken);
					set({ userToken: userToken || {} });
				},
				clearUserInfoAndToken() {
					console.log("Clearing user info and token");
					set({ userInfo: {}, userToken: {} });
				},
			},
		}),
		{
			name: "userStore", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
			}),
		},
	),
);

export const useUserStoreSelector = () => useUserStore();
export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);

// Arreglamos esta función para manejar el caso cuando permissions es undefined
export const useUserPermission = () => {
	const userInfo = useUserStore((state) => state.userInfo);

	// Usando useMemo para evitar recálculos innecesarios
	return useMemo(() => {
		console.log("User permissions:", userInfo?.permissions);
		return userInfo?.permissions || [];
	}, [userInfo]);
};

export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
	const navigate = useNavigate();
	const { setUserToken, setUserInfo } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: (data: SignInReq) => {
			console.log("Attempting signin with:", data);
			return userService.signin(data);
		},
		onSuccess: (response: SignInRes) => {
			console.log("Login success response:", response);

			// biome-ignore lint/complexity/useOptionalChain: <explanation>
			if (response && response.user) {
				const { user, accessToken, refreshToken } = response;

				if (user && accessToken) {
					// Sólo incluir las propiedades que están en la interfaz
					setUserToken({
						accessToken,
						refreshToken,
						// No incluir expiresIn aquí
					});
					setUserInfo(user);
					navigate(HOMEPAGE, { replace: true });
					toast.success("Sign in success!");
				} else {
					console.error("Invalid response structure:", response);
					toast.error("Invalid response format from server", {
						position: "top-center",
					});
				}
			} else {
				console.error("Invalid login response:", response);
				toast.error("Invalid server response", {
					position: "top-center",
				});
			}
		},
		onError: (error: any) => {
			console.error("Sign in error:", error);
			toast.error(error?.message || "Sign in failed", {
				position: "top-center",
			});
		},
	});

	const signIn = async (data: SignInReq) => {
		try {
			await signInMutation.mutateAsync(data);
		} catch (err) {
			console.error("Sign in error caught:", err);
		}
	};

	return signIn;
};

export default useUserStore;
