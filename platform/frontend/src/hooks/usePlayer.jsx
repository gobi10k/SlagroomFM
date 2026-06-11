import { createContext, useContext, useRef, useState, useCallback } from "react";

const PlayerCtx = createContext(null);

export function PlayerProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audio = audioRef.current;

  audio.onended = () => {
    const next = queueIdx + 1;
    if (next < queue.length) {
      play(queue[next], next);
    } else {
      setPlaying(false);
    }
  };
  audio.ontimeupdate = () => setProgress(audio.currentTime);
  audio.ondurationchange = () => setDuration(audio.duration);

  const play = useCallback((track, idx = 0) => {
    const src = track.navidrome_song_id
      ? `/api/library/song/${track.navidrome_song_id}/stream`
      : track.src;
    audio.src = src;
    audio.play();
    setPlaying(true);
    setCurrent(track);
    setQueueIdx(idx);
  }, [audio]);

  const playRadio = useCallback(() => {
    audio.src = "/stream";
    audio.play();
    setPlaying(true);
    setCurrent({ title: "SlagroomFM Live", artist: "", isRadio: true });
    setQueue([]);
  }, [audio]);

  const enqueue = useCallback((tracks) => {
    setQueue(tracks);
    if (tracks.length) play(tracks[0], 0);
  }, [play]);

  const pause = useCallback(() => { audio.pause(); setPlaying(false); }, [audio]);
  const resume = useCallback(() => { audio.play(); setPlaying(true); }, [audio]);
  const seek = useCallback((t) => { audio.currentTime = t; }, [audio]);

  return (
    <PlayerCtx.Provider value={{ current, playing, progress, duration, queue, queueIdx, play, playRadio, enqueue, pause, resume, seek }}>
      {children}
    </PlayerCtx.Provider>
  );
}

export const usePlayer = () => useContext(PlayerCtx);
