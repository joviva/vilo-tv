"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon,
  HeartIcon,
  TvIcon,
  GlobeAltIcon,
  LanguageIcon 
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "@/hooks/useFavorites";

export default function Navigation() {
  const pathname = usePathname();
  const { favorites } = useFavorites();

  const navItems = [
    {
      href: "/",
      icon: HomeIcon,
      label: "Home",
      isActive: pathname === "/"
    },
    {
      href: "/categories",
      icon: TvIcon,
      label: "Categories", 
      isActive: pathname.startsWith("/categories")
    },
    {
      href: "/countries",
      icon: GlobeAltIcon,
      label: "Countries",
      isActive: pathname.startsWith("/countries")
    },
    {
      href: "/languages",
      icon: LanguageIcon,
      label: "Languages",
      isActive: pathname.startsWith("/languages")
    },
    {
      href: "/favorites",
      icon: favorites.length > 0 ? HeartIconSolid : HeartIcon,
      label: "Favorites",
      isActive: pathname === "/favorites",
      badge: favorites.length > 0 ? favorites.length : undefined,
      special: true
    }
  ];

  return (
    <nav className="fixed top-4 right-4 z-40">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-lg">
        <div className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  item.isActive
                    ? item.special 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                      : "bg-white/20 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
                title={item.label}
              >
                <div className="relative">
                  <IconComponent className="w-5 h-5" />
                  {item.badge && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}