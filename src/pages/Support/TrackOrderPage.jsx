import { useState } from "react";

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState("");

  const handleTrack = (e) => {
    e.preventDefault();
    alert(`Tracking Order: ${trackingId}`);
  };

  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-6">Track Your Order</h1>
        <p className="text-center opacity-70 mb-6">
          Enter your Smart Shop tracking ID to check order status.
        </p>

        <form onSubmit={handleTrack} className="bg-base-100 p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Tracking ID</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter tracking ID"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
            />
          </div>

          <button className="btn btn-primary w-full">Track Order</button>
        </form>
      </div>
    </div>
  );
}
