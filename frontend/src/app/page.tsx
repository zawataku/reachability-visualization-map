"use client";

import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const checkOtpConnection = async () => {
    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("http://localhost:8080/otp/routers/default");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));

    } catch (error: any) {
      console.error("Fetch error:", error);
      setResponse(`Connection failed: ${error.message}\n\nIs the OTP container running and finished building the graph?`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="p-6 flex flex-col gap-8 items-center">
      <div className="w-5xl flex flex-col gap-3 items-center">
        <h1 className="text-3xl font-bold">OTP Connection Test</h1>
        <p>ボタンを押して、Next.js (フロント) と OTP (バック) の通信をテストします</p>
      </div>
      <div className="w-5xl flex flex-col gap-8 items-center">

        <button
          onClick={checkOtpConnection}
          disabled={isLoading}
          className="p-3 bg-sky-500 text-neutral-50 min-w-32 rounded-xl"
        >
          {isLoading ? "テスト中..." : "OTP 接続テスト"}
        </button>

        <pre className="break-all whitespace-pre-wrap w-full p-6 bg-neutral-700 text-neutral-50 max-h-[500px] overflow-scroll">
          {response ? response : "ここにOTPからの応答が表示されます..."}
        </pre>
      </div>
    </main>
  );
}