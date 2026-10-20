import React, { createContext, useContext, useState } from "react";

const translations = {
  en: {
    sortPrice: "Price",
    sortTime: "Time",

    foodManager: "Food Manager",
    dishList: "Dish List",
    search: "Search dishes...",
    addDish: "Add Dish",
    editDish: "Edit Dish",
    deleteDish: "Delete Dish",
    saveDish: "Save Dish",
    category: "Category",
    status: "Status",
    price: "Price",
    priceRange: "Price Range (VND)",
    minPrice: "Min price",
    maxPrice: "Max price",
    preparationTime: "Preparation Time",
    description: "Description",
    available: "Available",
    unavailable: "Unavailable",
    all: "All",
    sortBy: "Sort By",
    clearFilters: "Clear Filters",
    quick: "Quick",
    regular: "Regular",
    noDishes: "No dishes found.",
    loading: "Loading...",
    cancel: "Cancel",
    back: "Back to Dish List",
    dishName: "Dish Name",
    dishImages: "Dish Images",
    addImage: "Add Image",
    remove: "Remove",
    thumbnail: "Main Image",
    confirmDelete: "Are you sure you want to delete this dish?",
    deleteSuccess: "Dish deleted successfully",
    saveSuccess: "Dish saved successfully",
    nameRequired: "Dish name is required",
    invalidPrice: "Price must be greater than 0",
    invalidTime: "Preparation time must be greater than 0",
    invalidCategory: "Please select a valid category",
    duplicateName: "Dish name already exists in this category",
    apiError: "Cannot connect to MockAPI",
    invalidPriceRange: "Invalid price range",
  },
  vi: {
    sortPrice: "Giá",
    sortTime: "Thời gian",
    foodManager: "Quản Lý Món Ăn",
    dishList: "Danh Sách Món Ăn",
    search: "Tìm kiếm món ăn...",
    addDish: "Thêm Món",
    editDish: "Sửa Món",
    deleteDish: "Xóa Món",
    saveDish: "Lưu Món Ăn",
    category: "Loại món",
    status: "Trạng thái",
    price: "Giá",
    priceRange: "Khoảng Giá (VNĐ)",
    minPrice: "Giá thấp nhất",
    maxPrice: "Giá cao nhất",
    preparationTime: "Thời Gian Chế Biến",
    description: "Mô tả",
    available: "Đang bán",
    unavailable: "Ngừng bán",
    all: "Tất cả",
    sortBy: "Sắp Xếp Theo",
    clearFilters: "Xóa Bộ Lọc",
    quick: "Nhanh",
    regular: "Thông thường",
    noDishes: "Không tìm thấy món ăn.",
    loading: "Đang tải...",
    cancel: "Hủy",
    back: "Quay Lại Danh Sách",
    dishName: "Tên Món Ăn",
    dishImages: "Hình Ảnh Món Ăn",
    addImage: "Thêm Ảnh",
    remove: "Xóa",
    thumbnail: "Ảnh Đại Diện",
    confirmDelete: "Bạn có chắc muốn xóa món ăn này?",
    deleteSuccess: "Đã xóa món ăn thành công",
    saveSuccess: "Lưu món ăn thành công",
    nameRequired: "Tên món ăn không được để trống",
    invalidPrice: "Giá phải lớn hơn 0",
    invalidTime: "Thời gian chế biến phải lớn hơn 0",
    invalidCategory: "Vui lòng chọn loại món hợp lệ",
    duplicateName: "Tên món đã tồn tại trong loại này",
    apiError: "Không thể kết nối MockAPI",
    invalidPriceRange: "Khoảng giá không hợp lệ",
  },
};

type Language = "en" | "vi";
type TranslationKey = keyof typeof translations.en;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
