'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Animated Scramble Text Component
const AnimatedScrambleText = ({ 
  text, 
  scrambleDuration = 2000, 
  revealDuration = 1000, 
  scrambleInterval = 100 
}: {
  text: string
  scrambleDuration?: number
  revealDuration?: number
  scrambleInterval?: number
}) => {
  const [displayText, setDisplayText] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [elementRef, setElementRef] = useState<HTMLSpanElement | null>(null)
  
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
  
  useEffect(() => {
    if (!elementRef) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true)
          setHasAnimated(true)
        }
      },
      { threshold: 0.5 } // Trigger when 50% of element is visible
    )
    
    observer.observe(elementRef)
    
    return () => observer.disconnect()
  }, [elementRef, hasAnimated])
  
  useEffect(() => {
    if (!isVisible) return
    
    let scrambleTimer: NodeJS.Timeout
    let revealTimer: NodeJS.Timeout
    
    // Start scrambling
    const startScrambling = () => {
      let elapsed = 0
      scrambleTimer = setInterval(() => {
        elapsed += scrambleInterval
        const progress = elapsed / scrambleDuration
        
        if (progress >= 1) {
          clearInterval(scrambleTimer)
          startRevealing()
          return
        }
        
        // Scramble text with random characters
        const scrambled = text.split('').map((char, index) => {
          if (char === ' ') return ' '
          return characters[Math.floor(Math.random() * characters.length)]
        }).join('')
        
        setDisplayText(scrambled)
      }, scrambleInterval)
    }
    
    // Start revealing correct characters
    const startRevealing = () => {
      const charIndices = Array.from({ length: text.length }, (_, i) => i)
      // Shuffle indices for non-sequential reveal
      for (let i = charIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[charIndices[i], charIndices[j]] = [charIndices[j], charIndices[i]]
      }
      
      let currentIndex = 0
      let revealedSet = new Set<number>()
      
      revealTimer = setInterval(() => {
        if (currentIndex >= charIndices.length) {
          clearInterval(revealTimer)
          setDisplayText(text) // Ensure final text is correct
          return
        }
        
        const charIndex = charIndices[currentIndex]
        revealedSet.add(charIndex)
        
        const newText = text.split('').map((char, index) => {
          if (revealedSet.has(index)) return char
          return characters[Math.floor(Math.random() * characters.length)]
        }).join('')
        
        setDisplayText(newText)
        currentIndex++
      }, revealDuration / text.length)
    }
    
    startScrambling()
    
    return () => {
      clearInterval(scrambleTimer)
      clearInterval(revealTimer)
    }
  }, [isVisible, text, scrambleDuration, revealDuration, scrambleInterval])
  
  return <span ref={setElementRef}>{displayText || text}</span>
}

// Down Arrow Component
const DownArrow = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (scrollTop < 40) {
        setShouldRender(true)
        setIsVisible(true)
      } else {
        setIsVisible(false)
        timeoutRef.current = setTimeout(() => setShouldRender(false), 400)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleClick = () => {
    const element = document.querySelector('[data-section="thesis"]')
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  if (!shouldRender) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-[50rem] left-1/2 transform -translate-x-1/2 z-50"
    >
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="text-muted hover:text-foreground transition-colors duration-200 cursor-pointer"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-6 mx-auto"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 13l5 5 5-5" />
            <path d="M7 6l5 5 5-5" />
          </svg>
        </motion.div>
      </motion.button>
    </motion.div>
  )
}

