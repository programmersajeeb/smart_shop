export default function CareersPage() {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">Careers at Smart Shop</h1>
        <p className="opacity-70 text-lg">
          Join one of the fastest-growing e-commerce platforms!  
          Smart Shop is always looking for talented individuals to help expand our team.
        </p>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold">Current Open Positions</h2>
          <p className="opacity-70 mt-2">We are hiring for the following roles:</p>

          <div className="mt-6 space-y-4">
            <div className="p-5 bg-base-100 rounded-lg shadow">
              <h3 className="text-xl font-semibold">Frontend Developer</h3>
              <p className="opacity-70">React, Tailwind, REST API, Git</p>
            </div>

            <div className="p-5 bg-base-100 rounded-lg shadow">
              <h3 className="text-xl font-semibold">Backend Developer</h3>
              <p className="opacity-70">Node.js, Express, MongoDB</p>
            </div>

            <div className="p-5 bg-base-100 rounded-lg shadow">
              <h3 className="text-xl font-semibold">Customer Support Executive</h3>
              <p className="opacity-70">Email/Chat Support, Order Handling</p>
            </div>
          </div>
        </div>

        <p className="mt-10 opacity-70">
          To apply, send your CV to  
          <span className="font-semibold"> careers@smartshop.com</span>
        </p>
      </div>
    </div>
  );
}
