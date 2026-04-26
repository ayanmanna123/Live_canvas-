import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Camera, User, Heart, ExternalLink, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ayanImg from '../assets/Ayan.png';
import ankitaImg from '../assets/ankita.png';

const Developers = () => {
  const navigate = useNavigate();

  const developers = [
    {
      name: "Ayan Manna",
      role: "Lead Full-Stack Developer",
      bio: "Crafting the core architecture and bringing LoveCanvas to life through code. Focused on building a seamless collaborative experience.",
      github: "https://github.com/ayanmanna123",
      linkedin: "https://www.linkedin.com/in/ayanmanna123/",
      instagram: "https://www.instagram.com/ayan.manna.90834/",
      image: ayanImg,
      color: "from-rose-400 to-pink-500"
    },
    {
      name: "Ankita Giri",
      role: "Creative Lead & Quality Analyst",
      bio: "The visionary behind the platform's unique features and aesthetic. Dedicated to testing every detail to ensure a perfect user experience.",
      github: "https://github.com/ayanmanna123/Live_canvas-",
      linkedin: "https://www.linkedin.com/in/ankita-giri-3212a2301/",
      instagram: "https://www.instagram.com/ankita_giri7/",
      image: ankitaImg,
      color: "from-purple-400 to-indigo-500"
    }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FFF0F5] px-4 py-10 font-sans selection:bg-rose-200 selection:text-rose-700">
      {/* Background Decor - consistent with Home.jsx */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-rose-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-pink-200/40 blur-[120px]" />
        <div className="h-full w-full bg-[radial-gradient(#ffb6c1_1px,transparent_1px)] [background-size:40px_40px] opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-500 backdrop-blur-md transition-all hover:bg-rose-50"
            >
              <Heart className="size-3 fill-current" />
              Back to Home
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:brightness-110 shadow-lg shadow-rose-200/50"
            >
              <ArrowLeft className="size-3 stroke-[3px]" />
              Back to Room
            </button>
          </div>
          
          <div className="mb-4 inline-block rounded-full bg-rose-100/50 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">
            Meet Our Developers
          </div>
          
          <h2 className="text-5xl font-black tracking-tighter text-rose-600 font-serif italic mb-4">
            The Minds Behind <span className="text-pink-400 font-sans not-italic">LoveCanvas</span>
          </h2>
          <p className="mx-auto max-w-2xl text-rose-500/80 font-medium font-serif italic text-lg">
            "We built this space to bring hearts closer together, one stroke at a time."
          </p>
        </motion.div>

        {/* Developer Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {developers.map((dev, index) => (
            <motion.div
              key={dev.name}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="group relative overflow-hidden rounded-[3rem] border border-white/60 bg-white/40 p-8 backdrop-blur-2xl shadow-2xl transition-all"
            >
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Profile Image Container */}
                <div className="relative mb-6">
                  <div className={`absolute -inset-2 rounded-full bg-gradient-to-br ${dev.color} blur-lg opacity-40 group-hover:opacity-70 transition-opacity`} />
                  <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-xl">
                    <img 
                      src={dev.image} 
                      alt={dev.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg text-rose-500"
                  >
                    <Sparkles className="size-5" />
                  </motion.div>
                </div>

                <h3 className="text-3xl font-black text-rose-600 mb-1">{dev.name}</h3>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-400 mb-4">{dev.role}</p>
                <p className="text-rose-500/80 font-medium mb-8 leading-relaxed">
                  {dev.bio}
                </p>

                {/* Social Links with Perfect Brand Icons */}
                <div className="flex gap-4">
                  {[
                    { 
                      name: 'GitHub', 
                      href: dev.github, 
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'LinkedIn', 
                      href: dev.linkedin, 
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
                        </svg>
                      )
                    },
                    { 
                      name: 'Instagram', 
                      href: dev.instagram, 
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                        </svg>
                      )
                    }
                  ].map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md transition-all hover:bg-rose-500 hover:text-white"
                      title={social.name}
                    >
                      <div className="transition-transform group-hover/btn:scale-110">
                        {social.icon}
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl" />
              <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-gradient-to-br from-rose-200/20 to-transparent blur-3xl" />
            </motion.div>
          ))}
        </div>

        {/* Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center space-y-6"
        >
          <div className="inline-flex items-center gap-4 rounded-full bg-white/40 px-8 py-4 backdrop-blur-md border border-white/60">
             <Code2 className="size-5 text-rose-400" />
             <span className="text-sm font-black uppercase tracking-[0.2em] text-rose-500">Made with Love & React</span>
          </div>
          
          <div className="flex justify-center gap-4 text-rose-300">
             <Heart className="size-4 fill-current animate-pulse" />
             <Sparkles className="size-4 animate-bounce" />
             <Heart className="size-4 fill-current animate-pulse" />
          </div>
          
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] opacity-60">
            © 2024 LoveCanvas Team • All Rights Reserved
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Developers;
