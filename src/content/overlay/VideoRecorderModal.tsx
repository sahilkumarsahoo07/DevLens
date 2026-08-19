import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Mic,
  MicOff,
  Download,
  X,
  RefreshCw,
  Film,
  Clock,
  HardDrive,
  Monitor,
  Sliders,
  Volume2,
  CheckSquare,
  Square as SquareIcon,
  AlertCircle,
  Pause,
  Play,
  Square,
  Minus,
  Maximize2,
  GripHorizontal
} from 'lucide-react';

interface VideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export const VideoRecorderModal: React.FC<VideoRecorderModalProps> = ({
  isOpen,
  onClose,
  onRecordingStateChange
}) => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'preview'>('idle');
  
  // Interactive Toggle States
  const [includeMic, setIncludeMic] = useState<boolean>(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState<boolean>(true);
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '4k'>('1080p');

  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'webm' | 'mp4'>('webm');
  const [videoMetadata, setVideoMetadata] = useState<{ duration: string; sizeMb: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Floating Pill UI State
  const [isPillMinimized, setIsPillMinimized] = useState<boolean>(false);
  const [pillPosition, setPillPosition] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const isDraggingRef = useRef<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const pillBarRef = useRef<HTMLDivElement | null>(null);

  // Format seconds to mm:ss
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Notify parent component of recording state
  useEffect(() => {
    const isRec = status === 'recording' || status === 'paused';
    onRecordingStateChange?.(isRec);
  }, [status, onRecordingStateChange]);

  // Apply Chrome RestrictionTarget hideFromCapture AFTER DOM element is mounted
  useEffect(() => {
    if ((status === 'recording' || status === 'paused') && pillBarRef.current && streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && 'RestrictionTarget' in window) {
        try {
          (window as any).RestrictionTarget.fromElement(pillBarRef.current)
            .then((target: any) => {
              if (typeof (videoTrack as any).hideFromCapture === 'function') {
                return (videoTrack as any).hideFromCapture(target);
              }
            })
            .catch((err: any) => {
              console.warn('RestrictionTarget hideFromCapture exception:', err);
            });
        } catch (e) {
          console.warn('RestrictionTarget error:', e);
        }
      }
    }
  }, [status]);

  // Timer interval control (accurately handles pause & resume)
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Global Keyboard Shortcuts (Esc to Stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (status === 'recording' || status === 'paused')) {
        e.preventDefault();
        handleStopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      stopAllTracks();
    };
  }, []);

  const stopAllTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Draggable Floating Pill Mouse Event Handlers
  const handleDragStart = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragOffsetRef.current = {
      x: e.clientX - pillPosition.x,
      y: e.clientY - pillPosition.y
    };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newX = moveEvt.clientX - dragOffsetRef.current.x;
      const newY = moveEvt.clientY - dragOffsetRef.current.y;
      setPillPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Trigger Screen Picker & Start Recording Flow
  const handleStartFlow = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    try {
      let displayStream: MediaStream | null = null;

      // Method A: Chrome Extension desktopCapture API via Background Worker
      let streamId: string | null = null;
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
          const res = await new Promise<{ streamId: string | null; error: string | null }>((resolve) => {
            chrome.runtime.sendMessage({ type: 'REQUEST_DESKTOP_CAPTURE' }, (response) => {
              if (chrome.runtime.lastError) {
                resolve({ streamId: null, error: chrome.runtime.lastError.message || 'Error' });
              } else {
                resolve({
                  streamId: response?.streamId || null,
                  error: response?.error || null
                });
              }
            });
          });

          if (res && res.streamId) {
            streamId = res.streamId;
          }
        } catch (msgErr) {
          console.warn('Chrome runtime desktopCapture request failed, falling back to getDisplayMedia:', msgErr);
        }
      }

      if (streamId) {
        const maxWidth = videoQuality === '4k' ? 3840 : videoQuality === '1080p' ? 1920 : 1280;
        const maxHeight = videoQuality === '4k' ? 2160 : videoQuality === '1080p' ? 1080 : 720;

        const constraints: any = {
          audio: includeSystemAudio ? {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: streamId
            }
          } : false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: streamId,
              maxWidth,
              maxHeight
            }
          }
        };

        displayStream = await navigator.mediaDevices.getUserMedia(constraints);
      } else {
        // Method B: Standard web getDisplayMedia
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: 'browser' },
            audio: includeSystemAudio
          });
        } catch (fallbackErr: any) {
          if (fallbackErr.name === 'NotAllowedError') {
            setErrorMessage('Screen capture permission was canceled or denied.');
            return;
          }
          displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        }
      }

      if (!displayStream) {
        setErrorMessage('Failed to capture screen stream.');
        return;
      }

      // Mix Microphone Track if enabled
      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const micTrack = micStream.getAudioTracks()[0];
          if (micTrack) {
            displayStream.addTrack(micTrack);
          }
        } catch (micErr) {
          console.warn('Microphone permission denied or unavailable:', micErr);
        }
      }

      streamRef.current = displayStream;
      recordedChunksRef.current = [];

      // Determine best supported MimeType
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType) && MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(displayStream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const type = mimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedBlobUrl(url);

        const sizeMb = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
        setVideoMetadata({
          duration: formatTimer(recordingTime),
          sizeMb
        });

        setStatus('preview');
        stopAllTracks();
      };

      // Listen for browser "Stop Sharing" floating bar event
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      // Switch to recording state
      setStatus('recording');
      setRecordingTime(0);

      // Start recording
      recorder.start(500);

    } catch (err: any) {
      console.error('Error starting video recording stream:', err);
      setStatus('idle');
      setErrorMessage(err?.message || 'Could not start screen recorder.');
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownloadVideo = () => {
    if (!recordedBlobUrl || !recordedBlob) return;

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `DevLens_Recording_${dateStr}.${downloadFormat}`;

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'DOWNLOAD_ASSET',
          payload: { url: recordedBlobUrl, filename }
        },
        (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            triggerAnchorDownload(recordedBlobUrl, filename);
          }
        }
      );
    } else {
      triggerAnchorDownload(recordedBlobUrl, filename);
    }
  };

  const triggerAnchorDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlob(null);
    setRecordedBlobUrl(null);
    setVideoMetadata(null);
    setRecordingTime(0);
    setStatus('idle');
    setErrorMessage(null);
    setIsPillMinimized(false);
  };

  // Fix HTML5 Video WebM Duration / Timeline Scrubbing Progress Bar Bug in Chrome
  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!isFinite(video.duration) || isNaN(video.duration) || video.duration === 0) {
      video.currentTime = 1e101;
      const onTimeUpdate = () => {
        video.ontimeupdate = null;
        video.currentTime = 0;
      };
      video.ontimeupdate = onTimeUpdate;
    }
  };

  if (!isOpen) return null;

  // ACTIVE RECORDING / PAUSED STATE:
  // Sleek, dark, glassmorphic floating pill controller bar (matching user screenshot) directly in Webpage DOM!
  // Includes drag handle, minimize/collapse toggle, and ESC key shortcut!
  if (status === 'recording' || status === 'paused') {
    return (
      <div
        ref={pillBarRef}
        style={{
          position: 'fixed',
          right: `${pillPosition.x}px`,
          bottom: `${pillPosition.y}px`,
          zIndex: 2147483647,
          pointerEvents: 'auto',
          background: '#0b0f19',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          borderRadius: isPillMinimized ? '20px' : '30px',
          padding: isPillMinimized ? '6px 12px' : '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: isPillMinimized ? '8px' : '12px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85), 0 0 15px rgba(239, 68, 68, 0.25)',
          userSelect: 'none',
          backdropFilter: 'blur(12px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: 'padding 0.2s ease, border-radius 0.2s ease'
        }}
      >
        {/* Drag Handle */}
        <div
          onMouseDown={handleDragStart}
          title="Click and drag to move controller"
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)' }}
        >
          <GripHorizontal size={14} />
        </div>

        {/* Pulsing Red Dot & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: status === 'recording' ? '#ef4444' : '#f59e0b',
              boxShadow: status === 'recording' ? '0 0 10px #ef4444' : 'none',
              animation: status === 'recording' ? 'devlens-red-pulse 1.5s infinite' : 'none'
            }}
          />
          <span
            style={{
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: '1px'
            }}
          >
            {formatTimer(recordingTime)}
          </span>
        </div>

        {/* Full Controls when expanded */}
        {!isPillMinimized && (
          <>
            {/* Divider */}
            <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.2)' }} />

            {/* Pause / Resume Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (status === 'recording') {
                  handlePauseRecording();
                } else {
                  handleResumeRecording();
                }
              }}
              title={status === 'recording' ? 'Pause Recording' : 'Resume Recording'}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {status === 'recording' ? (
                <Pause size={15} fill="#ffffff" />
              ) : (
                <Play size={15} fill="#ffffff" />
              )}
            </button>

            {/* Stop & Preview Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleStopRecording();
              }}
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '20px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                transition: 'transform 0.1s ease'
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Square size={11} fill="#ffffff" />
              <span>Stop &amp; Preview</span>
            </button>
          </>
        )}

        {/* Minimize / Expand Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsPillMinimized((prev) => !prev);
          }}
          title={isPillMinimized ? 'Expand Controls' : 'Minimize Controller Bar'}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            padding: '6px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        >
          {isPillMinimized ? <Maximize2 size={13} /> : <Minus size={14} />}
        </button>

        {/* Inline Keyframe animation */}
        <style>{`
          @keyframes devlens-red-pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(0.85); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="devlens-modal-overlay">
      <div
        className="devlens-modal"
        style={{
          width: '580px',
          maxWidth: '94vw',
          background: 'var(--dl-bg)',
          borderRadius: '12px',
          border: '1px solid var(--dl-border)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div className="devlens-panel-header" style={{ padding: '14px 18px' }}>
          <div className="devlens-panel-title" style={{ fontSize: '15px' }}>
            <Film size={18} style={{ color: '#ef4444' }} />
            <span>DevLens Screen & Video Recorder Pro</span>
          </div>

          <button
            onClick={() => {
              handleStopRecording();
              onClose();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--dl-text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="devlens-panel-body" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* IDLE MODE: Interactive Configuration */}
          {status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Monitor size={32} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--dl-text)', marginBottom: '2px' }}>
                    HD Webpage & Screen Video Recorder
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--dl-text-muted)', lineHeight: '1.4' }}>
                    Record your active browser tab, window, or full screen with audio. Download HD video files instantly.
                  </div>
                </div>
              </div>

              {/* Quality & Audio Settings Card */}
              <div
                style={{
                  background: 'var(--dl-bg)',
                  border: '1px solid var(--dl-border)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dl-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} style={{ color: 'var(--dl-primary)' }} />
                  <span>Recording Settings</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Microphone Audio Card Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIncludeMic((prev) => !prev);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      background: includeMic ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0,0,0,0.04)',
                      border: includeMic ? '1px solid #ef4444' : '1px solid var(--dl-border)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      userSelect: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ color: includeMic ? '#ef4444' : 'var(--dl-text-muted)', display: 'flex' }}>
                      {includeMic ? <CheckSquare size={18} /> : <SquareIcon size={18} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--dl-text)' }}>
                      {includeMic ? <Mic size={15} style={{ color: '#22c55e' }} /> : <MicOff size={15} style={{ color: 'var(--dl-text-muted)' }} />}
                      <span>Microphone Audio</span>
                    </div>
                  </div>

                  {/* System Audio Card Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIncludeSystemAudio((prev) => !prev);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      background: includeSystemAudio ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0,0,0,0.04)',
                      border: includeSystemAudio ? '1px solid #ef4444' : '1px solid var(--dl-border)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      userSelect: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ color: includeSystemAudio ? '#ef4444' : 'var(--dl-text-muted)', display: 'flex' }}>
                      {includeSystemAudio ? <CheckSquare size={18} /> : <SquareIcon size={18} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--dl-text)' }}>
                      <Volume2 size={15} style={{ color: includeSystemAudio ? 'var(--dl-primary)' : 'var(--dl-text-muted)' }} />
                      <span>Tab System Audio</span>
                    </div>
                  </div>
                </div>

                {/* Resolution Quality Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', paddingTop: '6px' }}>
                  <span style={{ color: 'var(--dl-text-muted)', fontWeight: 600 }}>Resolution Quality:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['720p', '1080p', '4k'] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoQuality(q);
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: videoQuality === q ? '1px solid #ef4444' : '1px solid var(--dl-border)',
                          background: videoQuality === q ? '#ef4444' : 'var(--dl-bg)',
                          color: videoQuality === q ? '#ffffff' : 'var(--dl-text)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Action Button */}
              <button
                type="button"
                onClick={handleStartFlow}
                className="devlens-btn devlens-btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <Video size={20} />
                <span>Start Screen & Tab Recording</span>
              </button>
            </div>
          )}

          {/* PREVIEW MODE */}
          {status === 'preview' && recordedBlobUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* HTML5 Video Player with Chrome Duration Fix */}
              <div
                style={{
                  background: '#000000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  maxHeight: '280px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <video
                  src={recordedBlobUrl}
                  controls
                  autoPlay
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain' }}
                />
              </div>

              {/* Video Stats */}
              {videoMetadata && (
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--dl-text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} style={{ color: 'var(--dl-primary)' }} />
                    <span>Duration: <strong style={{ color: 'var(--dl-text)' }}>{videoMetadata.duration}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HardDrive size={13} style={{ color: '#22c55e' }} />
                    <span>Size: <strong style={{ color: 'var(--dl-text)' }}>{videoMetadata.sizeMb}</strong></span>
                  </div>
                </div>
              )}

              {/* Format Selection & Download */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600 }}>
                  <span>Format:</span>
                  <select
                    value={downloadFormat}
                    onChange={(e) => setDownloadFormat(e.target.value as any)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--dl-border)',
                      background: 'var(--dl-bg)',
                      color: 'var(--dl-text)',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  >
                    <option value="webm">WebM (Standard)</option>
                    <option value="mp4">MP4</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="devlens-btn"
                    style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} /> Record Again
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="devlens-btn devlens-btn-primary"
                    style={{
                      fontSize: '11px',
                      padding: '6px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontWeight: 700
                    }}
                  >
                    <Download size={14} /> Download Video
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
