import { Mail, Linkedin } from "lucide-react";

function MeetTheTeam() {
  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 text-center">

        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Meet Our Team
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg mb-14 leading-relaxed">
          The talented individuals behind Smart Shop — working every day to
          deliver excellence, innovation, and a seamless shopping experience.
        </p>

        {/* GRID */}
        <div className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-3 
          gap-10
        ">

          {/* Team Member 1 */}
          <div className="flex flex-col items-center">
            <img
              src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80"
              alt="CEO"
              className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-full shadow-md hover:scale-105 transition"
            />

            <h3 className="text-xl font-semibold mt-5">Alicia Brown</h3>
            <p className="text-gray-600 text-sm">Founder & CEO</p>

            <div className="flex gap-4 mt-3">
              <a href="#" className="text-gray-700 hover:text-black transition">
                <Mail size={20} />
              </a>
              <a href="#" className="text-gray-700 hover:text-black transition">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="flex flex-col items-center">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
              alt="Marketing Head"
              className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-full shadow-md hover:scale-105 transition"
            />

            <h3 className="text-xl font-semibold mt-5">Sophia Turner</h3>
            <p className="text-gray-600 text-sm">Head of Marketing</p>

            <div className="flex gap-4 mt-3">
              <a href="#" className="text-gray-700 hover:text-black transition">
                <Mail size={20} />
              </a>
              <a href="#" className="text-gray-700 hover:text-black transition">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="flex flex-col items-center">
            <img
              src="https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=600&q=80"
              alt="Operations Manager"
              className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-full shadow-md hover:scale-105 transition"
            />

            <h3 className="text-xl font-semibold mt-5">Daniel Carter</h3>
            <p className="text-gray-600 text-sm">Operations Manager</p>

            <div className="flex gap-4 mt-3">
              <a href="#" className="text-gray-700 hover:text-black transition">
                <Mail size={20} />
              </a>
              <a href="#" className="text-gray-700 hover:text-black transition">
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
