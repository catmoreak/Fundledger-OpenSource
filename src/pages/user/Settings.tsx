import { useState } from "react";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="flex items-center gap-3">
        <span>Dark Mode</span>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`px-4 py-2 rounded text-white ${
            darkMode ? "bg-green-600" : "bg-gray-500"
          }`}
        >
          {darkMode ? "ON" : "OFF"}
        </button>
      </div>

      <p className="mt-4 text-gray-600">
        This is a dummy toggle. Theme switching is not implemented yet.
      </p>
    </div>
  );
};

export default Settings;