"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      window.location.href = "/admin";
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold text-white text-center">
          N-tropy Call Login
        </h1>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors text-white"
        >
          {loading ? "Accedendo..." : "Accedi"}
        </button>
        {message && (
          <p className="text-sm text-red-400 text-center">{message}</p>
        )}
      </form>
    </div>
  );
}
