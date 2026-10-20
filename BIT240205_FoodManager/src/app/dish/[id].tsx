
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { dishApi, categoryApi, Dish, DishCategory } from "../../services/api";

export default function DishDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [dish, setDish] = useState<Dish | null>(null);
  const [category, setCategory] = useState<DishCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!id) {
      setError("Invalid dish ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [dishData, categories] = await Promise.all([
        dishApi.getById(id),
        categoryApi.getAll(),
      ]);

      setDish(dishData);

      const found = categories.find(
        (c) => String(c.id) ===
          String(dishData.BIT240205_DishCategoryId)
      );

      setCategory(found || null);
    } catch {
      setError("Dish not found or failed to load.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const deleteDish = async () => {
    if (!dish || deleting) return;

    try {
      setDeleting(true);
      await dishApi.delete(dish.id);
      router.replace("/");
    } catch {
      setError("Failed to delete dish. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (typeof window !== "undefined") {
      if (window.confirm("Are you sure you want to delete this dish?")) {
        deleteDish();
      }
    } else {
      Alert.alert(
        "Delete Dish",
        "Are you sure you want to delete this dish?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: deleteDish,
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error && !dish) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.link}>Back to list</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!dish) return null;

  const images = Array.isArray(dish.BIT240205_DishImage)
    ? dish.BIT240205_DishImage
    : [];

  const sortedImages = [...images].sort(
    (a, b) =>
      Number(b.BIT240205_IsThumbnail) -
      Number(a.BIT240205_IsThumbnail)
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.link}>← Back to Dish List</Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {dish.BIT240205_Name}
        </Text>

        {sortedImages.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
          >
            {sortedImages.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img.BIT240205_ImageUrl }}
                style={styles.image}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImage}>
            <Text>No images available</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.price}>
            {Number(dish.BIT240205_Price).toLocaleString("vi-VN")} đ
          </Text>

          <Text style={styles.label}>Category</Text>
          <Text style={styles.value}>
            {category?.BIT240205_Name || "Unknown"}
          </Text>

          <Text style={styles.label}>Preparation Time</Text>
          <Text style={styles.value}>
            {dish.BIT240205_PreparationTime} minutes •{" "}
            {Number(dish.BIT240205_PreparationTime) <= 15
              ? "Quick"
              : "Regular"}
          </Text>

          <Text style={styles.label}>Status</Text>
          <Text
            style={{
              color: dish.BIT240205_IsAvailable
                ? "#16a34a"
                : "#dc2626",
              fontWeight: "bold",
              marginBottom: 12,
            }}
          >
            {dish.BIT240205_IsAvailable
              ? "Available"
              : "Unavailable"}
          </Text>

          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>
            {dish.BIT240205_Description || "No description"}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              router.push({
                pathname: "/dish/edit/[id]" as any,
                params: { id: dish.id },
              })
            }
          >
            <Text style={styles.buttonText}>Edit Dish</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={confirmDelete}
            disabled={deleting}
          >
            <Text style={styles.buttonText}>
              {deleting ? "Deleting..." : "Delete Dish"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    width: "100%",
    maxWidth: 850,
    alignSelf: "center",
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0f172a",
  },
  gallery: {
    marginBottom: 20,
  },
  image: {
    width: 270,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#e2e8f0",
  },
  noImage: {
    height: 160,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 5,
  },
  value: {
    fontSize: 17,
    color: "#0f172a",
    marginBottom: 18,
  },
  price: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  error: {
    color: "#dc2626",
    textAlign: "center",
    marginVertical: 15,
  },
});
