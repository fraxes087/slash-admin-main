// src/api/apiClient.ts
import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from "axios";

import { t } from "@/locales/i18n";
import userStore from "@/store/userStore";

import { toast } from "sonner";
// import type { Result } from "#/api";
import { ResultEnum } from "#/enum";

// Crear instancia de axios
const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_APP_BASE_API,
	timeout: 50000,
	headers: { "Content-Type": "application/json;charset=utf-8" },
});

// Interceptor de solicitud
axiosInstance.interceptors.request.use(
	(config) => {
		// Obtener el token del store
		const userToken = userStore.getState().userToken;
		if (userToken?.accessToken) {
			config.headers.Authorization = `Bearer ${userToken.accessToken}`;
		} else {
			// Si no hay token, eliminar el header
			config.headers.Authorization = undefined;
		}
		console.log("Request config:", config);
		return config;
	},
	(error) => {
		console.error("Request error:", error);
		return Promise.reject(error);
	},
);

// Interceptor de respuesta
axiosInstance.interceptors.response.use(
	(res: AxiosResponse) => {
		// Log para depuración
		console.log("Response received:", res);

		// En caso de respuestas sin estructura data/status, devolver directamente la respuesta
		if (!res.data || typeof res.data !== "object" || !("status" in res.data)) {
			console.log("Response has no standard structure, returning directly");
			return res.data;
		}

		const { status, data, message } = res.data;

		// Si hay status y es SUCCESS, devolver los datos
		if (status === ResultEnum.SUCCESS) {
			console.log("Successful response with status:", status);
			return data;
		}

		// Si llegamos aquí, hay un error en la respuesta
		console.error("API error response:", res.data);
		throw new Error(message || t("sys.api.apiRequestFailed"));
	},
	(error: AxiosError) => {
		console.error("Response error:", error);
		const { response, message } = error || {};

		// Mensaje de error para mostrar
		const errMsg = (response?.data as { message?: string })?.message || message || t("sys.api.errorMessage");

		// Mostrar error al usuario
		toast.error(errMsg, {
			position: "top-center",
		});

		// Manejar errores de autenticación
		const status = response?.status;
		if (status === 401) {
			userStore.getState().actions.clearUserInfoAndToken();
		}

		return Promise.reject(error);
	},
);

class APIClient {
	get<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request({ ...config, method: "GET" });
	}

	post<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request({ ...config, method: "POST" });
	}

	put<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request({ ...config, method: "PUT" });
	}

	delete<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request({ ...config, method: "DELETE" });
	}

	request<T = any>(config: AxiosRequestConfig): Promise<T> {
		return new Promise((resolve, reject) => {
			axiosInstance
				.request(config)
				.then((res: any) => {
					resolve(res as T);
				})
				.catch((e: Error | AxiosError) => {
					console.error("API request failed:", e);
					reject(e);
				});
		});
	}
}

export default new APIClient();
