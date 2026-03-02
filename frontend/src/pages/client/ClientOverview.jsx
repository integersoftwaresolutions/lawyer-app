import { useAuth } from "../../hooks/useAuth";

export default function ClientOverview() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.fullName || "Client"}!</h2>
        <p className="opacity-90">Manage your legal consultations and connect with expert lawyers</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold mb-2">Search Lawyers</h3>
          <p className="text-gray-300 text-sm mb-4">Find qualified lawyers for your legal needs</p>
          <a
            href="/client/dashboard/search"
            className="inline-block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Browse Lawyers
          </a>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-3xl mb-3">📅</div>
          <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
          <p className="text-gray-300 text-sm mb-4">View and manage your consultation appointments</p>
          <a
            href="/client/dashboard/bookings"
            className="inline-block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            View Bookings
          </a>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="text-3xl mb-3">💳</div>
          <h3 className="text-lg font-semibold mb-2">Wallet & Credits</h3>
          <p className="text-gray-300 text-sm mb-4">Manage your payment methods and credits</p>
          <a
            href="/client/dashboard/wallet"
            className="inline-block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Manage Wallet
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div>
                <p className="text-sm font-medium">Consultation booked</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Completed</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div>
                <p className="text-sm font-medium">Profile updated</p>
                <p className="text-xs text-gray-400">1 day ago</p>
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Info</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Credits added</p>
                <p className="text-xs text-gray-400">3 days ago</p>
              </div>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Payment</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">12</div>
              <div className="text-sm text-gray-400">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">8</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">3</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">4.8</div>
              <div className="text-sm text-gray-400">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
