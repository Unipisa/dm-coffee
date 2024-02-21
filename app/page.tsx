import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-between p-24">
      Home
      <AddCoffee />
    </main>
  );
}

function AddCoffee() {
  return <div>
    <h1>Add Coffee</h1>
    <form>
      <select name="count">
        <option value="1" selected>1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <button className="button" type="submit">Add</button>
    </form>
  </div>
}