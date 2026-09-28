import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { MediaAsset } from '@/types/media';
import { getDeviceProfile } from '@/lib/device';
import { decodeImage, playableVideo, whenIdle } from '@/lib/loading';
import styles from './PlateMedia.module.css';

export interface PlateMediaHandle {
  /** Play/pause the ambient loop (if any) with scene activity. */
  setPlaying: (playing: boolean) => void;
  /** Force loading now (e.g. the stage is approaching the scene). */
  load: () => void;
}

interface PlateMediaProps {
  asset: MediaAsset;
  className?: string;
  /** Called once the still is decoded and visible. */
  onReady?: () => void;
}

/**
 * Renders a manifest asset inside a camera plate: blurred LQIP → decoded still →
 * (optional) ambient loop layered on top. The still always remains as the
 * poster/fallback. (The film's scroll-scrubbed footage is a frame sequence: FilmScene.)
 */
export const PlateMedia = forwardRef<PlateMediaHandle, PlateMediaProps>(function PlateMedia(
  { asset, className, onReady },
  ref,
) {
  const device = getDeviceProfile();
  const [load, setLoad] = useState(asset.priority === 'critical');
  const [imageReady, setImageReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wantPlay = useRef(false);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  const lite = device.liteMedia;
  const avif = lite ? (asset.image.liteAvif ?? asset.image.avif) : asset.image.avif;
  const webp = lite ? (asset.image.liteWebp ?? asset.image.webp) : asset.image.webp;
  const video = playableVideo(asset);
  const videoSrc = video ? (device.isMobile ? (video.mobile ?? video.desktop) : video.desktop) : undefined;
  const videoWebm = video ? (device.isMobile ? video.mobileWebm : video.desktopWebm) : undefined;

  // Idle-priority assets start after first paint.
  useEffect(() => {
    if (load || asset.priority !== 'idle') return;
    let cancelled = false;
    void whenIdle().then(() => {
      if (!cancelled) setLoad(true);
    });
    return () => {
      cancelled = true;
    };
  }, [load, asset.priority]);

  useImperativeHandle(
    ref,
    () => ({
      load: () => setLoad(true),
      setPlaying(playing) {
        wantPlay.current = playing;
        const v = videoRef.current;
        if (!v) return;
        if (playing) void v.play().catch(() => undefined);
        else v.pause();
      },
    }),
    [],
  );

  const handleImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    void decodeImage(img).then(() => {
      setImageReady(true);
      onReadyRef.current?.();
    });
  };

  return (
    <div
      className={`${styles.media} ${className ?? ''}`}
      style={asset.lqip ? { backgroundImage: `url("${asset.lqip}")` } : undefined}
    >
      {load && (
        <picture>
          <source srcSet={avif} type="image/avif" />
          <source srcSet={webp} type="image/webp" />
          <img
            ref={imgRef}
            className={styles.still}
            data-ready={imageReady || undefined}
            src={webp}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            decoding="async"
            fetchPriority={asset.priority === 'critical' ? 'high' : 'auto'}
            onLoad={handleImageLoad}
            draggable={false}
          />
        </picture>
      )}
      {load && video && videoSrc && (
        <video
          ref={videoRef}
          className={styles.video}
          data-ready={videoReady || undefined}
          muted
          playsInline
          loop
          preload="metadata"
          poster={video.poster}
          aria-hidden="true"
          onCanPlay={() => {
            setVideoReady(true);
            if (wantPlay.current) void videoRef.current?.play().catch(() => undefined);
          }}
        >
          {videoWebm && <source src={videoWebm} type="video/webm" />}
          <source src={videoSrc} type="video/mp4" />
        </video>
      )}
    </div>
  );
});
