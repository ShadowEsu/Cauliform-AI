"use client";

import { useState } from "react";
import Image from "next/image";

type CallState = "idle" | "parsing" | "calling" | "in_progress" | "success" | "error";

export default function Home() {
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
      // Parse the form first
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

      // Start the call
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
        {/* Logo */}
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

        {/* Form */}
        {callState === "idle" || callState === "error" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="formUrl" className="block text-sm font-medium text-gray-700 mb-1">
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
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
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

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
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
                <div className="animate-pulse">
                  <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium">Calling you now...</p>
                <p className="text-gray-500 text-sm mt-1">Please answer your phone</p>
              </>
            )}

            {callState === "in_progress" && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          Built with Gemini Live API for the Gemini Live Agent Challenge
        </p>
      </main>
    </div>
  );
}
