import React from "react";

export default function TopLoadingBar() {
  return (
    <div className="fixed left-0 right-0 top-0 z-[80] h-1">
      <div className="h-full w-full skeleton" />
    </div>
  );
}
