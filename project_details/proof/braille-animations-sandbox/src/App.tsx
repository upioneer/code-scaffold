import React, { useState, useEffect } from 'react';
import spinners from 'unicode-animations';
import { Terminal, Activity, Loader2, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom hook to drive the unicode spinners in React state
function useSpinner(spinnerObj: any, fallbackFrames?: string[]) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const frames = spinnerObj?.frames || fallbackFrames;
    if (!frames?.length) return;
    
    const interval = spinnerObj?.interval || 80;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, interval);

    return () => clearInterval(timer);
  }, [spinnerObj, fallbackFrames]);

  const frames = spinnerObj?.frames || fallbackFrames;
  return frames ? frames[frameIndex] : '';
}

export default function App() {
  const brailleSpinner = useSpinner((spinners as any).braille, ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']);
  const dotsSpinner = useSpinner((spinners as any).dots, ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈']);
  const lineSpinner = useSpinner((spinners as any).line, ['-', '\\', '|', '/']);
  const snakeSpinner = useSpinner((spinners as any).snake, ['⠁', '⠃', '⠇', '⡇', '⣇', '⣧', '⣷', '⣿', '⣾', '⣼', '⣸', '⢸', '⠸', '⠘', '⠈']);
  const weatherSpinner = useSpinner((spinners as any).weather, ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌩️']);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-y-auto">
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(rgba(34,211,238,0.1)_1px,transparent_1px)] [background-size:24px_24px] opacity-30"></div>
      
      {/* Top Banner */}
      <div className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl z-10 sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-widest text-white">Braille Animations</h1>
          </div>
          <code className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-3 py-1.5 rounded-full border border-cyan-900">
            npx @code-scaffold/skills install braille-animations
          </code>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10 space-y-16">
        
        {/* Header Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            High-Density Terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Kinematics</span>
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Braille characters offer 8 distinct "pixels" (a 2x4 grid) per standard terminal character slot. This allows for incredibly smooth, high-resolution loading indicators and ASCII animations in CLI environments.
          </p>
        </motion.section>

        {/* Live Demos Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <AnimationCard 
            title="Standard Braille" 
            icon={<Loader2 className="w-5 h-5" />}
            frame={brailleSpinner}
            description="The classic smooth rotary spinner utilizing full 8-dot braille patterns."
          />
          
          <AnimationCard 
            title="Dot Pulse" 
            icon={<Activity className="w-5 h-5" />}
            frame={dotsSpinner}
            description="A pulsing single-dot sequence traveling through the braille matrix."
          />
          
          <AnimationCard 
            title="Line Sweep" 
            icon={<Terminal className="w-5 h-5" />}
            frame={lineSpinner}
            description="A sweeping line simulation for wider loading bar sequences."
          />
          
          <AnimationCard 
            title="Snake Tracer" 
            icon={<Activity className="w-5 h-5" />}
            frame={snakeSpinner}
            description="A boundary-tracing snake animation rendered via unicode."
          />
          
          <AnimationCard 
            title="Weather Symbols" 
            icon={<Activity className="w-5 h-5" />}
            frame={weatherSpinner}
            description="Non-braille unicode weather icons for status indicators."
          />

        </section>

        {/* Code Context Section */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Code2 className="text-cyan-400" /> NodeJS Implementation
            </h3>
            <p className="text-slate-400">
              Integrating these animations into your Node.js CLI tool is trivial. You use standard <code>process.stdout.write</code> alongside carriage returns to overwrite the current line in the terminal window.
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-inner font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-pink-400">import</span> spinners <span className="text-pink-400">from</span> <span className="text-green-400">'unicode-animations'</span>;<br/><br/>
              <span className="text-blue-400">const</span> &#123; frames, interval &#125; = spinners.braille;<br/>
              <span className="text-blue-400">let</span> i = <span className="text-amber-400">0</span>;<br/><br/>
              <span className="text-blue-400">const</span> timer = <span className="text-yellow-200">setInterval</span>(() =&gt; &#123;<br/>
              &nbsp;&nbsp;process.stdout.<span className="text-yellow-200">write</span>(<span className="text-green-400">`\r\x1B[2K $&#123;frames[i++ % frames.length]&#125; Compiling payload...`</span>);<br/>
              &#125;, interval);
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Code2 className="text-cyan-400" /> React State Mapping
            </h3>
            <p className="text-slate-400">
              When bringing these to the browser (as seen in this sandbox), map the animation loop to React state. Ensure you strictly manage the <code>useEffect</code> cleanup to prevent memory leaks in the client.
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-inner font-mono text-sm leading-relaxed overflow-x-auto">
              <span className="text-blue-400">function</span> <span className="text-yellow-200">useSpinner</span>(spinner) &#123;<br/>
              &nbsp;&nbsp;<span className="text-blue-400">const</span> [frame, setFrame] = <span className="text-yellow-200">useState</span>(<span className="text-amber-400">0</span>);<br/><br/>
              &nbsp;&nbsp;<span className="text-yellow-200">useEffect</span>(() =&gt; &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">const</span> t = <span className="text-yellow-200">setInterval</span>(() =&gt; &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-yellow-200">setFrame</span>(f =&gt; (f + <span className="text-amber-400">1</span>) % spinner.frames.length);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;, spinner.interval);<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-400">return</span> () =&gt; <span className="text-yellow-200">clearInterval</span>(t);<br/>
              &nbsp;&nbsp;&#125;, [spinner]);<br/><br/>
              &nbsp;&nbsp;<span className="text-pink-400">return</span> spinner.frames[frame];<br/>
              &#125;
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AnimationCard({ title, icon, frame, description }: { title: string, icon: React.ReactNode, frame: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col items-start gap-4"
    >
      <div className="flex items-center gap-3 w-full border-b border-slate-800/50 pb-4 mb-2">
        <div className="text-cyan-400">{icon}</div>
        <h3 className="font-bold text-white tracking-wide">{title}</h3>
      </div>
      
      <div className="flex items-center gap-4 bg-slate-950 px-6 py-4 rounded-xl border border-slate-800 w-full justify-center">
        <span className="text-4xl text-cyan-400 w-8 h-8 flex items-center justify-center font-mono">
          {frame || '⠋'}
        </span>
        <span className="text-slate-500 font-mono text-sm uppercase tracking-widest">
          Running
        </span>
      </div>

      <p className="text-sm text-slate-400 mt-2">
        {description}
      </p>
    </motion.div>
  );
}
