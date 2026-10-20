
import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, Switch, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Dish, DishCategory, DishImage,
  dishApi, categoryApi,
} from "../services/api";

type Props = {
  initialDish?: Dish;
};

export default function DishForm({ initialDish }: Props) {
  const router = useRouter();
  const isEditing = !!initialDish;

  const [name, setName] = useState(initialDish?.BIT240205_Name ?? "");
  const [price, setPrice] = useState(
    String(initialDish?.BIT240205_Price ?? "")
  );
  const [time, setTime] = useState(
    String(initialDish?.BIT240205_PreparationTime ?? "")
  );
  const [description, setDescription] = useState(
    initialDish?.BIT240205_Description ?? ""
  );
  const [categoryId, setCategoryId] = useState(
    String(initialDish?.BIT240205_DishCategoryId ?? "")
  );
  const [available, setAvailable] = useState(
    initialDish?.BIT240205_IsAvailable ?? true
  );
  const [images, setImages] = useState<DishImage[]>(
    initialDish?.BIT240205_DishImage ?? []
  );
  const [imageUrl, setImageUrl] = useState("");
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    categoryApi.getAll()
      .then(setCategories)
      .catch(() => setError("Cannot load categories"));
  }, []);

  const addImage = () => {
    const url = imageUrl.trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      setError("Please enter a valid image URL");
      return;
    }
    setImages(prev => [
      ...prev,
      {
        BIT240205_ImageUrl: url,
        BIT240205_IsThumbnail: prev.length === 0,
      },
    ]);
    setImageUrl("");
    setError("");
  };

  const setThumbnail = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      BIT240205_IsThumbnail: i === index,
    })));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 &&
          !next.some(img => img.BIT240205_IsThumbnail)) {
        next[0] = {
          ...next[0],
          BIT240205_IsThumbnail: true,
        };
      }
      return next;
    });
  };

  const saveDish = async () => {
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericTime = Number(time);

    if (!cleanName) {
      setError("Dish name is required");
      return;
    }
    if (!price.trim() || !Number.isFinite(numericPrice) ||
        numericPrice <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (!time.trim() || !Number.isFinite(numericTime) ||
        numericTime <= 0) {
      setError("Preparation time must be greater than 0");
      return;
    }
    if (!categories.some(c => String(c.id) === categoryId)) {
      setError("Please select a valid category");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const allDishes = await dishApi.getAll();

      const duplicate = allDishes.some(d =>
        String(d.id) !== String(initialDish?.id ?? "") &&
        String(d.BIT240205_DishCategoryId) === categoryId &&
        d.BIT240205_Name.trim().toLowerCase() ===
          cleanName.toLowerCase()
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
    <ScrollView style={styles.container}>
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
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.category,
              categoryId === String(category.id) &&
                styles.selectedCategory,
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
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://example.com/image.jpg"
          />
          <TouchableOpacity style={styles.smallButton} onPress={addImage}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {images.map((image, index) => (
          <View key={index} style={styles.imageItem}>
            <Text numberOfLines={1} style={{ flex: 1 }}>
              {image.BIT240205_ImageUrl}
            </Text>
            <TouchableOpacity onPress={() => setThumbnail(index)}>
              <Text style={{ color: "#2563eb" }}>
                {image.BIT240205_IsThumbnail ? "★ Main" : "☆ Main"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeImage(index)}>
              <Text style={{ color: "red" }}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveDish}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Save Dish</Text>
          }
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
  form: {
    padding: 20, maxWidth: 650,
    width: "100%", alignSelf: "center",
  },
  title: {
    fontSize: 26, fontWeight: "bold",
    color: "#0f172a", marginBottom: 24,
  },
  label: {
    fontWeight: "600", fontSize: 15,
    marginBottom: 8, color: "#334155",
  },
  input: {
    backgroundColor: "#fff", borderWidth: 1,
    borderColor: "#cbd5e1", borderRadius: 9,
    padding: 13, marginBottom: 18,
    fontSize: 15,
  },
  textarea: { minHeight: 95, textAlignVertical: "top" },
  category: {
    padding: 14, borderWidth: 1,
    borderColor: "#e2e8f0", borderRadius: 8,
    backgroundColor: "#fff", marginBottom: 8,
  },
  selectedCategory: {
    borderColor: "#2563eb", backgroundColor: "#eff6ff",
  },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginVertical: 20,
  },
  imageRow: {
    flexDirection: "row", gap: 8, marginBottom: 16,
  },
  imageItem: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 10,
  },
  smallButton: {
    backgroundColor: "#2563eb", padding: 14,
    borderRadius: 8, justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#2563eb", padding: 16,
    alignItems: "center", borderRadius: 10,
    marginTop: 20,
  },
  cancelButton: {
    padding: 16, alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  error: {
    color: "#dc2626", marginTop: 12,
  },
});
