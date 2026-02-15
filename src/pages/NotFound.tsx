import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log as info/debug instead of error (404 is expected)
    console.info(
      "[404] Route not found:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-muted"
      role="alert"
      aria-live="polite"
    >
      <div className="text-center px-4">
        <h1 className="mb-4 text-5xl font-bold">404</h1>

        <p className="mb-6 text-xl text-muted-foreground">
          Oops! The page you’re looking for doesn’t exist.
        </p>

        <Link
          to="/"
          className="inline-block text-primary underline hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
