import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LanguageProvider } from "../context/LanguageContext";

export default function RootLayout() {
  return (
      <LanguageProvider>
    <>
      <StatusBar style="auto" />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#2563eb",
          },
          headerTintColor: "#ffffff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="dish/[id]"
          options={{
            title: "Dish Details",
          }}
        />
        <Stack.Screen name="dish/create" options={{ title: "Add Dish" }} />

        <Stack.Screen name="dish/edit/[id]" options={{ title: "Edit Dish" }} />
      </Stack>
    </>
    </LanguageProvider>
  );
}