// Footer Component
const Footer = () => (
  <footer className="w-full bg-black text-white border-t border-gray-800 mt-8 pt-12 pb-6 px-6 font-serif">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
      {/* Left: Logo, tagline, socials */}
      <div className="flex-1 min-w-[220px] flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          {/* Gamma logo and Prophet logo text only, styled like main heading */}
          <Image src="/gamma.png" alt="Gamma" width={32} height={32} className="w-8 h-8" />
          <span className="font-display text-3xl md:text-4xl font-bold tracking-tight">Prophet</span>
        </div>
        <div className="text-sm md:text-base text-muted mb-2 font-serif">
          Bet on <span className="text-green-500">anything</span> & <span className="text-green-500">anyone</span>, <span className="text-green-500">anytime</span>
        </div>
        <div className="flex gap-4 text-lg mt-2">
          <a href="#" aria-label="LinkedIn" className="hover:text-green-500"><i className="fa-brands fa-linkedin-in"></i></a>
          <a href="#" aria-label="X" className="hover:text-green-500"><i className="fa-brands fa-x-twitter"></i></a>
          <a href="#" aria-label="Discord" className="hover:text-green-500"><i className="fa-brands fa-discord"></i></a>
          <a href="mailto:prophetmarkets@gmail.com" aria-label="Email" className="hover:text-green-500"><i className="fa-solid fa-envelope"></i></a>
        </div>
      </div>
      {/* Right: Link columns */}
      <div className="flex flex-1 justify-end gap-16 w-full max-w-3xl">
        <div>
          <div className="font-semibold mb-3">Product</div>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-green-500">About</a></li>
            <li><a href="#" className="hover:text-green-500">Help Center</a></li>
            <li><a href="#" className="hover:text-green-500">Regulatory</a></li>
            <li><a href="#" className="hover:text-green-500">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Social</div>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-green-500">LinkedIn</a></li>
            <li><a href="#" className="hover:text-green-500">X (Twitter)</a></li>
            <li><a href="#" className="hover:text-green-500">Instagram</a></li>
            <li><a href="#" className="hover:text-green-500">TikTok</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Company</div>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-green-500">Careers</a></li>
            <li><a href="#" className="hover:text-green-500">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-green-500">User Data</a></li>
            <li><a href="#" className="hover:text-green-500">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mt-10 pt-6 border-t border-gray-800 text-xs text-gray-500">
      <div>© {new Date().getFullYear()} Prophet Markets, Inc.</div>
      <div className="mt-2 md:mt-0">Made with <span className="ml-1">💖</span></div>
    </div>
  </footer>
)

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const welcomeTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    setIsSubmittingEmail(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - show welcome message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShowWelcome(true);
        setIsFading(false);
        setIsVisible(false);
        setEmail("");
        if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current);
        if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
        // Fade out after 3s
        welcomeTimeout.current = setTimeout(() => {
          setIsFading(true);
          fadeTimeout.current = setTimeout(() => setShowWelcome(false), 500);
        }, 3000);
      } else {
        // Error - show error message briefly
        const originalEmail = email;
        setEmail('');
        setTimeout(() => {
          setEmail(originalEmail);
        }, 100);
        
        // You could also show an error toast here
        console.error('Waitlist error:', data.error);
        alert(data.error || 'Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  useEffect(() => {
    if (showWelcome) {
      // Trigger fade-in after mount
      const t = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [showWelcome]);

  useEffect(() => {
    return () => {
      if (welcomeTimeout.current) clearTimeout(welcomeTimeout.current);
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, []);

  return (
    <>
      {showWelcome && (
        <div className="fixed top-0 left-0 w-full z-[100] flex justify-center">
          <div className={`mt-6 bg-neutral-900 text-green-500 px-6 py-3 rounded-xl shadow-lg font-serif text-sm font-semibold italic transition-opacity duration-500 ${isVisible && !isFading ? 'opacity-100' : 'opacity-0'}`}
          >
            welcome to prophet
          </div>
        </div>
      )}
      <div className="relative min-h-[221vh] flex items-center justify-center">
        {/* Gamma image in top left */}
        <div className="absolute top-8 left-8 z-20 flex items-center">
          <Image src="/gamma.png" alt="Gamma" width={32} height={32} className="w-8 h-8" />
        </div>
        {/* Waitlist button in top right - only show when not logged in */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute top-8 right-8 z-20 flex gap-16"
          >
            <Link href="/demo">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-sm md:text-base text-white hover:text-gray-200 transition-colors duration-200 font-serif cursor-pointer"
              >
                Demo
              </motion.button>
            </Link>
            <motion.button
              onClick={() => {
                const element = document.querySelector('[data-section="waitlist"]')
                if (element) {
                  const y = element.getBoundingClientRect().top + window.scrollY - 64;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-sm md:text-base text-white hover:text-gray-200 transition-colors duration-200 font-serif cursor-pointer"
            >
              Waitlist
            </motion.button>
          </motion.div>
        )}

        {/* Simple centered content */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto -mt-240">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo */}
            <h1 className="font-display text-6xl md:text-8xl font-bold mb-6 tracking-tight">
              Prophet
            </h1>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl mb-12 text-muted">
              Bet on anything & anyone, anytime
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn bg-black hover:bg-green-600 text-green-500 hover:text-black border-green-500 hover:border-green-600 px-8 py-3 rounded-full text-base transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                >
                  Get Started
                </motion.button>
              </Link>

              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary px-8 py-3 rounded-full text-base cursor-pointer"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Subtle accent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute -bottom-20 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-px h-20 bg-gradient-to-b from-border to-transparent" />
          </motion.div>
        </div>

        {/* Animated Down Arrow */}
        <DownArrow />

        {/* Why Section */}
        <motion.div
          data-section="thesis"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="absolute bottom-4 left-[49%] transform -translate-x-1/2 text-left max-w-3xl px-6"
        >
          <h3 className="text-base md:text-lg text-green-500 font-serif mb-5 text-left">
            <AnimatedScrambleText 
              text="prediction markets are eating the truth"
              scrambleDuration={1500}
              revealDuration={750}
              scrambleInterval={75}
            />
          </h3>
          <p className="text-xs md:text-sm text-muted font-serif mb-16 leading-relaxed text-left">
            We believe ideal, liquid prediction markets are the greatest determinants of truth. They align incentives on every level.<br /><br />
            But existing markets don’t scale. Market actors are containerized to predicting only a handful of actions, ideas, and events. This fundamentally misses the point of a democratic predictions market. At Prophet we are exploring how to use markets to do something far greater.<br /><br />
            The idea is simple: prophets create markets and stake their claims. Our AI agents arbitrate the process from zero to one.<br /><br />
            Agents handle the outcome of markets through voting and a consensus thesis determines the distribution of initial stakeholders and winners.<br /><br />
            Prophet lets you bet on anything you dream of through our validation mechanism. We allow for potentially an infinite number of markets by scaling back human validation.<br /><br />
            Be your own VC. Bet on or even against yourself. Bet on institutions. Bet against a nation. Bet against us if you want to.<br /><br />
            Become a prophet and bet on anything and anyone, anytime.<br /><br />
            Our team is heavily inspired by Bob Doyle’s work: <a href="https://www.informationphilosopher.com/" className="text-green-500 hover:text-green-400 transition-colors duration-200" target="_blank" rel="noopener noreferrer">https://www.informationphilosopher.com/</a>
          </p>
          <div data-section="waitlist">
            <h3 className="text-base md:text-lg text-green-500 font-serif mt-6 mb-4 text-left">
              <AnimatedScrambleText 
                text="private beta"
                scrambleDuration={1500}
                revealDuration={750}
                scrambleInterval={75}
              />
            </h3>
            <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left mb-0">
              Sign up below to join the waitlist.
            </p>
          </div>
          <form className="flex items-center gap-2 mt-1 mb-16" onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="enter your email"
              className="flex-1 px-3 py-[4px] rounded-lg border border-white focus:outline-none focus:ring-0 text-[0.7rem] font-serif text-gray-500 placeholder:font-serif placeholder:text-gray-400"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmittingEmail}
            />
            <button
              type="submit"
              disabled={isSubmittingEmail}
              className="px-3 py-[4px] rounded-lg bg-black border border-white text-white text-[0.7rem] font-serif hover:bg-gray-900 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingEmail ? '⏳' : '📩'}
            </button>
          </form>
          <h3 className="text-base md:text-lg text-green-500 font-serif mt-6 mb-4 text-left">
            <AnimatedScrambleText 
              text="join us"
              scrambleDuration={1500}
              revealDuration={750}
              scrambleInterval={75}
            />
          </h3>
          <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left">
            Our team is a small—but growing—group of outlier talent with experience across infrastructure and prediction markets. We only build to win and win big. Prophet is always looking for exceptional people. If you're interested in our mission, reach out: <a href="mailto:prophetmarkets@gmail.com" className="text-green-500 hover:text-green-400 transition-colors duration-200">prophetmarkets@gmail.com</a>.
          </p>
          <p className="text-sm md:text-base text-muted font-serif leading-relaxed text-left mb-1 mt-4">
            We're hiring for:
          </p>
          <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left flex justify-between">
            <span>Software Engineer</span>
            <span>San Francisco, CA</span>
          </p>
          <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left flex justify-between">
            <span>Product Designer</span>
            <span>San Francisco, CA</span>
          </p>
          <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left flex justify-between">
            <span>Go-To-Market</span>
            <span>San Francisco, CA</span>
          </p>
          <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left flex justify-between">
            <span>Operations</span>
            <span>San Francisco, CA</span>
          </p>
          <p className="text-xs md:text-sm text-muted font-serif leading-relaxed text-left flex justify-between mb-10">
            <span>General Talent</span>
            <span>San Francisco, CA</span>
          </p>
        </motion.div>

        {/* Glass overlay elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 glass rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-20 right-10 w-96 h-96 glass rounded-full blur-3xl opacity-20" />
        </div>
      </div>
      <Footer />
    </>
  )
}
