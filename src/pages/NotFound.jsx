import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 text-center">
      <h1 className="text-7xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-bold mt-4">Page Not Found</h2>
      <p className="opacity-70 mt-2 max-w-md">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link to="/" className="btn btn-primary mt-6">Return to Smart Shop</Link>
    </div>
  );
}
