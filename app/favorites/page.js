'use client';

import FavoritesList from '@/components/FavoritesList';

export default function FavoritesPage() {
  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            My Favorites
          </h1>
          <p className="text-sm text-gray-600">
            Jobs you've marked as favorites
          </p>
        </div>
        <FavoritesList />
      </div>
    </div>
  );
}
