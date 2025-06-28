import Image from "next/image";
import Link from "next/link";
import LandingpageWrapper from "@/components/LandingpageWrapper";
export default function Home() {
  return (
    <LandingpageWrapper>
      <h1 style={{ fontSize: 50, color: 'black' }}>Organize Your Day, Achieve Your Goals</h1>
      <button className="bg-[#0d141c] text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-[#1a2027] transition-colors">
        <Link href="/tasks">Get Started</Link>
      </button>
    </LandingpageWrapper>
  );
}
