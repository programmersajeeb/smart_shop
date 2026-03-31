import { Mail, Linkedin } from "lucide-react";

function MeetTheTeam() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell text-center">
        <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
          Meet Our Team
        </h2>

        <p className="mx-auto mb-14 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
          The talented individuals behind Smart Shop — working every day to
          deliver excellence, innovation, and a seamless shopping experience.
        </p>

        <div
          className="
            grid
            grid-cols-1
            gap-10
            sm:grid-cols-2
            md:grid-cols-3
          "
        >
          <div className="flex flex-col items-center">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80"
              alt="CEO"
              className="h-40 w-40 rounded-full object-cover shadow-md transition hover:scale-105 md:h-48 md:w-48"
            />

            <h3 className="mt-5 text-xl font-semibold">Alicia Brown</h3>
            <p className="text-sm text-gray-600">Founder & CEO</p>

            <div className="mt-3 flex gap-4">
              <a href="#" className="text-gray-700 transition hover:text-black">
                <Mail size={20} />
              </a>
              <a href="#" className="text-gray-700 transition hover:text-black">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
              alt="Marketing Head"
              className="h-40 w-40 rounded-full object-cover shadow-md transition hover:scale-105 md:h-48 md:w-48"
            />

            <h3 className="mt-5 text-xl font-semibold">Sophia Turner</h3>
            <p className="text-sm text-gray-600">Head of Marketing</p>

            <div className="mt-3 flex gap-4">
              <a href="#" className="text-gray-700 transition hover:text-black">
                <Mail size={20} />
              </a>
              <a href="#" className="text-gray-700 transition hover:text-black">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <img
              src="https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=600&q=80"
              alt="Operations Manager"
              className="h-40 w-40 rounded-full object-cover shadow-md transition hover:scale-105 md:h-48 md:w-48"
            />

            <h3 className="mt-5 text-xl font-semibold">Daniel Carter</h3>
            <p className="text-sm text-gray-600">Operations Manager</p>

            <div className="mt-3 flex gap-4">
              <a href="#" className="text-gray-700 transition hover:text-black">
                <Mail size={20} />
              </a>
              <a href="#" className="text-gray-700 transition hover:text-black">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MeetTheTeam;