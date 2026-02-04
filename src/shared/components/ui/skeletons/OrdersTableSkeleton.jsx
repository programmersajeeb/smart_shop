import React, { memo } from "react";

function OrdersTableSkeleton({ rows = 10 }) {
  return (
    <div className="p-6 overflow-x-auto" role="status" aria-live="polite" aria-busy="true">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            <th>Items</th>
            <th>Status</th>
            <th className="text-right">Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td>
                <div className="skeleton h-4 w-24 rounded-md" />
                <div className="mt-2 skeleton h-3 w-40 rounded-md" />
              </td>
              <td>
                <div className="skeleton h-4 w-20 rounded-md" />
              </td>
              <td>
                <div className="skeleton h-4 w-10 rounded-md" />
              </td>
              <td>
                <div className="skeleton h-5 w-20 rounded-full" />
              </td>
              <td className="text-right">
                <div className="skeleton h-4 w-16 rounded-md ml-auto" />
              </td>
              <td className="text-right">
                <div className="skeleton h-8 w-16 rounded-xl ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <div className="skeleton h-3 w-48 rounded-md" />
      </div>
    </div>
  );
}

export default memo(OrdersTableSkeleton);
