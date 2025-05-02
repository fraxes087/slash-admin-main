// // src/api/services/authService.ts
// import { type LoginParams, type User } from "../../types/user";
// import { supabase } from "./supabaseClient";

// export const authService = {
// 	async login(params: LoginParams) {
// 		const { username, password } = params;

// 		// Autenticación con Supabase (email como username)
// 		const { data, error } = await supabase.auth.signInWithPassword({
// 			email: username,
// 			password: password,
// 		});

// 		if (error) throw error;

// 		// Obtener datos adicionales del usuario
// 		const { data: userData, error: userError } = await supabase
// 			.from("usuarios")
// 			.select("*")
// 			.eq("auth_id", data.user.id)
// 			.single();

// 		if (userError) throw userError;

// 		return {
// 			token: data.session.access_token,
// 			user: {
// 				id: userData.id,
// 				username: userData.username,
// 				email: data.user.email,
// 				nombre: userData.nombre,
// 			},
// 		};
// 	},

// 	async getUserProducts() {
// 		// Obtener productos asociados al usuario
// 		const {
// 			data: { user },
// 		} = await supabase.auth.getUser();

// 		if (!user) throw new Error("No autenticado");

// 		const { data, error } = await supabase
// 			.from("usuario_productos")
// 			.select(`
//         producto_id,
//         productos (
//           id,
//           nombre,
//           descripcion,
//           estado
//         )
//       `)
// 			.eq("usuario_id", user.id);

// 		if (error) throw error;

// 		// Transformar datos a formato esperado
// 		return data.map((item) => item.productos);
// 	},

// 	async getConsumoApi1(productoId: number) {
// 		// Verificar acceso al producto
// 		const {
// 			data: { user },
// 		} = await supabase.auth.getUser();

// 		if (!user) throw new Error("No autenticado");

// 		// Obtener datos de consumo
// 		const { data: consumos, error } = await supabase
// 			.from("consumos")
// 			.select("*")
// 			.eq("usuario_id", user.id)
// 			.eq("producto_id", productoId);

// 		if (error) throw error;

// 		// Calcular datos adicionales
// 		const total = consumos.reduce((acc, curr) => acc + curr.cantidad, 0);

// 		const ahora = new Date();
// 		const ultimoMes = consumos
// 			.filter((c) => {
// 				const fecha = new Date(c.fecha);
// 				return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
// 			})
// 			.reduce((acc, curr) => acc + curr.cantidad, 0);

// 		return {
// 			producto_id: productoId,
// 			consumos,
// 			datos_adicionales: {
// 				total,
// 				ultimo_mes: ultimoMes,
// 			},
// 		};
// 	},

// 	// Implementar métodos similares para API2, API3 y API4
// 	async getConsumoApi2(productoId: number) {
// 		// Similar a getConsumoApi1
// 	},

// 	async getConsumoApi3(productoId: number) {
// 		// Similar a getConsumoApi1
// 	},

// 	async getConsumoApi4(productoId: number) {
// 		// Similar a getConsumoApi1
// 	},
// };
