"use client";

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100">
      <div className="max-w-md w-full mx-4">
        <div className="text-center p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Authentication Coming Soon
            </h1>
            <p className="text-gray-600">
              We're updating our login system with Thirdweb integration.
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-gray-500">
            <p>New features coming:</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Wallet-based authentication</li>
              <li>Enhanced security</li>
              <li>Seamless Web3 integration</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <p className="text-xs text-gray-400">
              Check back soon for the new login experience!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;