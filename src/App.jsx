import React, { useState } from "react";

const App = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callLambdaAPI = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(
        "https://<api-id>.execute-api.<region>.amazonaws.com/<stage>"
      );
      if (!response.ok) {
        throw new Error("API call failed with status " + response.status);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">AWS Inventory Dashboard</h1>

        <div className="text-center mb-6">
          <button
            onClick={callLambdaAPI}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
          >
            Call Lambda API
          </button>
        </div>

        {loading && <p className="text-center text-yellow-500 font-medium">Loading...</p>}
        {error && <p className="text-center text-red-600 font-medium">Error: {error}</p>}

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data).map(([accountId, accountData]) => (
              <div
                key={accountId}
                className="bg-white rounded-lg shadow-md p-5 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-blue-700 mb-4">
                  Account: {accountId}
                </h2>

                <div>
                  <h3 className="text-md font-semibold text-gray-600 mb-2">EC2 Instances</h3>
                  {accountData.EC2 && accountData.EC2.length > 0 ? (
                    <table className="w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-100 text-left">
                          <th className="border px-2 py-1">Instance ID</th>
                          <th className="border px-2 py-1">Type</th>
                          <th className="border px-2 py-1">State</th>
                          <th className="border px-2 py-1">Region</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountData.EC2.map((instance, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-2 py-1">{instance.InstanceId}</td>
                            <td className="border px-2 py-1">{instance.InstanceType}</td>
                            <td className="border px-2 py-1">{instance.State}</td>
                            <td className="border px-2 py-1">{instance.Region}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 italic">No EC2 instances</p>
                  )}
                </div>

                <div className="mt-6 text-right text-sm font-bold text-green-600">
                  Total Cost: ${parseFloat(accountData.CostUSD).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
