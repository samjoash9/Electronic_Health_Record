export default function Footer() {
    return (
        // Changed to a semantic <footer> tag with top padding and a subtle border
        <footer className="w-full py-6 mt-4 border-t border-gray-200">
            <div className="flex items-center justify-center text-sm font-medium">

                {/* Subtle "Powered by" text */}
                <span className="text-gray-400 tracking-wider uppercase text-xs">
                    Powered by
                </span>

                {/* Divider dot */}
                <span className="mx-2 text-gray-300">•</span>

                {/* Highlighted Brand Name */}
                <span className="font-bold text-gray-600 tracking-widest">
                    SAMIELOB <span className="text-blue-500 font-black">2026</span>
                </span>

            </div>
        </footer>
    );
}