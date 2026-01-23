import { icons } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { ITEMS_PER_PAGE } from "../constants/icon_picker_const";
import { Tab, IconName } from "../types/icon_picker_type";

export const useIconPickerLogic = () => {
  // --- STATE ---
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Persistence State
  const [favorites, setFavorites] = useState<IconName[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("icon_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<IconName[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("icon_history") || "[]");
    } catch {
      return [];
    }
  });

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem("icon_favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem("icon_history", JSON.stringify(history));
  }, [history]);

  // Reset scroll khi đổi tab/search
  useEffect(() => {
    setPage(1);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query, activeTab]);

  // --- FILTERING ---
  const allIconNames = useMemo(() => Object.keys(icons) as IconName[], []);

  const filteredIcons = useMemo(() => {
    let source = allIconNames;
    if (activeTab === "favorites") source = favorites;
    if (activeTab === "history") source = history;

    if (!query) return source;
    return source.filter((name) =>
      name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query, allIconNames, activeTab, favorites, history]);

  const visibleIcons = useMemo(() => {
    return filteredIcons.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredIcons, page]);

  // --- ACTIONS ---
  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (visibleIcons.length < filteredIcons.length) {
          setPage((prev) => prev + 1);
        }
      }
    }
  };

  const addToHistory = (name: IconName) => {
    setHistory((prev) =>
      [name, ...prev.filter((i) => i !== name)].slice(0, 50),
    );
  };

  const toggleFavorite = (name: IconName) => {
    setFavorites((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [name, ...prev],
    );
  };

  return {
    state: {
      query,
      activeTab,
      favorites,
      history,
      listRef,
      visibleIcons,
      allIconNames,
    },
    actions: {
      setQuery,
      setActiveTab,
      handleScroll,
      addToHistory,
      toggleFavorite,
    },
  };
};
