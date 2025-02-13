import { useState, useRef, useEffect } from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaUpload,
  FaClosedCaptioning,
  FaBackward,
  FaForward
} from 'react-icons/fa';
import { parseSRT, findCurrentSubtitles } from '../utils/srtParser';

interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [allSubtitles, setAllSubtitles] = useState<Subtitle[]>([]);
  const [currentSubtitles, setCurrentSubtitles] = useState<Subtitle[]>([]);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [subtitleFileName, setSubtitleFileName] = useState<string>('');
  const [contextSize, setContextSize] = useState(1);
  const [subtitleHeights, setSubtitleHeights] = useState<{[key: number]: number}>({});
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const subtitleRefs = useRef<{[key: number]: HTMLDivElement}>({});

  const calculatePosition = (index: number) => {
    const spacing = 12; // Gap between subtitles
    let position = spacing;
    
    // Calculate position based on heights of previous subtitles
    for (let i = 0; i < index; i++) {
      const prevHeight = subtitleHeights[currentSubtitles[i]?.id] || 0;
      position += prevHeight + spacing;
    }

    return position;
  };

  const calculateContainerHeight = () => {
    if (currentSubtitles.length === 0) return 100;
    
    let totalHeight = 24; // Initial padding
    currentSubtitles.forEach((sub) => {
      totalHeight += (subtitleHeights[sub.id] || 0) + 12; // Add height + spacing
    });
    return totalHeight;
  };

  // Update subtitle heights when they change
  const updateSubtitleHeight = (id: number, element: HTMLDivElement | null) => {
    if (element) {
      const height = element.offsetHeight;
      if (height !== subtitleHeights[id]) {
        setSubtitleHeights(prev => ({...prev, [id]: height}));
      }
    }
  };

  useEffect(() => {
    if (allSubtitles.length > 0) {
      const subs = findCurrentSubtitles(allSubtitles, currentTime, contextSize);
      setCurrentSubtitles(subs);
    }
  }, [allSubtitles, currentTime, contextSize]);

  // Debug logging
  useEffect(() => {
    console.log('Current Time:', currentTime);
    console.log('Current Subtitles:', currentSubtitles);
  }, [currentTime, currentSubtitles]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
    }
  };

  const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedSubtitles = parseSRT(text);
      setAllSubtitles(parsedSubtitles);
      setSubtitleFileName(file.name);
    } catch (error) {
      console.error('Error parsing subtitles:', error);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      
      // Immediately update subtitles on seek
      if (allSubtitles.length > 0) {
        const subs = findCurrentSubtitles(allSubtitles, time, contextSize);
        setCurrentSubtitles(subs);
      }
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(url);
      setAudioFileName(file.name);
    }
  };

  const handleClearAudio = () => {
    if (audioFile) {
      URL.revokeObjectURL(audioFile);
    }
    setAudioFile(null);
    setAudioFileName('');
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleClearSubtitles = () => {
    setAllSubtitles([]);
    setCurrentSubtitles([]);
    setSubtitleFileName('');
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-4 relative">
        {audioFileName ? (
          <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg mb-2">
            <div className="flex items-center">
              <FaPlay className="text-gray-400 mr-2" />
              <span className="text-gray-300">{audioFileName}</span>
            </div>
            <button
              onClick={handleClearAudio}
              className="text-red-400 hover:text-red-500 p-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-gray-500">
            <input
              type="file"
              accept=".mp3,.m4a,.aac,.wav,audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            <FaUpload className="mr-2 text-gray-400" />
            <span className="text-gray-400">Upload Audio File</span>
          </label>
        )}
      </div>

      <audio
        ref={audioRef}
        src={audioFile || ''}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="hidden"
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (audioRef.current) {
                const newTime = Math.max(0, currentTime - 15);
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
            className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white"
            title="Back 15 seconds"
          >
            <FaBackward />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button
            onClick={() => {
              if (audioRef.current) {
                const newTime = Math.min(duration, currentTime + 15);
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
            className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white"
            title="Forward 15 seconds"
          >
            <FaForward />
          </button>
        </div>

        <div className="flex items-center flex-1 mx-4">
          <span className="text-gray-300 text-sm mr-2">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeekChange}
            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-gray-300 text-sm ml-2">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center">
          <button className="p-2 text-gray-400 hover:text-white">
            {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer ml-2"
          />
        </div>
      </div>

      <div className="mb-4 relative">
        {subtitleFileName ? (
          <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg mb-2">
            <div className="flex items-center">
              <FaClosedCaptioning className="text-gray-400 mr-2" />
              <span className="text-gray-300">{subtitleFileName}</span>
            </div>
            <button
              onClick={handleClearSubtitles}
              className="text-red-400 hover:text-red-500 p-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-gray-500">
            <input
              type="file"
              accept=".srt"
              onChange={handleSubtitleUpload}
              className="hidden"
            />
            <FaClosedCaptioning className="mr-2 text-gray-400" />
            <span className="text-gray-400">Upload Subtitles (SRT)</span>
          </label>
        )}
      </div>

      <div className="bg-gray-700 p-4 rounded-lg mb-4">
        {allSubtitles.length === 0 ? (
          <p className="text-center text-gray-300">No subtitles loaded</p>
        ) : currentSubtitles.length === 0 ? (
          <p className="text-center text-gray-300">No subtitles at current time</p>
        ) : (
          <div 
            className="subtitle-container"
            style={{ height: calculateContainerHeight() }}
          >
            {currentSubtitles.map((subtitle, index) => {
              // Find active subtitle
              const activeSubtitle = currentSubtitles.find(sub => 
                currentTime >= sub.startTime - 0.1 && currentTime <= sub.endTime + 0.1
              );

              // Find next subtitle
              const nextSubtitleIndex = currentSubtitles.findIndex(sub => currentTime < sub.startTime - 0.1);

              console.log('Subtitle state:', {
                time: currentTime,
                activeSubtitle: activeSubtitle?.text,
                nextIndex: nextSubtitleIndex,
                currentSubtitle: subtitle.text,
                currentIndex: index
              });

              let position;
              if (activeSubtitle) {
                // We have an active subtitle
                if (subtitle.id === activeSubtitle.id) {
                  position = 'current';
                } else if (subtitle.startTime < activeSubtitle.startTime) {
                  position = 'previous';
                } else {
                  position = 'next';
                }
              } else {
                // No active subtitle, position based on next subtitle
                if (nextSubtitleIndex === -1) {
                  // Past all subtitles, show in sequence
                  position = 'previous';
                } else if (index === nextSubtitleIndex) {
                  position = 'current';
                } else if (index < nextSubtitleIndex) {
                  position = 'previous';
                } else {
                  position = 'next';
                }
              }

              return (
                <div
                  key={subtitle.id}
                  ref={el => {
                    subtitleRefs.current[subtitle.id] = el as HTMLDivElement;
                    updateSubtitleHeight(subtitle.id, el);
                  }}
                  className={`subtitle-item p-3 rounded ${
                    position === 'current' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                  style={{
                    position: 'absolute',
                    top: calculatePosition(index),
                    opacity: position === 'current' ? 1 : 0.7,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{subtitle.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <select
          value={contextSize}
          onChange={(e) => setContextSize(Number(e.target.value))}
          className="bg-gray-700 text-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value={0}>No context</option>
          <option value={1}>±1 subtitle</option>
          <option value={2}>±2 subtitles</option>
          <option value={3}>±3 subtitles</option>
        </select>
      </div>
    </div>
  );
};
