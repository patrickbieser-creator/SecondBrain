import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>SecondBrain</h1>
      <p>Bootstrap is complete. Continue implementation from Plans.md.</p>
      <p>
        <Link href="/today">Go to Today</Link>
      </p>
    </main>
  );
}
