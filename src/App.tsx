import { AudioPlayer } from './components/AudioPlayer';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Audio Player with Subtitles</h1>
      <AudioPlayer />
    </div>
  );
}

export default App;
