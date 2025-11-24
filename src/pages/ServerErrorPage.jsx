import { Link } from "react-router-dom";

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 text-center">
      <h1 className="text-7xl font-bold text-error">500</h1>
      <h2 className="text-3xl font-bold mt-4">Internal Server Error</h2>
      <p className="opacity-70 mt-2 max-w-md">
        Something went wrong on our end.  
        We’re working to fix it and restore Smart Shop as soon as possible.
      </p>

      <Link to="/" className="btn btn-error mt-6">Back to Home</Link>
    </div>
  );
}
