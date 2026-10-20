import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  type Dish,
  type DishCategory,
  type DishImage,
  dishApi,
  categoryApi,
} from "../services/api";

type Props = { initialDish?: Dish };

const cleanUrl = (value: string) =>
  value.replace(/[\u00A0\u200B-\u200D\uFEFF]/g, "").trim();

function ImagePreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <View style={styles.imageFallback}>
        <Text style={styles.fallbackText}>Cannot load image</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: cleanUrl(url) }}
      style={styles.previewImage}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function DishForm({ initialDish }: Props) {
  const router = useRouter();
  const isEditing = !!initialDish;

  const [name, setName] = useState(initialDish?.BIT240205_Name ?? "");
  const [price, setPrice] = useState(
    String(initialDish?.BIT240205_Price ?? ""),
  );
  const [time, setTime] = useState(
    String(initialDish?.BIT240205_PreparationTime ?? ""),
  );
  const [description, setDescription] = useState(
    initialDish?.BIT240205_Description ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    String(initialDish?.BIT240205_DishCategoryId ?? ""),
  );
  const [available, setAvailable] = useState(
    initialDish?.BIT240205_IsAvailable ?? true,
  );
  const [images, setImages] = useState<DishImage[]>(() => {
    const source = initialDish?.BIT240205_DishImage;
    if (!Array.isArray(source)) return [];
    // Keep at most one thumbnail even if existing MockAPI data is inconsistent.
    const firstMain = source.findIndex(
      (item) => item.BIT240205_IsThumbnail === true,
    );
    return source.map((item, index) => ({
      BIT240205_ImageUrl: cleanUrl(String(item.BIT240205_ImageUrl ?? "")),
      BIT240205_IsThumbnail: index === (firstMain < 0 ? 0 : firstMain),
    }));
  });
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    categoryApi
      .getAll()
      .then(setCategories)
      .catch(() => setError("Cannot load categories. Please try again."));
  }, []);

  const addImage = () => {
    const url = cleanUrl(imageUrl);
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError("Please enter a valid http(s) image URL");
      return;
    }
    if (images.some((img) => cleanUrl(img.BIT240205_ImageUrl) === url)) {
      setError("This image has already been added");
      return;
    }
    setImages((previous) => [
      ...previous,
      { BIT240205_ImageUrl: url, BIT240205_IsThumbnail: previous.length === 0 },
    ]);
    setImageUrl("");
    setError("");
  };

  const setThumbnail = (selectedIndex: number) => {
    setImages((previous) =>
      previous.map((img, index) => ({
        ...img,
        BIT240205_IsThumbnail: index === selectedIndex,
      })),
    );
  };

  const removeImage = (selectedIndex: number) => {
    setImages((previous) => {
      const remaining = previous.filter((_, index) => index !== selectedIndex);
      if (
        remaining.length > 0 &&
        !remaining.some((img) => img.BIT240205_IsThumbnail)
      ) {
        return remaining.map((img, index) => ({
          ...img,
          BIT240205_IsThumbnail: index === 0,
        }));
      }
      return remaining;
    });
    setError("");
  };

  const saveDish = async () => {
    if (loading) return;
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericTime = Number(time);

    if (!cleanName) return setError("Dish name is required");
    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      return setError("Price must be greater than 0");
    }
    if (!time.trim() || !Number.isFinite(numericTime) || numericTime <= 0) {
      return setError("Preparation time must be greater than 0");
    }
    if (!categories.some((item) => String(item.id) === categoryId)) {
      return setError("Please select a valid category");
    }

    setLoading(true);
    setError("");
    try {
      const allDishes = await dishApi.getAll();
      const duplicate = allDishes.some(
        (dish) =>
          String(dish.id) !== String(initialDish?.id ?? "") &&
          String(dish.BIT240205_DishCategoryId) === categoryId &&
          String(dish.BIT240205_Name ?? "")
            .trim()
            .toLowerCase() === cleanName.toLowerCase(),
      );
      if (duplicate) {
        setError("Dish name already exists in this category");
        return;
      }

      const data = {
        BIT240205_Name: cleanName,
        BIT240205_Price: numericPrice,
        BIT240205_PreparationTime: numericTime,
        BIT240205_IsAvailable: available,
        BIT240205_Description: description.trim(),
        BIT240205_DishCategoryId: categoryId,
        BIT240205_DishImage: images,
      };
      if (initialDish) {
        await dishApi.update(initialDish.id, data);
      } else {
        await dishApi.create(data);
      }
      if (Platform.OS === "web") {
        window.alert("Dish saved successfully!");
      } else {
        Alert.alert("Success", "Dish saved successfully!");
      }
      router.replace("/");
    } catch {
      setError("Failed to save dish. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.title}>
          {isEditing ? "Edit Dish" : "Add New Dish"}
        </Text>

        <Text style={styles.label}>Dish Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter dish name"
        />

        <Text style={styles.label}>Price (VND) *</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="45000"
        />

        <Text style={styles.label}>Preparation Time (minutes) *</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          keyboardType="numeric"
          placeholder="15"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Description of the dish"
        />

        <Text style={styles.label}>Category *</Text>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.category,
              categoryId === String(category.id) && styles.selectedCategory,
            ]}
            onPress={() => setCategoryId(String(category.id))}
          >
            <Text>
              {categoryId === String(category.id) ? "🔘" : "⚪"}{" "}
              {category.BIT240205_Name}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Available</Text>
          <Switch value={available} onValueChange={setAvailable} />
        </View>

        <Text style={styles.label}>Dish Images</Text>
        <View style={styles.imageRow}>
          <TextInput
            style={[styles.input, styles.imageInput]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.smallButton} onPress={addImage}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {images.length === 0 && (
          <Text style={styles.emptyImageText}>No images added yet.</Text>
        )}
        <View style={styles.imageGrid}>
          {images.map((img, index) => (
            <View
              key={`${img.BIT240205_ImageUrl}-${index}`}
              style={styles.imageCard}
            >
              <ImagePreview url={img.BIT240205_ImageUrl} />
              <Text numberOfLines={1} style={styles.imageUrlText}>
                {img.BIT240205_ImageUrl}
              </Text>
              <TouchableOpacity
                style={[
                  styles.thumbnailButton,
                  img.BIT240205_IsThumbnail && styles.activeThumbnailButton,
                ]}
                onPress={() => setThumbnail(index)}
              >
                <Text
                  style={{
                    color: img.BIT240205_IsThumbnail ? "#fff" : "#2563eb",
                    fontWeight: "600",
                  }}
                >
                  {img.BIT240205_IsThumbnail ? "★ Main Image" : "☆ Set as Main"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Text style={{ color: "#dc2626" }}>Remove Image</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveDish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Dish</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#475569" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  form: { padding: 20, maxWidth: 650, width: "100%", alignSelf: "center" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 24,
  },
  label: { fontWeight: "600", fontSize: 15, marginBottom: 8, color: "#334155" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 9,
    padding: 13,
    marginBottom: 18,
    fontSize: 15,
  },
  textarea: { minHeight: 95, textAlignVertical: "top" },
  category: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  selectedCategory: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
  },
  imageRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  imageInput: { flex: 1, minWidth: 0, marginBottom: 0 },
  smallButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 20,
  },
  cancelButton: { padding: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  error: { color: "#dc2626", marginTop: 12 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  imageCard: {
    width: 180,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
    gap: 9,
  },
  previewImage: {
    width: "100%",
    height: 130,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  imageFallback: {
    height: 130,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: { color: "#64748b" },
  imageUrlText: { fontSize: 12, color: "#64748b" },
  thumbnailButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeThumbnailButton: { backgroundColor: "#2563eb" },
  removeImageButton: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  emptyImageText: { color: "#94a3b8", marginVertical: 10 },
});
