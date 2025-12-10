'use client';

import FavoritesList from '@/components/FavoritesList';

export default function FavoritesPage() {
  return (
    <div className="min-h-full p-4">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          My Favorites
        </h2>
        <FavoritesList />
      </div>
    </div>
  );
}
