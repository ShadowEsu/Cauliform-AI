"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type CallState =
  | "idle"
  | "parsing"
  | "calling"
  | "in_progress"
  | "success"
  | "error";

export default function MarketingPage() {
  const [formUrl, setFormUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const [formTitle, setFormTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formUrl || !phoneNumber) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setCallState("parsing");
      const parseResponse = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });

      const parseData = await parseResponse.json();
      if (!parseResponse.ok) {
        throw new Error(parseData.error || "Failed to parse form");
      }

      setFormTitle(parseData.data.title);

      setCallState("calling");
      const callResponse = await fetch("/api/start-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formUrl, phoneNumber }),
      });

      const callData = await callResponse.json();
      if (!callResponse.ok) {
        throw new Error(callData.error || "Failed to start call");
      }

      setCallState("in_progress");
    } catch (err) {
      setCallState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-semibold text-gray-900">
            ← Dashboard
          </Link>
          <Link href="/login" className="text-sm font-semibold text-gray-900">
            Login
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Cauliform"
            width={120}
            height={120}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900">Cauliform</h1>
          <p className="text-gray-600 text-center mt-2">
            Turn any Google Form into a phone call
          </p>
        </div>

        {callState === "idle" || callState === "error" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="formUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Google Form URL
              </label>
              <input
                id="formUrl"
                type="url"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://forms.google.com/..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              Call Me
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            {callState === "parsing" && (
              <>
                <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Parsing form...</p>
              </>
            )}

            {callState === "calling" && (
              <>
                <div className="animate-pulse w-16 h-16 rounded-full bg-amber-200 mx-auto mb-4" />
                <p className="text-gray-900 font-medium">Calling you now...</p>
                <p className="text-gray-500 text-sm mt-1">Please answer your phone</p>
              </>
            )}

            {callState === "in_progress" && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <p className="text-gray-900 font-medium">Call in progress</p>
                <p className="text-gray-500 text-sm mt-1">Filling out: {formTitle}</p>
                <button
                  onClick={() => setCallState("idle")}
                  className="mt-4 text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  Start another form
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          Built with Gemini Live API for the Gemini Live Agent Challenge
        </p>
      </main>
    </div>
  );
}

