import React, { memo } from "react";

function AdminUsersTableSkeleton({ rows = 10 }) {
  return (
    <div className="p-6 overflow-x-auto" role="status" aria-live="polite" aria-busy="true">
      <table className="table w-full">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last login</th>
            <th>Joined</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td>
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="skeleton h-4 w-44 rounded-md" />
                    <div className="mt-2 skeleton h-3 w-56 rounded-md" />
                    <div className="mt-2 skeleton h-3 w-40 rounded-md" />
                  </div>
                  <div className="skeleton h-9 w-10 rounded-2xl" />
                </div>
              </td>

              <td>
                <div className="skeleton h-6 w-28 rounded-full" />
              </td>

              <td>
                <div className="skeleton h-6 w-24 rounded-full" />
              </td>

              <td>
                <div className="skeleton h-4 w-28 rounded-md" />
              </td>

              <td>
                <div className="skeleton h-4 w-28 rounded-md" />
              </td>

              <td className="text-right">
                <div className="inline-flex justify-end gap-2">
                  <div className="skeleton h-9 w-10 rounded-2xl" />
                  <div className="skeleton h-9 w-10 rounded-2xl" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4">
        <div className="skeleton h-3 w-56 rounded-md" />
      </div>
    </div>
  );
}

export default memo(AdminUsersTableSkeleton);
