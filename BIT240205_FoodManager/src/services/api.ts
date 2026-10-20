
const BASE_URL =
  "https://6ad71569f71f154ac487b967.mockapi.io/api/v1";

export interface DishImage {
  BIT240205_ImageUrl: string;
  BIT240205_IsThumbnail: boolean;
}

export interface DishCategory {
  id: string;
  BIT240205_Id?: string;
  BIT240205_Name: string;
  BIT240205_Description: string;
}

export interface Dish {
  id: string;
  BIT240205_Id?: string;
  BIT240205_Name: string;
  BIT240205_Price: number;
  BIT240205_PreparationTime: number;
  BIT240205_IsAvailable: boolean;
  BIT240205_Description: string;
  BIT240205_DishCategoryId: string;
  BIT240205_DishImage: DishImage[];
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${BASE_URL}/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const dishApi = {
  getAll: () => request<Dish[]>("BIT240205_Dish"),

  getById: (id: string) =>
    request<Dish>(`BIT240205_Dish/${id}`),

  create: (data: Omit<Dish, "id">) =>
    request<Dish>("BIT240205_Dish", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Dish>) =>
    request<Dish>(`BIT240205_Dish/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<Dish>(`BIT240205_Dish/${id}`, {
      method: "DELETE",
    }),
};

export const categoryApi = {
  getAll: () =>
    request<DishCategory[]>("BIT240205_DishCategory"),
};
