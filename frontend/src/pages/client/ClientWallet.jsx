import { useState, useEffect } from "react";
import { walletApi } from "../../services/wallet.api";

export default function ClientWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    async function loadWallet() {
      try {
        const res = await walletApi.getWallet();
        setWallet(res.data);
      } catch (error) {
        console.error("Failed to load wallet:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, []);

  async function handleAddCredits() {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      await walletApi.addCredits({ amount: parseFloat(amount) });
      // Reload wallet data
      const res = await walletApi.getWallet();
      setWallet(res.data);
      setAmount("");
    } catch (error) {
      console.error("Failed to add credits:", error);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <p className="mt-2 text-gray-300">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Wallet & Credits</h2>
        <p className="text-gray-300">Manage your payment methods and credits</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-3xl font-bold">${wallet?.balanceCredits || 0}</div>
          <div className="text-sm opacity-90">Current Balance</div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-purple-400">{wallet?.monthlyCredits || 0}</div>
          <div className="text-sm text-gray-300">Monthly Credits</div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-3xl mb-2">🔄</div>
          <div className="text-sm text-gray-300">
            Resets: {wallet?.monthlyResetAt ? new Date(wallet.monthlyResetAt).toLocaleDateString() : "N/A"}
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Add Credits</h3>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={handleAddCredits}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Add Credits
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Initial credit grant</p>
              <p className="text-xs text-gray-400">Account creation</p>
            </div>
            <span className="text-green-400">+$50</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Consultation booking</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
            <span className="text-red-400">-$25</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-white">Credits added</p>
              <p className="text-xs text-gray-400">1 week ago</p>
            </div>
            <span className="text-green-400">+$100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
