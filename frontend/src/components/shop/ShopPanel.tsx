import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';

interface ShopItem {
  id: string;
  name: string;
  description: string | null;
  gold_cost: number;
  is_purchased: boolean;
  purchased_at: string | null;
}

export default function ShopPanel() {
  const { user, profile, fetchProfile } = useUserStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goldCost, setGoldCost] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_shop_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);

    const { data, error } = await supabase
      .from('user_shop_items')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        gold_cost: Number(goldCost) || 0,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setItems((prev) => [data as ShopItem, ...prev]);
    setName('');
    setDescription('');
    setGoldCost('100');
  };

  const handleBuy = async (item: ShopItem) => {
    if (!user || !profile) return;
    if (profile.gold < item.gold_cost) {
      setError('Not enough gold.');
      return;
    }
    setError(null);

    const { error: updateError } = await supabase
      .from('user_shop_items')
      .update({
        is_purchased: true,
        purchased_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase
      .from('user_profiles')
      .update({ gold: profile.gold - item.gold_cost })
      .eq('id', user.id);

    fetchProfile();
    setItems((prev) =>
      prev.map((existing) =>
        existing.id === item.id
          ? { ...existing, is_purchased: true, purchased_at: new Date().toISOString() }
          : existing
      )
    );
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-purple-500/20 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Shop</p>
          <h3 className="text-lg font-semibold text-white">Your Wishlist</h3>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400">Gold: {profile?.gold ?? 0}</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            New Item
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-500">Loading items...</p>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 bg-slate-900 rounded-lg p-3"
            >
              <div>
                <p className="text-sm text-white font-semibold">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-gray-400">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-300">{item.gold_cost}g</span>
                <button
                  type="button"
                  disabled={item.is_purchased || (profile?.gold ?? 0) < item.gold_cost}
                  onClick={() => handleBuy(item)}
                  className="px-3 py-1.5 bg-emerald-500/90 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {item.is_purchased ? 'Purchased' : 'Buy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No items yet. Add something you want.</p>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Add Wishlist Item</h4>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Item name"
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              />
              <input
                value={goldCost}
                onChange={(event) => setGoldCost(event.target.value)}
                placeholder="Gold cost"
                type="number"
                min={0}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
              />
              <button
                type="button"
                onClick={async () => {
                  await handleAdd();
                  setShowForm(false);
                }}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
