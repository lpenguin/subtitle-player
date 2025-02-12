interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

const timeToSeconds = (timeString: string): number => {
  try {
    const [hours, minutes, seconds] = timeString.split(':');
    const [secs, ms] = seconds.split(',');
    
    const totalSeconds = (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(secs) +
      parseInt(ms) / 1000
    );

    console.log(`Converting time: ${timeString} to seconds: ${totalSeconds}`);
    return totalSeconds;
  } catch (error) {
    console.error('Error parsing time:', timeString, error);
    return 0;
  }
};

export const parseSRT = (srtContent: string): Subtitle[] => {
  const subtitles: Subtitle[] = [];
  // Split by double newline and filter out empty blocks
  const blocks = srtContent
    .trim()
    .split(/\r?\n\r?\n/)
    .filter(block => block.trim());

  blocks.forEach((block) => {
    // Split by any type of newline
    const lines = block.split(/\r?\n/);
    if (lines.length < 3) return;

    const id = parseInt(lines[0]);
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
    
    if (!timeMatch) return;

    const startTime = timeToSeconds(timeMatch[1]);
    const endTime = timeToSeconds(timeMatch[2]);
    // Join only the text lines, not the entire rest of the file
    const text = lines.slice(2).join('\n').trim();

    console.log('Parsed subtitle:', { id, startTime, endTime, text });

    subtitles.push({
      id,
      startTime,
      endTime,
      text,
    });
  });

  console.log('Total subtitles parsed:', subtitles.length);
  return subtitles;
};

export const findCurrentSubtitles = (
  subtitles: Subtitle[],
  currentTime: number,
  context: number = 1
): Subtitle[] => {
  console.log('Finding subtitles for time:', currentTime);
  
  const TOLERANCE = 0.1; // 100ms tolerance for time matching
  
  // Find all subtitles that could be current
  const currentSubtitles = subtitles.filter(
    (sub) => currentTime >= sub.startTime - TOLERANCE && currentTime <= sub.endTime + TOLERANCE
  );

  if (currentSubtitles.length === 0) {
    // If no exact match, find the closest subtitle
    // Find the next subtitle, considering the tolerance
    const nextSubtitle = subtitles.find(sub => currentTime < sub.startTime - TOLERANCE);
    if (nextSubtitle) {
      const index = subtitles.indexOf(nextSubtitle);
      const start = Math.max(0, index - context);
      const end = Math.min(subtitles.length, index + context + 1);
      return subtitles.slice(start, end);
    }
    return [];
  }

  // Use the first matching subtitle as the current one
  const currentIndex = subtitles.indexOf(currentSubtitles[0]);
  const start = Math.max(0, currentIndex - context);
  const end = Math.min(subtitles.length, currentIndex + context + 1);

  const result = subtitles.slice(start, end);
  console.log('Found subtitles:', result);
  return result;
};
