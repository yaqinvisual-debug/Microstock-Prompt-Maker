
import React, { useState, useCallback } from 'react';
import { generateAnimationPrompts } from './services/geminiService';
import type { BackgroundOption, AudioOption, StyleOption, GenerationType } from './types';

// --- Helper Components ---

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M10.868 2.884c.321.64.321 1.393 0 2.034l-1.428 2.856c-.16.32-.383.58-.644.76l-2.856 1.428c-.64.32-1.393.32-2.034 0l-1.428-2.856a1.498 1.498 0 0 1-.644-.76L.456 5.918c-.32-.64-.32-1.393 0-2.034l1.428-2.856c.16-.32.383-.58.644-.76L5.384.41c.64-.32 1.393.32 2.034 0l1.428 2.856c.16.32.383.58.644.76l2.856 1.428.002-.001Zm5.024 10.992c.32.64.32 1.393 0 2.034l-1.428 2.856c-.16.32-.383.58-.644.76l-2.856 1.428c-.64.32-1.393.32-2.034 0l-1.428-2.856a1.498 1.498 0 0 1-.644-.76l-1.428-2.856c-.32-.64-.32-1.393 0-2.034l1.428-2.856c.16-.32.383-.58.644-.76l2.856-1.428c.64-.32 1.393.32 2.034 0l1.428 2.856c.16.32.383.58.644.76l2.856 1.428Z" clipRule="evenodd" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375-3.375-3.375M15 12h-7.5" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


const Spinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [userInput, setUserInput] = useState<string>('');
  const [generationType, setGenerationType] = useState<GenerationType>('video');
  const [background, setBackground] = useState<BackgroundOption>('detailed');
  const [style, setStyle] = useState<StyleOption>('auto');
  const [audio, setAudio] = useState<AudioOption>('no_audio');
  const [promptCount, setPromptCount] = useState<number>(3);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!userInput.trim()) {
      setError("Please describe your idea.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPrompts([]);

    try {
      const prompts = await generateAnimationPrompts(userInput, background, promptCount, audio, style, generationType);
      setGeneratedPrompts(prompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [userInput, background, promptCount, audio, style, generationType]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = () => {
    if (generatedPrompts.length === 0) return;
    const content = generatedPrompts.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generationType}-prompts.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-3xl mx-auto">

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Prompt Pro
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Generate professional prompts for microstock platforms.
          </p>
        </header>

        {/* Form */}
        <main className="bg-gray-800/50 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6 border border-gray-700">
          <div className="space-y-2">
            <label htmlFor="userInput" className="block text-sm font-medium text-gray-300">
              1. Describe your idea
            </label>
            <textarea
              id="userInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., a cute robot waving, a photorealistic portrait of a cat, a seamless loop of geometric shapes"
              className="w-full h-28 p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              aria-label="Idea description"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              2. Generation Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900 border border-gray-600 rounded-lg">
                <button 
                onClick={() => setGenerationType('video')} 
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${generationType === 'video' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                Animation / Video
                </button>
                <button 
                onClick={() => setGenerationType('image')} 
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${generationType === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
                >
                Image
                </button>
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="background" className="block text-sm font-medium text-gray-300">
                3. Background
              </label>
              <select
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value as BackgroundOption)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                aria-label="Background style selector"
              >
                <option value="detailed">Detailed Background</option>
                <option value="greenscreen">Green Screen</option>
              </select>
            </div>
             <div className="space-y-2">
              <label htmlFor="style" className="block text-sm font-medium text-gray-300">
                4. Style
              </label>
              <select
                id="style"
                value={style}
                onChange={(e) => setStyle(e.target.value as StyleOption)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                aria-label="Animation style selector"
              >
                <option value="auto">Let AI Decide</option>
                <option value="3d_render">3D Render</option>
                <option value="flat_design">Flat Design</option>
                <option value="cartoon">Cartoon</option>
                <option value="pixel_art">Pixel Art</option>
                <option value="watercolor">Watercolor</option>
                <option value="isometric">Isometric</option>
                <option value="cinematic">Cinematic</option>
                <option value="realistic">Realistic</option>
                <option value="surrealism">Surrealism</option>
              </select>
            </div>
             <div className="space-y-2">
              <label htmlFor="audio" className="block text-sm font-medium text-gray-300">
                5. Audio
              </label>
              <select
                id="audio"
                value={audio}
                onChange={(e) => setAudio(e.target.value as AudioOption)}
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Audio option selector"
                disabled={generationType === 'image'}
              >
                <option value="no_audio">No Audio</option>
                <option value="with_audio">With Audio</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="promptCount" className="block text-sm font-medium text-gray-300">
                6. No. of prompts
              </label>
              <input
                type="number"
                id="promptCount"
                value={promptCount}
                onChange={(e) => setPromptCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                min="1"
                max="20"
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                aria-label="Number of prompts to generate"
              />
            </div>
          </div>


          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-200 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6" />
                Generate {generationType === 'video' ? 'Animation' : 'Image'} Prompt{promptCount > 1 ? 's' : ''}
              </>
            )}
          </button>
        </main>

        {/* Result Section */}
        {(isLoading || error || generatedPrompts.length > 0) && (
          <section className="mt-8 bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700">
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-300">Generated Prompt{generatedPrompts.length > 1 ? 's' : ''}</h2>
                  {generatedPrompts.length > 0 && (
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-200"
                        aria-label="Download all prompts as a text file"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download All
                    </button>
                  )}
              </div>
              
              {isLoading && <Spinner />}
              {error && <p className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
              {generatedPrompts.length > 0 && (
                <div className="space-y-4">
                  {generatedPrompts.map((prompt, index) => (
                    <div key={index} className="relative">
                      <textarea
                        readOnly
                        value={prompt}
                        className="w-full h-36 p-3 pr-12 bg-gray-900 border border-gray-600 rounded-lg text-gray-300 font-mono text-sm leading-relaxed resize-y"
                        aria-label={`Generated prompt ${index + 1}`}
                      />
                      <button
                        onClick={() => handleCopy(prompt, index)}
                        className="absolute top-2 right-2 p-2 text-gray-400 bg-gray-700 rounded-md hover:bg-gray-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
                        aria-label={`Copy prompt ${index + 1}`}
                      >
                        {copiedIndex === index ? (
                          <span className="text-sm text-green-400 px-1">Copied!</span>
                        ) : (
                          <CopyIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
