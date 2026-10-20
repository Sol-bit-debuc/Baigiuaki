import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { dishApi, categoryApi, Dish, DishCategory } from "../services/api";
type FilterState = {
  search: string;
  categoryId: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  priceSort: "default" | "asc" | "desc";
  timeSort: "default" | "asc" | "desc";
};

// Giữ bộ lọc khi chuyển màn hình trong phiên sử dụng
let savedFilters: FilterState = {
  search: "",
  categoryId: "all",
  status: "all",
  minPrice: "",
  maxPrice: "",
  priceSort: "default",
  timeSort: "default",
};

export default function DishListScreen() {
  const { language, setLanguage, t } = useLanguage();

  const translateCategory = (name: string) => {
    switch (name.trim().toLowerCase()) {
      case "main course":
        return t("mainCourse");
      case "fast food":
        return t("fastFood");
      case "drinks":
        return t("drinks");
      default:
        return name;
    }
  };

  const router = useRouter();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterState>(savedFilters);

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    savedFilters = filters;
  }, [filters]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dishData, categoryData] = await Promise.all([
        dishApi.getAll(),
        categoryApi.getAll(),
      ]);
      setDishes(dishData);
      setCategories(categoryData);
    } catch {
      setError("Failed to load data from MockAPI");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const priceError =
    (filters.minPrice !== "" &&
      (!Number.isFinite(Number(filters.minPrice)) ||
        Number(filters.minPrice) < 0)) ||
    (filters.maxPrice !== "" &&
      (!Number.isFinite(Number(filters.maxPrice)) ||
        Number(filters.maxPrice) < 0)) ||
    (filters.minPrice !== "" &&
      filters.maxPrice !== "" &&
      Number(filters.minPrice) > Number(filters.maxPrice));

  const filteredDishes = useMemo(() => {
    if (priceError) return [];

    let result = dishes.filter((dish) => {
      const name = dish.BIT240205_Name || "";
      const price = Number(dish.BIT240205_Price);

      const matchName = name
        .toLowerCase()
        .includes(filters.search.trim().toLowerCase());

      const matchCategory =
        filters.categoryId === "all" ||
        String(dish.BIT240205_DishCategoryId) === filters.categoryId;

      const matchStatus =
        filters.status === "all" ||
        (filters.status === "available" &&
          dish.BIT240205_IsAvailable === true) ||
        (filters.status === "unavailable" &&
          dish.BIT240205_IsAvailable === false);

      const matchMin =
        filters.minPrice === "" || price >= Number(filters.minPrice);

      const matchMax =
        filters.maxPrice === "" || price <= Number(filters.maxPrice);

      return matchName && matchCategory && matchStatus && matchMin && matchMax;
    });

    result = [...result];

    result.sort((a, b) => {
      const priceA = Number(a.BIT240205_Price);
      const priceB = Number(b.BIT240205_Price);

      const timeA = Number(a.BIT240205_PreparationTime);
      const timeB = Number(b.BIT240205_PreparationTime);

      // Ưu tiên sắp xếp theo giá trước
      if (filters.priceSort !== "default") {
        const priceCompare =
          filters.priceSort === "asc" ? priceA - priceB : priceB - priceA;

        if (priceCompare !== 0) return priceCompare;
      }

      // Nếu giá bằng nhau thì sắp xếp theo thời gian
      if (filters.timeSort !== "default") {
        return filters.timeSort === "asc" ? timeA - timeB : timeB - timeA;
      }

      return 0;
    });

    return result;
  }, [dishes, filters, priceError]);

  const getCategoryName = (id: string) => {
    const category = categories.find((c) => String(c.id) === String(id));
    return category?.BIT240205_Name || "Unknown";
  };

  const renderDish = ({ item }: { item: Dish }) => {
    const images = Array.isArray(item.BIT240205_DishImage)
      ? item.BIT240205_DishImage
      : [];

    const thumbnail =
      images.find((img) => img.BIT240205_IsThumbnail) || images[0];

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/dish/[id]",
            params: { id: item.id },
          })
        }
      >
        {thumbnail?.BIT240205_ImageUrl ? (
          <Image
            source={{ uri: thumbnail.BIT240205_ImageUrl }}
            style={styles.image}
          />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text>No Image</Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.dishName}>{item.BIT240205_Name}</Text>

          <Text style={styles.secondary}>
            {translateCategory(getCategoryName(item.BIT240205_DishCategoryId))}
          </Text>

          <Text style={styles.price}>
            {Number(item.BIT240205_Price).toLocaleString("vi-VN")} đ
          </Text>

          <Text style={styles.secondary}>
            ⏱ {item.BIT240205_PreparationTime} min •{" "}
            {Number(item.BIT240205_PreparationTime) <= 15
              ? t("quick")
              : t("regular")}
          </Text>

          <Text
            style={{
              color: item.BIT240205_IsAvailable ? "#16a34a" : "#dc2626",
              marginTop: 5,
              fontWeight: "600",
            }}
          >
            {item.BIT240205_IsAvailable ? t("available") : t("unavailable")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  const resetFilters = () => {
    setFilters({
      search: "",
      categoryId: "all",
      status: "all",
      minPrice: "",
      maxPrice: "",
      priceSort: "default",
      timeSort: "default",
    });
  };

  const FilterButton = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterButton, selected && styles.filterSelected]}
    >
      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("foodManager")}</Text>
            <Text style={styles.subtitle}>Student ID: BIT240205</Text>
          </View>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setLanguage(language === "en" ? "vi" : "en")}
          >
            <Text style={styles.languageText}>
              {language === "en" ? "🇬🇧 EN" : "🇻🇳 VI"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredDishes}
          keyExtractor={(item) => item.id}
          renderItem={renderDish}
          ListHeaderComponent={
            <>
              <TextInput
                style={styles.input}
                placeholder={t("search")}
                value={filters.search}
                onChangeText={(v) => setFilter("search", v)}
              />

              <Text style={styles.label}>{t("category")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
              >
                <FilterButton
                  label={t("all")}
                  selected={filters.categoryId === "all"}
                  onPress={() => setFilter("categoryId", "all")}
                />
                {categories.map((category) => (
                  <FilterButton
                    key={category.id}
                    label={translateCategory(category.BIT240205_Name)}
                    selected={filters.categoryId === String(category.id)}
                    onPress={() => setFilter("categoryId", String(category.id))}
                  />
                ))}
              </ScrollView>

              <Text style={styles.label}>{t("status")}</Text>
              <View style={styles.wrap}>
                {[
                  { value: "all", label: t("all") },
                  { value: "available", label: t("available") },
                  { value: "unavailable", label: t("unavailable") },
                ].map((option) => (
                  <FilterButton
                    key={option.value}
                    label={option.label}
                    selected={filters.status === option.value}
                    onPress={() => setFilter("status", option.value)}
                  />
                ))}
              </View>

              <Text style={styles.label}>{t("priceRange")}</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder={t("minPrice")}
                  keyboardType="numeric"
                  value={filters.minPrice}
                  onChangeText={(v) => setFilter("minPrice", v)}
                />
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder={t("maxPrice")}
                  keyboardType="numeric"
                  value={filters.maxPrice}
                  onChangeText={(v) => setFilter("maxPrice", v)}
                />
              </View>

              {priceError && (
                <Text style={styles.error}>{t("invalidPriceRange")}</Text>
              )}

              <Text style={styles.label}>{t("sortBy")}</Text>

              <View style={styles.wrap}>
                <FilterButton
                  label={
                    filters.priceSort === "asc"
                      ? `${t("sortPrice")} ↑`
                      : filters.priceSort === "desc"
                        ? `${t("sortPrice")} ↓`
                        : `${t("sortPrice")} ↕`
                  }
                  selected={filters.priceSort !== "default"}
                  onPress={() => {
                    const next =
                      filters.priceSort === "default"
                        ? "asc"
                        : filters.priceSort === "asc"
                          ? "desc"
                          : "default";

                    setFilter("priceSort", next);
                  }}
                />

                <FilterButton
                  label={
                    filters.timeSort === "asc"
                      ? `${t("sortTime")} ↑`
                      : filters.timeSort === "desc"
                        ? `${t("sortTime")} ↓`
                        : `${t("sortTime")} ↕`
                  }
                  selected={filters.timeSort !== "default"}
                  onPress={() => {
                    const next =
                      filters.timeSort === "default"
                        ? "asc"
                        : filters.timeSort === "asc"
                          ? "desc"
                          : "default";

                    setFilter("timeSort", next);
                  }}
                />
              </View>

              <TouchableOpacity
                onPress={resetFilters}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>{t("clearFilters")}</Text>
              </TouchableOpacity>

              <View style={styles.listHeader}>
                <Text style={styles.heading}>
                  {t("dishList")} ({filteredDishes.length})
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => router.push("/dish/create")}
                >
                  <Text style={styles.addText}>+ {t("addDish")}</Text>
                </TouchableOpacity>
              </View>

              {error ? (
                <TouchableOpacity onPress={loadData}>
                  <Text style={styles.error}>{error} — Tap to retry</Text>
                </TouchableOpacity>
              ) : null}

              {loading && <ActivityIndicator size="large" color="#2563eb" />}
            </>
          }
          ListEmptyComponent={
            !loading && !error ? (
              <Text style={styles.empty}>
                {priceError
                  ? "Please correct the price range."
                  : "No dishes found."}
              </Text>
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 22,
  },
  title: {
    fontSize: 27,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    color: "#dbeafe",
    marginTop: 5,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 9,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  label: {
    fontWeight: "bold",
    color: "#334155",
    fontSize: 15,
    marginBottom: 10,
  },
  filterRow: {
    marginBottom: 18,
    flexGrow: 0,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 18,
  },
  filterButton: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 7,
    marginBottom: 5,
  },
  filterSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterText: {
    color: "#475569",
    fontSize: 13,
  },
  filterTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    gap: 10,
  },
  priceInput: {
    flex: 1,
    minWidth: 0,
  },
  resetButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  resetText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  addButton: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
  },
  addText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 11,
    marginBottom: 12,
    flexDirection: "row",
  },
  image: {
    width: 105,
    height: 105,
    borderRadius: 9,
  },
  noImage: {
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  dishName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0f172a",
  },
  secondary: {
    color: "#64748b",
    marginTop: 4,
    fontSize: 12,
  },
  price: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 5,
  },
  error: {
    color: "#dc2626",
    marginBottom: 15,
  },
  empty: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 25,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  languageButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  languageText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 13,
  },
});
