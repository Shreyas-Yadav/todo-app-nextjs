import Link from "next/link"
export default function Navbar() {
    return (
        <div className="bg-green-200">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf4] px-10 py-5">
            <div className="flex items-center gap-4 text-[#0d141c]">
                <h1 className="text-[#0d141c] text-lg font-bold leading-tight tracking-[-0.015em]">TaskMaster</h1>
            </div>
            <div className="flex flex-1 justify-end gap-8">
                <div className="flex items-center gap-9">
                    <Link className="text-[#0d141c] text-sm font-medium leading-normal" href="/">Home</Link>
                    <Link className="text-[#0d141c] text-sm font-medium leading-normal" href="/tasks">Tasks</Link>
                    <Link className="text-[#0d141c] text-sm font-medium leading-normal" href="/calender">Calendar</Link>
                </div>
            </div>
        </header>
        </div>

    )
}