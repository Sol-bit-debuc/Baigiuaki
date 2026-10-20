
import React, { useEffect, useState } from "react";
import {
  View, Text, ActivityIndicator, StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import DishForm from "../../../components/DishForm";
import { Dish, dishApi } from "../../../services/api";

export default function EditDishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Invalid dish ID");
      setLoading(false);
      return;
    }

    dishApi.getById(id)
      .then(setDish)
      .catch(() => setError("Dish not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !dish) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>
          {error || "Dish not found"}
        </Text>
      </View>
    );
  }

  return <DishForm key={dish.id} initialDish={dish} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
