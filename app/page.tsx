"use client"
import { useState } from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-between p-24">
      Home
      <AddCoffee />
    </main>
  );
}

function AddCoffee() {
  const [count, setCount] = useState(1)
  const email = "pippo@gmail.com"

  return <div>
    <h1>Add Coffee</h1>
      <select name="count" value={count} onChange={e => setCount(parseInt(e.target.value))}>
        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <button className="button" onClick={submit}>
        Add
      </button>
  </div>

  async function submit(){
    const response = await fetch("/api/coffee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, count }),
    });
    if (response.ok) {
      console.log("Coffee added");
    }
  };
}