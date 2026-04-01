import { Linkedin } from "lucide-react";

function MeetTheTeam() {
  const members = [
    {
      name: "Alicia Brown",
      role: "Founder & CEO",
      image:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Sophia Turner",
      role: "Head of Marketing",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Daniel Carter",
      role: "Operations Manager",
      image:
        "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Meet the team
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            Behind Smart Shop is a team working across product, brand, service,
            and operations to keep the experience improving.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.name}
              className="rounded-[28px] border border-black/5 bg-gray-50 p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border border-black/5 bg-white shadow-sm sm:h-40 sm:w-40">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-gray-950">
                {member.name}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{member.role}</p>

              <div className="mt-4 flex justify-center">
                <a
                  href="#"
                  aria-label={`${member.name} LinkedIn`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-700 transition hover:bg-gray-100 hover:text-black"
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MeetTheTeam;