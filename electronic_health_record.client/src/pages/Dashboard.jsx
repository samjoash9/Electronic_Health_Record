export default function Dashboard() {
    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">Welcome to the EHR System</h2>
                <p className="text-gray-500">
                    This is the main dashboard for the Agusan del Sur Provincial Health Information System.
                    Widgets and system statistics will be displayed here.
                </p>
            </div>
        </div>
    );
}